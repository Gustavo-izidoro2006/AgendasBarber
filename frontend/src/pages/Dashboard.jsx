import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { api } from "../lib/api";
import Configuracoes from "./Configuracoes";

const inputStyle = {
  width: "100%", padding: "12px 14px",
  borderRadius: 10, border: "1px solid var(--border-default)",
  background: "rgba(255,255,255,0.03)", color: "white", fontWeight: 500, fontSize: 14,
  outline: "none", boxSizing: "border-box",
  transition: "all var(--duration-fast) var(--ease-out)",
  fontFamily: "inherit",
};

const inputFocus = (e) => {
  e.target.style.borderColor = "var(--accent)";
  e.target.style.boxShadow = "0 0 10px var(--accent-glow)";
};

const inputBlur = (e) => {
  e.target.style.borderColor = "var(--border-default)";
  e.target.style.boxShadow = "none";
};

const labelStyle = {
  display: "block", marginBottom: 7, fontWeight: 700, fontSize: 11,
  color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em",
};

function formatarDataISOParaPT(dataISO) {
  if (!dataISO) return "—";
  const [y, m, d] = dataISO.split("-").map((x) => Number(x));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR");
}

function formatarMesAno(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function Modal({ aberto, titulo, onFechar, children }) {
  if (!aberto) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      role="dialog" aria-modal="true" onMouseDown={onFechar}
    >
      <div
        style={{
          width: "100%", maxWidth: 520,
          borderRadius: 20,
          background: "rgba(13,13,16,0.98)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xl)",
          color: "white",
          animation: "scaleIn 0.22s var(--ease-out)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--gold))" }} />
        <div style={{
          padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.015em" }}>{titulo}</div>
          <button onClick={onFechar} style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "transparent", color: "var(--text-muted)",
            cursor: "pointer", fontWeight: 700, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-soft)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger-border)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
          >×</button>
        </div>
        <div style={{ padding: "22px" }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, variant }) {
  const variants = {
    default: { bg: "var(--bg-card)", border: "var(--border-default)", text: "white" },
    gold: { bg: "var(--gold-soft)", border: "var(--gold-border)", text: "var(--gold)" },
    accent: { bg: "var(--accent-soft)", border: "var(--accent-border)", text: "var(--accent)" },
    success: { bg: "var(--success-soft)", border: "var(--success-border)", text: "var(--success)" },
  };
  const v = variants[variant] || variants.default;
  return (
    <div style={{
      padding: "22px", borderRadius: 16,
      background: v.bg, border: `1px solid ${v.border}`,
      boxShadow: "var(--shadow-sm)",
      transition: "all var(--duration-fast) var(--ease-out)",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = v.border; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--text-secondary)",
        }}>
          {label}
        </div>
        {icon && <span style={{ fontSize: 16, color: color || v.text, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em",
        color: color || v.text, lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  );
}

function Botao({ children, onClick, variante = "primario", type = "button", disabled, style }) {
  const styles = {
    primario: {
      background: "linear-gradient(135deg, var(--accent), #c9213f)",
      border: "none", color: "white",
      boxShadow: "0 4px 14px rgba(232,40,74,0.25)",
    },
    perigo: {
      background: "var(--danger-soft)",
      border: "1px solid var(--danger-border)", color: "var(--danger)",
    },
    secundario: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid var(--border-default)", color: "var(--text-primary)",
    },
  };

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        padding: "10px 18px", borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700, fontSize: 14, opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s var(--ease-out)",
        fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8,
        justifyContent: "center",
        ...(styles[variante] || styles.secundario),
        ...(style || {}),
      }}
      onMouseEnter={e => { if (!disabled && variante === "primario") { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(232,40,74,0.35)"; } }}
      onMouseLeave={e => { if (!disabled && variante === "primario") { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,40,74,0.25)"; } }}
    >
      {children}
    </button>
  );
}

function FormServicoModal({ servico, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({ nome: "", valor: "", duracao: "", descricao: "" });

  useEffect(() => {
    if (servico) {
      setFormData({ 
        nome: servico.nome || "", 
        valor: String(servico.valor || servico.preco || ""), 
        duracao: String(servico.duracao || servico.duracaoMin || ""),
        descricao: servico.descricao || "",
      });
    } else {
      setFormData({ nome: "", valor: "", duracao: "", descricao: "" });
    }
  }, [servico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      <div>
        <label style={labelStyle}>Nome do serviço *</label>
        <input type="text" name="nome" value={formData.nome} onChange={handleChange}
          required style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
          placeholder="Ex: Corte de cabelo" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Preço (R$) *</label>
          <input type="number" name="valor" value={formData.valor} onChange={handleChange}
            required step="0.01" min="0" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Duração (min) *</label>
          <input type="number" name="duracao" value={formData.duracao} onChange={handleChange}
            required min="1" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            placeholder="30" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Descrição (Opcional)</label>
        <textarea name="descricao" value={formData.descricao} onChange={handleChange}
          style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} onFocus={inputFocus} onBlur={inputBlur}
          placeholder="Breve descrição dos detalhes deste serviço..." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={onCancelar} style={{
          padding: "12px", borderRadius: 10,
          border: "1px solid var(--border-default)",
          background: "rgba(255,255,255,0.03)", color: "var(--text-secondary)",
          cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
          transition: "all var(--duration-fast) var(--ease-out)",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "white"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          Cancelar
        </button>
        <button type="submit" style={{
          padding: "12px", borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg, var(--accent), #c9213f)",
          color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14,
          fontFamily: "inherit",
          boxShadow: "0 4px 14px rgba(232,40,74,0.25)",
        }}>
          Salvar serviço
        </button>
      </div>
    </form>
  );
}

function Calendario({ agendamentos, onSelecionarDia, mesOffset = 0 }) {
  const hoje = new Date();
  const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesOffset, 1);
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const inicioSemanaIndex = (primeiroDia.getDay() + 6) % 7;
  const totalDias = ultimoDia.getDate();

  const diasComAgendamento = useMemo(() => {
    const set = new Set();
    for (const a of agendamentos) set.add(a.data);
    return set;
  }, [agendamentos]);

  const grid = useMemo(() => {
    const cells = [];
    const totalCells = inicioSemanaIndex + totalDias;
    const completa = totalCells % 7 === 0 ? totalCells : totalCells + (7 - (totalCells % 7));
    for (let i = 0; i < completa; i++) {
      const diaNum = i - inicioSemanaIndex + 1;
      if (diaNum < 1 || diaNum > totalDias) { cells.push({ diaNum: null }); continue; }
      const dtISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaNum).padStart(2, "0")}`;
      cells.push({ diaNum, data: dtISO, temAgendamento: diasComAgendamento.has(dtISO) });
    }
    return cells;
  }, [ano, inicioSemanaIndex, totalDias, mes, diasComAgendamento]);

  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, letterSpacing: "-0.015em", textTransform: "capitalize", color: "white" }}>
        {formatarMesAno(dataReferencia)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
        {diasSemana.map((d) => (
          <div key={d} style={{
            textAlign: "center", fontWeight: 700, fontSize: 11,
            color: "var(--text-muted)", paddingBottom: 8,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {d}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.diaNum) return <div key={idx} style={{ height: 46 }} />;
          const isHoje = cell.data === hojeISO;
          const tem = cell.temAgendamento;
          return (
            <button
              key={idx}
              onClick={() => onSelecionarDia(cell.data)}
              style={{
                height: 46, borderRadius: 10,
                cursor: "pointer", fontSize: 14, fontWeight: isHoje ? 800 : 600,
                border: tem
                  ? "1px solid var(--gold-border)"
                  : isHoje
                  ? "1px solid var(--accent-border)"
                  : "1px solid var(--border-default)",
                background: tem
                  ? "var(--gold-soft)"
                  : isHoje
                  ? "var(--accent-soft)"
                  : "rgba(255,255,255,0.02)",
                color: tem ? "var(--gold)" : isHoje ? "var(--accent)" : "var(--text-secondary)",
                transition: "all var(--duration-fast) var(--ease-out)",
                position: "relative",
              }}
              onMouseEnter={e => { if (!tem && !isHoje) { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "white"; } }}
              onMouseLeave={e => { if (!tem && !isHoje) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              title={tem ? "Possui agendamentos" : "Sem agendamentos"}
            >
              {cell.diaNum}
              {tem && <div style={{
                position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                width: 5, height: 5, borderRadius: "50%", background: "var(--gold)",
              }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ativo: { label: "Ativo", cls: "status-ativo" },
    cancelado: { label: "Cancelado", cls: "status-cancelado" },
    concluido: { label: "Concluído", cls: "status-concluido" },
  };
  const s = map[status] || { label: status, cls: "status-pendente" };
  return (
    <span className={s.cls} style={{
      padding: "5px 12px", borderRadius: 9999,
      border: "1px solid", fontWeight: 700, fontSize: 11, letterSpacing: "0.02em",
    }}>
      {s.label}
    </span>
  );
}

const TABLE_TH = {
  textAlign: "left", fontSize: 11, color: "var(--text-muted)", fontWeight: 700,
  padding: "12px 16px", textTransform: "uppercase", letterSpacing: "0.08em",
  borderBottom: "1px solid var(--border-subtle)",
  background: "rgba(255,255,255,0.01)",
};

const TABLE_TD = {
  padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)",
  fontSize: 14, color: "var(--text-primary)",
};

export default function Dashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { carregando, usuario, logout } = useSessaoBarbearia();
  const { setBarbearia: setBarebariaBProv } = useBarbearia().setBarbearia ? useBarbearia() : { setBarbearia: () => {} };
  const [aba, setAba] = useState("estatisticas");
  const [barbearia, setBarbearia] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  // Filtros de Busca
  const [buscaAgendamento, setBuscaAgendamento] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");

  useEffect(() => {
    if (!slug) navigate("/login", { replace: true });
  }, [slug, navigate]);

  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicosState, setServicosState] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      if (!slug) return;
      setCarregandoDados(true);
      setErroCarregamento(null);
      try {
        const barbeariaDoc = await api.get('/barbearias/minha.php');
        if (!barbeariaDoc) throw new Error("Barbearia não encontrada para o usuário");
        if (barbeariaDoc.slug !== slug) { navigate(`/dashboard/${barbeariaDoc.slug}`, { replace: true }); return; }
        if (!mounted) return;
        setBarbearia(barbeariaDoc);
        const barbeariaId = barbeariaDoc.id;
        const [agDocs, clDocs, svDocs] = await Promise.all([
          api.get(`/agendamentos/index.php?barbearia_id=${barbeariaId}`),
          api.get(`/clientes/index.php?barbearia_id=${barbeariaId}`),
          api.get(`/servicos/index.php?barbearia_id=${barbeariaId}`),
        ]);
        if (!mounted) return;
        setAgendamentos(agDocs ?? []);
        setClientes(clDocs ?? []);
        setServicosState(svDocs ?? []);
        setCarregandoDados(false);
      } catch (err) {
        console.error("Dashboard carregar() erro:", err);
        if (!mounted) return;
        setErroCarregamento(err?.message || "Erro ao carregar dados");
        setBarbearia(null);
        setCarregandoDados(false);
      }
    }
    carregar();
    return () => { mounted = false; };
  }, [slug, navigate]);

  const [modalServico, setModalServico] = useState({ aberto: false, servico: null });
  const [modalDia, setModalDia] = useState({ aberto: false, data: null });

  const salvarServico = useCallback(async (dados) => {
    if (!barbearia) return;
    try {
      if (modalServico.servico?.id) {
        await api.put('/servicos/atualizar.php', { id: modalServico.servico.id, ...dados });
      } else {
        await api.post('/servicos/criar.php', { ...dados, barbearia_id: barbearia.id });
      }
      const svDocs = await api.get(`/servicos/index.php?barbearia_id=${barbearia.id}`);
      setServicosState(svDocs ?? []);
      setModalServico({ aberto: false, servico: null });
    } catch (err) {
      console.error("Erro ao salvar serviço:", err);
      alert("Erro ao salvar serviço: " + (err?.message || err));
    }
  }, [barbearia, modalServico.servico]);

  const deletarServico = useCallback(async (servicoId) => {
    if (!barbearia || !window.confirm("Tem certeza que deseja deletar este serviço?")) return;
    try {
      await api.delete(`/servicos/deletar.php?id=${servicoId}`);
      const svDocs = await api.get(`/servicos/index.php?barbearia_id=${barbearia.id}`);
      setServicosState(svDocs ?? []);
    } catch (err) {
      console.error("Erro ao deletar serviço:", err);
      alert("Erro ao deletar serviço: " + (err?.message || err));
    }
  }, [barbearia]);

  const agendamentosDoDia = useMemo(() => {
    if (!modalDia.data) return [];
    return agendamentos.filter((a) => a.data === modalDia.data).sort((a, b) => (a.horario < b.horario ? -1 : 1));
  }, [agendamentos, modalDia.data]);

  const metrics = useMemo(() => {
    const total = agendamentos.length;
    const ativos = agendamentos.filter((a) => a.status === "ativo").length;
    const cancelados = agendamentos.filter((a) => a.status === "cancelado").length;
    const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
    const totalClientes = clientes.length;
    const faturamento = agendamentos.filter((a) => a.status === "concluido").reduce((sum, a) => sum + (parseFloat(a.preco) || 0), 0);
    const diasComAgendamentos = new Set(agendamentos.map((a) => a.data)).size;
    return { total, ativos, cancelados, concluidos, faturamento, totalClientes, diasComAgendamentos };
  }, [agendamentos, clientes]);

  const agendamentosFiltrados = useMemo(() => {
    if (!buscaAgendamento.trim()) return agendamentos;
    const query = buscaAgendamento.toLowerCase();
    return agendamentos.filter(a => 
      (a.cliente && a.cliente.toLowerCase().includes(query)) ||
      (a.servico && a.servico.toLowerCase().includes(query)) ||
      (a.horario && a.horario.includes(query))
    );
  }, [agendamentos, buscaAgendamento]);

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes;
    const query = buscaCliente.toLowerCase();
    return clientes.filter(c => 
      (c.nome && c.nome.toLowerCase().includes(query)) ||
      (c.telefone && c.telefone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }, [clientes, buscaCliente]);

  const ABAS = [
    { chave: "estatisticas", label: "Estatísticas", icon: "◈" },
    { chave: "agendamentos", label: "Agendamentos", icon: "◷" },
    { chave: "clientes", label: "Clientes", icon: "◎" },
    { chave: "servicos", label: "Serviços", icon: "✂" },
    { chave: "calendario", label: "Calendário", icon: "▦" },
    { chave: "configuracoes", label: "Configurações", icon: "⚙" },
  ];

  if (!slug || carregando || carregandoDados) {
    return (
      <main style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "var(--bg-primary)", color: "white",
      }}>
        <div style={{
          width: 38, height: 38, border: "3px solid rgba(255,255,255,0.06)",
          borderTopColor: "var(--accent)", borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}>Carregando painel...</p>
      </main>
    );
  }

  if (erroCarregamento) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "white" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: 24, borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Erro de Carregamento</h2>
          <div style={{ color: "#ff8080", fontSize: 14, lineHeight: 1.5 }}>{erroCarregamento}</div>
        </div>
      </main>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)", color: "white",
      padding: "32px 16px",
    }}>
      <div style={{
        maxWidth: 1300, margin: "0 auto",
        display: "grid", gridTemplateColumns: "260px 1fr", gap: 32, alignItems: "start",
      }}>

        {/* ── Sidebar ── */}
        <aside style={{ position: "sticky", top: 32 }}>
          <div style={{
            borderRadius: 20,
            background: "rgba(13,13,16,0.95)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
          }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--gold))" }} />

            <div style={{ padding: "24px 20px" }}>
              {/* Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, var(--accent), #c9213f)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "0 4px 12px rgba(232,40,74,0.3)"
                }}>✂</div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Barbearia
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "white" }}>
                    {barbearia?.nome || "—"}
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div style={{ display: "grid", gap: 4 }}>
                {ABAS.map((item) => {
                  const active = aba === item.chave;
                  return (
                    <button
                      key={item.chave}
                      onClick={() => setAba(item.chave)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "11px 14px", borderRadius: 10,
                        border: `1px solid ${active ? "var(--accent-border)" : "transparent"}`,
                        background: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontWeight: active ? 700 : 500,
                        fontSize: 14, transition: "all var(--duration-fast) var(--ease-out)",
                        display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "white"; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                    >
                      <span style={{ fontSize: 14, opacity: active ? 1 : 0.6, width: 18, textAlign: "center" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Logout */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                <button onClick={logout} style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1px solid var(--danger-border)", background: "var(--danger-soft)",
                  color: "var(--danger)", cursor: "pointer", fontWeight: 700, fontSize: 13,
                  fontFamily: "inherit", transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--danger-soft)"; }}
                >
                  <span>→</span> Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ display: "grid", gap: 24, animation: "fadeSlideUp 0.35s var(--ease-out) forwards" }}>

          {/* Header */}
          <header style={{
            padding: "20px 24px",
            borderRadius: 20,
            background: "rgba(13,13,16,0.95)", border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Painel Administrativo
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "white" }}>
                  {ABAS.find(a => a.chave === aba)?.label}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => {
                    const linkUnico = `${window.location.origin}/AgendasBarber/${barbearia?.slug}`;
                    navigator.clipboard.writeText(linkUnico);
                    alert("Link copiado para a área de transferência!");
                  }}
                  style={{
                    padding: "10px 18px", borderRadius: 10,
                    border: "1px solid var(--gold-border)", background: "var(--gold-soft)",
                    color: "var(--gold)", cursor: "pointer", fontWeight: 700, fontSize: 13,
                    transition: "all 0.2s var(--ease-out)", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 6
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.18)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--gold-soft)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  title="Copiar link único para compartilhar com clientes"
                >
                  <span>◎</span> Copiar Link Único
                </button>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                  padding: "10px 16px", borderRadius: 10,
                  border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)",
                }}>
                  {usuario?.email || "—"}
                </div>
              </div>
            </div>
          </header>

          {/* ─ Estatísticas ─ */}
          {aba === "estatisticas" && (
            <div style={{ display: "grid", gap: 20 }}>
              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <StatCard label="Total agendamentos" value={metrics.total} icon="◷" />
                <StatCard label="Ativos" value={metrics.ativos} color="var(--gold)" variant="gold" icon="●" />
                <StatCard label="Concluídos" value={metrics.concluidos} color="var(--success)" variant="success" icon="✓" />
                <StatCard label="Cancelados" value={metrics.cancelados} color="var(--danger)" icon="✕" />
                <StatCard label="Clientes" value={metrics.totalClientes} color="var(--accent)" variant="accent" icon="◎" />
                <StatCard label="Dias com agenda" value={metrics.diasComAgendamentos} icon="▦" />
              </section>

              <div style={{ 
                padding: "24px", 
                borderRadius: 20, 
                background: "var(--gold-soft)", 
                border: "1px solid var(--gold-border)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(212,168,67,0.05)"
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 6 }}>Faturamento Total (Concluídos)</div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--gold)", lineHeight: 1.1 }}>
                    R$ {metrics.faturamento.toFixed(2).replace(".", ",")}
                  </div>
                </div>
                <div style={{ fontSize: 44, color: "var(--gold)", opacity: 0.25 }}>💰</div>
              </div>
            </div>
          )}

          {/* ─ Agendamentos ─ */}
          {aba === "agendamentos" && (
            <div style={{
              borderRadius: 20, background: "rgba(13,13,16,0.95)",
              border: "1px solid var(--border-default)", overflow: "hidden",
            }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.015em", margin: 0 }}>Lista de Agendamentos</h2>
                
                {/* Filtro de Busca */}
                <input
                  type="text"
                  placeholder="Pesquisar por cliente ou serviço..."
                  value={buscaAgendamento}
                  onChange={(e) => setBuscaAgendamento(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border-default)",
                    background: "rgba(255,255,255,0.02)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                    width: 250,
                  }}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Data", "Horário", "Cliente", "Serviço", "Status"].map((h) => (
                        <th key={h} style={TABLE_TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...TABLE_TD, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                          Nenhum agendamento encontrado
                        </td>
                      </tr>
                    ) : agendamentosFiltrados.map((a) => (
                      <tr key={a.id}
                        style={{ transition: "background var(--duration-fast)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={TABLE_TD}>{formatarDataISOParaPT(a.data)}</td>
                        <td style={{ ...TABLE_TD, fontWeight: 700 }}>{a.horario.slice(0, 5)}</td>
                        <td style={{ ...TABLE_TD, fontWeight: 600 }}>{a.cliente || "—"}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-secondary)" }}>{a.servico || "—"}</td>
                        <td style={TABLE_TD}><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ Clientes ─ */}
          {aba === "clientes" && (
            <div style={{
              borderRadius: 20, background: "rgba(13,13,16,0.95)",
              border: "1px solid var(--border-default)", overflow: "hidden",
            }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.015em", margin: 0 }}>Nossos Clientes</h2>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)", fontWeight: 700 }}>
                    {clientes.length} total
                  </span>
                </div>

                {/* Filtro de Busca */}
                <input
                  type="text"
                  placeholder="Pesquisar cliente por nome ou tel..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border-default)",
                    background: "rgba(255,255,255,0.02)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                    width: 250,
                  }}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Nome", "Telefone", "E-mail"].map((h) => (
                        <th key={h} style={TABLE_TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ ...TABLE_TD, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    ) : clientesFiltrados.map((c) => (
                      <tr key={c.id}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        style={{ transition: "background var(--duration-fast)" }}
                      >
                        <td style={{ ...TABLE_TD, fontWeight: 700 }}>{c.nome}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-secondary)", fontWeight: 500 }}>{c.telefone || "—"}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-muted)" }}>{c.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ Serviços (Redesenhados como Grid de Cards Premium) ─ */}
          {aba === "servicos" && (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.015em", margin: 0 }}>Serviços Oferecidos</h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Gerencie os serviços oferecidos e seus respectivos valores e durações.
                  </p>
                </div>
                <Botao onClick={() => setModalServico({ aberto: true, servico: null })}>
                  <span>+</span> Novo Serviço
                </Botao>
              </div>

              {servicosState.length === 0 ? (
                <div style={{ padding: 40, borderRadius: 16, background: "var(--bg-card)", border: "1px dashed var(--border-default)", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                  Nenhum serviço cadastrado ainda.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {servicosState.map((s) => {
                    const precoNum = Number(s.valor || s.preco || 0);
                    return (
                      <div key={s.id} style={{
                        padding: "20px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border-default)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 16,
                        transition: "all 0.22s var(--ease-out)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "white" }}>{s.nome}</h3>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                              ⏱ {s.duracao || s.duracaoMin || "—"} min
                            </span>
                          </div>
                          {s.descricao ? (
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{s.descricao}</p>
                          ) : (
                            <p style={{ fontSize: 13, color: "var(--text-faint)", fontStyle: "italic", margin: 0 }}>Sem descrição definida.</p>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)" }}>
                            R$ {precoNum.toFixed(2).replace(".", ",")}
                          </span>
                          
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setModalServico({ aberto: true, servico: s })}
                              style={{
                                padding: "6px 12px", borderRadius: 8,
                                border: "1px solid var(--gold-border)", background: "var(--gold-soft)",
                                color: "var(--gold)", cursor: "pointer", fontWeight: 600, fontSize: 12,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.18)"}
                              onMouseLeave={e => e.currentTarget.style.background = "var(--gold-soft)"}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deletarServico(s.id)}
                              style={{
                                padding: "6px 12px", borderRadius: 8,
                                border: "1px solid var(--danger-border)", background: "var(--danger-soft)",
                                color: "var(--danger)", cursor: "pointer", fontWeight: 600, fontSize: 12,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                              onMouseLeave={e => e.currentTarget.style.background = "var(--danger-soft)"}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─ Calendário ─ */}
          {aba === "calendario" && (
            <div style={{
              borderRadius: 20, background: "rgba(13,13,16,0.95)",
              border: "1px solid var(--border-default)", padding: "24px",
            }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.015em", marginBottom: 6, color: "white" }}>Calendário Geral</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                  Os dias destacados em dourado possuem agendamentos ativos. Clique sobre qualquer dia para visualizar os detalhes.
                </p>
              </div>
              <Calendario
                agendamentos={agendamentos}
                onSelecionarDia={(dataISO) => setModalDia({ aberto: true, data: dataISO })}
              />
            </div>
          )}

          {/* ─ Configurações (Integrado na mesma SPA) ─ */}
          {aba === "configuracoes" && (
            <Configuracoes />
          )}

        </main>
      </div>

      {/* Modals */}
      <Modal
        aberto={modalServico.aberto}
        titulo={modalServico.servico ? "Editar Serviço" : "Novo Serviço"}
        onFechar={() => setModalServico({ aberto: false, servico: null })}
      >
        <FormServicoModal
          servico={modalServico.servico}
          onSalvar={salvarServico}
          onCancelar={() => setModalServico({ aberto: false, servico: null })}
        />
      </Modal>

      <Modal
        aberto={modalDia.aberto}
        titulo={modalDia.data ? `Agendamentos · ${formatarDataISOParaPT(modalDia.data)}` : "Agendamentos"}
        onFechar={() => setModalDia({ aberto: false, data: null })}
      >
        {agendamentosDoDia.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "30px 0" }}>
            Nenhum compromisso marcado para esta data.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
            {agendamentosDoDia.map((a) => (
              <div key={a.id} style={{
                padding: "16px", borderRadius: 12,
                border: "1px solid var(--border-default)", background: "rgba(255,255,255,0.01)",
                display: "grid", gridTemplateColumns: "90px 1fr", gap: 14, alignItems: "center",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-default)"}
              >
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4 }}>Horário</div>
                  <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "var(--accent)" }}>{a.horario.slice(0, 5)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: "white" }}>{a.cliente}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                    {a.servico} · ⏱ {a.duracao || a.duracaoMin || 30} min
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
