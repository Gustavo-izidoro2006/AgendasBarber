import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { account, databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";
import { ID } from "appwrite";

const inputStyle = {
  width: "100%", padding: "12px 14px",
  borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)",
  background: "rgba(255,255,255,0.03)", color: "white", fontWeight: 500, fontSize: 14,
  outline: "none", boxSizing: "border-box",
  transition: "all var(--duration-fast) var(--ease-out)",
  fontFamily: "inherit",
};
const inputFocus = (e) => {
  e.target.style.borderColor = "var(--border-focus)";
  e.target.style.boxShadow = "0 0 0 3px rgba(232,40,74,0.1)";
};
const inputBlur = (e) => {
  e.target.style.borderColor = "var(--border-default)";
  e.target.style.boxShadow = "none";
};
const labelStyle = {
  display: "block", marginBottom: 7, fontWeight: 600, fontSize: 11,
  color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em",
};

function formatarDataISOParaPT(dataISO) {
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
        background: "rgba(0,0,0,0.7)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        animation: "fadeIn 0.2s ease",
      }}
      role="dialog" aria-modal="true" onMouseDown={onFechar}
    >
      <div
        style={{
          width: "100%", maxWidth: 520,
          borderRadius: "var(--radius-xl)",
          background: "rgba(13,13,16,0.98)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xl)",
          color: "white",
          animation: "scaleIn 0.22s var(--ease-out)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--gold))" }} />
        <div style={{
          padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>{titulo}</div>
          <button onClick={onFechar} style={{
            width: 32, height: 32, borderRadius: "var(--radius-xs)",
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
    default: { bg: "var(--bg-card)", border: "var(--border-default)" },
    gold: { bg: "var(--gold-soft)", border: "var(--gold-border)" },
    accent: { bg: "var(--accent-soft)", border: "var(--accent-border)" },
    success: { bg: "var(--success-soft)", border: "var(--success-border)" },
  };
  const v = variants[variant] || variants.default;
  return (
    <div style={{
      padding: "20px", borderRadius: "var(--radius-lg)",
      background: v.bg, border: `1px solid ${v.border}`,
      boxShadow: "var(--shadow-sm)",
      transition: "all var(--duration-fast) var(--ease-out)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
          color: "var(--text-muted)",
        }}>
          {label}
        </div>
        {icon && <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em",
        color: color || "var(--text-primary)", lineHeight: 1,
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
      boxShadow: "0 2px 12px rgba(232,40,74,0.3)",
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
        padding: "10px 18px", borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700, fontSize: 14, opacity: disabled ? 0.5 : 1,
        transition: "all var(--duration-fast) var(--ease-out)",
        fontFamily: "inherit",
        ...(styles[variante] || styles.secundario),
        ...(style || {}),
      }}
      onMouseEnter={e => { if (!disabled && variante === "primario") { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(232,40,74,0.4)"; } }}
      onMouseLeave={e => { if (!disabled && variante === "primario") { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(232,40,74,0.3)"; } }}
    >
      {children}
    </button>
  );
}

function FormServicoModal({ servico, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({ nome: "", preco: "", duracaoMin: "" });

  useEffect(() => {
    if (servico) {
      setFormData({ nome: servico.nome || "", preco: String(servico.preco || ""), duracaoMin: String(servico.duracaoMin || "") });
    } else {
      setFormData({ nome: "", preco: "", duracaoMin: "" });
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
          <input type="number" name="preco" value={formData.preco} onChange={handleChange}
            required step="0.01" min="0" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Duração (min) *</label>
          <input type="number" name="duracaoMin" value={formData.duracaoMin} onChange={handleChange}
            required min="1" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
            placeholder="30" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={onCancelar} style={{
          padding: "12px", borderRadius: "var(--radius-sm)",
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
          padding: "12px", borderRadius: "var(--radius-sm)",
          border: "none",
          background: "linear-gradient(135deg, var(--accent), #c9213f)",
          color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14,
          fontFamily: "inherit",
          boxShadow: "0 2px 12px rgba(232,40,74,0.3)",
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
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
        {formatarMesAno(dataReferencia)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
        {diasSemana.map((d) => (
          <div key={d} style={{
            textAlign: "center", fontWeight: 700, fontSize: 10,
            color: "var(--text-muted)", paddingBottom: 8,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            {d}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.diaNum) return <div key={idx} style={{ height: 44 }} />;
          const isHoje = cell.data === hojeISO;
          const tem = cell.temAgendamento;
          return (
            <button
              key={idx}
              onClick={() => onSelecionarDia(cell.data)}
              style={{
                height: 44, borderRadius: "var(--radius-sm)",
                cursor: "pointer", fontSize: 14, fontWeight: isHoje ? 800 : 600,
                border: tem
                  ? "1px solid var(--gold-border)"
                  : isHoje
                  ? "1px solid var(--accent-border)"
                  : "1px solid var(--border-subtle)",
                background: tem
                  ? "var(--gold-soft)"
                  : isHoje
                  ? "var(--accent-soft)"
                  : "rgba(255,255,255,0.02)",
                color: tem ? "var(--gold)" : isHoje ? "var(--accent)" : "var(--text-secondary)",
                transition: "all var(--duration-fast) var(--ease-out)",
                position: "relative",
              }}
              onMouseEnter={e => { if (!tem && !isHoje) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; } }}
              onMouseLeave={e => { if (!tem && !isHoje) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              title={tem ? "Possui agendamentos" : "Sem agendamentos"}
            >
              {cell.diaNum}
              {tem && <div style={{
                position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)",
                width: 4, height: 4, borderRadius: "50%", background: "var(--gold)",
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
      padding: "5px 11px", borderRadius: "var(--radius-full)",
      border: "1px solid", fontWeight: 600, fontSize: 12, letterSpacing: "0.02em",
    }}>
      {s.label}
    </span>
  );
}

const TABLE_TH = {
  textAlign: "left", fontSize: 11, color: "var(--text-muted)", fontWeight: 700,
  padding: "0 14px 12px", textTransform: "uppercase", letterSpacing: "0.06em",
  borderBottom: "1px solid var(--border-subtle)",
};
const TABLE_TD = {
  padding: "13px 14px", borderBottom: "1px solid var(--border-subtle)",
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

  useEffect(() => {
    if (!slug) navigate("/login", { replace: true });
  }, [slug, navigate]);

  if (!slug) {
    return (
      <main style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "var(--bg-primary)", color: "white",
      }}>
        <div style={{
          width: 38, height: 38, border: "3px solid var(--border-default)",
          borderTopColor: "var(--accent)", borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregando...</p>
      </main>
    );
  }

  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicosState, setServicosState] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      setCarregandoDados(true);
      setErroCarregamento(null);
      try {
        const user = await account.get();
        const barbeariaDocs = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [Query.equal("user_id", user.$id)]);
        const barbeariaDoc = barbeariaDocs?.documents?.[0];
        if (!barbeariaDoc) throw new Error("Barbearia não encontrada para o usuário");
        if (barbeariaDoc.slug !== slug) { navigate(`/dashboard/${barbeariaDoc.slug}`, { replace: true }); return; }
        if (!mounted) return;
        setBarbearia(barbeariaDoc);
        const barbeariaId = barbeariaDoc.$id;
        const buscarComFallback = async (col) => {
          try {
            const resp = await databases.listDocuments(DB_ID, col, [Query.equal("barbearia_id", barbeariaId)]);
            if (resp?.documents?.length > 0) return resp.documents;
          } catch { }
          const all = await databases.listDocuments(DB_ID, col, [Query.limit(200)]);
          return (all?.documents ?? []).filter((d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId);
        };
        const [agDocs, clDocs, svDocs] = await Promise.all([
          DB_ID && COLLECTIONS.agendamentos ? buscarComFallback(COLLECTIONS.agendamentos) : [],
          DB_ID && COLLECTIONS.clientes ? buscarComFallback(COLLECTIONS.clientes) : [],
          DB_ID && COLLECTIONS.servicos ? buscarComFallback(COLLECTIONS.servicos) : [],
        ]);
        if (!mounted) return;
        setAgendamentos(agDocs);
        setClientes(clDocs);
        setServicosState(svDocs);
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
      if (modalServico.servico?.$id) {
        await databases.updateDocument(DB_ID, COLLECTIONS.servicos, modalServico.servico.$id, dados);
      } else {
        await databases.createDocument(DB_ID, COLLECTIONS.servicos, ID.unique(), { ...dados, barbearia_id: barbearia.$id });
      }
      try {
        const sv = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.equal("barbearia_id", barbearia.$id)]);
        setServicosState(sv?.documents ?? []);
      } catch {
        const all = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.limit(200)]);
        setServicosState((all?.documents ?? []).filter((d) => d.barbearia_id === barbearia.$id || d.barbearia_id?.$id === barbearia.$id));
      }
      setModalServico({ aberto: false, servico: null });
    } catch (err) {
      console.error("Erro ao salvar serviço:", err);
      alert("Erro ao salvar serviço: " + (err?.message || err));
    }
  }, [barbearia, modalServico.servico]);

  const deletarServico = useCallback(async (servicoId) => {
    if (!barbearia || !window.confirm("Tem certeza que deseja deletar este serviço?")) return;
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.servicos, servicoId);
      try {
        const sv = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.equal("barbearia_id", barbearia.$id)]);
        setServicosState(sv?.documents ?? []);
      } catch {
        const all = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.limit(200)]);
        setServicosState((all?.documents ?? []).filter((d) => d.barbearia_id === barbearia.$id || d.barbearia_id?.$id === barbearia.$id));
      }
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

  const ABAS = [
    { chave: "estatisticas", label: "Estatísticas", icon: "◈" },
    { chave: "agendamentos", label: "Agendamentos", icon: "◷" },
    { chave: "clientes", label: "Clientes", icon: "◎" },
    { chave: "servicos", label: "Serviços", icon: "✂" },
    { chave: "calendario", label: "Calendário", icon: "▦" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)", color: "white",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: 1300, margin: "0 auto",
        display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start",
      }}>

        {/* ── Sidebar ── */}
        <aside style={{ position: "sticky", top: 20 }}>
          <div style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}>
            {/* Sidebar top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--gold))" }} />

            <div style={{ padding: "20px 16px" }}>
              {/* Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--accent), #c9213f)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, boxShadow: "0 2px 10px rgba(232,40,74,0.35)",
                }}>✂</div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Barbearia
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {barbearia?.nome || barbearia?.nomeBarbearia || "—"}
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div style={{ display: "grid", gap: 3 }}>
                {ABAS.map((item) => {
                  const active = aba === item.chave;
                  return (
                    <button
                      key={item.chave}
                      onClick={() => setAba(item.chave)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "10px 12px", borderRadius: "var(--radius-sm)",
                        border: `1px solid ${active ? "var(--accent-border)" : "transparent"}`,
                        background: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontWeight: active ? 700 : 500,
                        fontSize: 14, transition: "all var(--duration-fast) var(--ease-out)",
                        display: "flex", alignItems: "center", gap: 9, fontFamily: "inherit",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                    >
                      <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Logout */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                <button onClick={logout} style={{
                  width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--danger-border)", background: "var(--danger-soft)",
                  color: "var(--danger)", cursor: "pointer", fontWeight: 700, fontSize: 14,
                  fontFamily: "inherit", transition: "all var(--duration-fast) var(--ease-out)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--danger-soft)"; }}
                >
                  Sair da conta
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ display: "grid", gap: 16, animation: "fadeSlideUp 0.35s var(--ease-out) forwards" }}>

          {/* Header */}
          <header style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                  Painel de controle
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em" }}>
                  {ABAS.find(a => a.chave === aba)?.label}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => {
                    const linkUnico = `${window.location.origin}/barbearia/${barbearia?.slug}`;
                    navigator.clipboard.writeText(linkUnico);
                    alert("Link copiado para a área de transferência!");
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--gold-border)", background: "var(--gold-soft)",
                    color: "var(--gold)", cursor: "pointer", fontWeight: 700, fontSize: 13,
                    transition: "all var(--duration-fast) var(--ease-out)", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--gold-soft)"; }}
                  title="Copiar link único para compartilhar com clientes"
                >
                  ◎ Copiar link
                </button>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text-muted)",
                  padding: "8px 14px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)",
                }}>
                  {usuario?.email || "—"}
                </div>
              </div>
            </div>
          </header>

          {/* ─ Estatísticas ─ */}
          {aba === "estatisticas" && (
            <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              <StatCard label="Total agendamentos" value={metrics.total} icon="◷" />
              <StatCard label="Ativos" value={metrics.ativos} color="var(--gold)" variant="gold" icon="●" />
              <StatCard label="Concluídos" value={metrics.concluidos} color="var(--success)" variant="success" icon="✓" />
              <StatCard label="Cancelados" value={metrics.cancelados} color="var(--danger)" icon="✕" />
              <StatCard label="Clientes" value={metrics.totalClientes} color="var(--accent)" variant="accent" icon="◎" />
              <StatCard label="Dias com agenda" value={metrics.diasComAgendamentos} icon="▦" />
              <div style={{ gridColumn: "span 2", padding: "20px", borderRadius: "var(--radius-lg)", background: "var(--gold-soft)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 6 }}>Faturamento total</div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--gold)", lineHeight: 1 }}>
                    R$ {metrics.faturamento.toFixed(2).replace(".", ",")}
                  </div>
                </div>
                <div style={{ fontSize: 40, opacity: 0.3 }}>◈</div>
              </div>
            </section>
          )}

          {/* ─ Agendamentos ─ */}
          {aba === "agendamentos" && (
            <div style={{
              borderRadius: "var(--radius-lg)", background: "var(--bg-card)",
              border: "1px solid var(--border-default)", overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Lista de agendamentos</h2>
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
                    {agendamentos.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...TABLE_TD, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                          Nenhum agendamento encontrado
                        </td>
                      </tr>
                    ) : agendamentos.map((a) => (
                      <tr key={a.id || a.$id}
                        style={{ transition: "background var(--duration-fast)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={TABLE_TD}>{formatarDataISOParaPT(a.data)}</td>
                        <td style={{ ...TABLE_TD, fontWeight: 600 }}>{a.horario.slice(0, 5)}</td>
                        <td style={TABLE_TD}>{a.cliente}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-secondary)" }}>{a.servico}</td>
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
              borderRadius: "var(--radius-lg)", background: "var(--bg-card)",
              border: "1px solid var(--border-default)", overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Lista de clientes</h2>
                <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-subtle)" }}>
                  {clientes.length} clientes
                </span>
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
                    {clientes.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ ...TABLE_TD, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    ) : clientes.map((c) => (
                      <tr key={c.id || c.$id}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        style={{ transition: "background var(--duration-fast)" }}
                      >
                        <td style={{ ...TABLE_TD, fontWeight: 600 }}>{c.nome}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-secondary)" }}>{c.telefone}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-muted)" }}>{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ Serviços ─ */}
          {aba === "servicos" && (
            <div style={{
              borderRadius: "var(--radius-lg)", background: "var(--bg-card)",
              border: "1px solid var(--border-default)", overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Lista de serviços</h2>
                <Botao onClick={() => setModalServico({ aberto: true, servico: null })} style={{ padding: "8px 14px", fontSize: 13 }}>
                  + Novo serviço
                </Botao>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Serviço", "Duração", "Preço", "Ações"].map((h) => (
                        <th key={h} style={TABLE_TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {servicosState.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ ...TABLE_TD, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                          Nenhum serviço cadastrado
                        </td>
                      </tr>
                    ) : servicosState.map((s) => (
                      <tr key={s.$id}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        style={{ transition: "background var(--duration-fast)" }}
                      >
                        <td style={{ ...TABLE_TD, fontWeight: 600 }}>{s.nome}</td>
                        <td style={{ ...TABLE_TD, color: "var(--text-secondary)" }}>{s.duracaoMin} min</td>
                        <td style={{ ...TABLE_TD, fontWeight: 700, color: "var(--gold)" }}>R$ {s.preco}</td>
                        <td style={TABLE_TD}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setModalServico({ aberto: true, servico: s })}
                              style={{
                                padding: "6px 12px", borderRadius: "var(--radius-xs)",
                                border: "1px solid var(--gold-border)", background: "var(--gold-soft)",
                                color: "var(--gold)", cursor: "pointer", fontWeight: 600, fontSize: 12,
                                fontFamily: "inherit", transition: "all var(--duration-fast) var(--ease-out)",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.15)"}
                              onMouseLeave={e => e.currentTarget.style.background = "var(--gold-soft)"}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deletarServico(s.$id)}
                              style={{
                                padding: "6px 12px", borderRadius: "var(--radius-xs)",
                                border: "1px solid var(--danger-border)", background: "var(--danger-soft)",
                                color: "var(--danger)", cursor: "pointer", fontWeight: 600, fontSize: 12,
                                fontFamily: "inherit", transition: "all var(--duration-fast) var(--ease-out)",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                              onMouseLeave={e => e.currentTarget.style.background = "var(--danger-soft)"}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ Calendário ─ */}
          {aba === "calendario" && (
            <div style={{
              borderRadius: "var(--radius-lg)", background: "var(--bg-card)",
              border: "1px solid var(--border-default)", padding: "24px",
            }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 5 }}>Calendário</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Dias marcados em dourado possuem agendamentos. Clique para ver detalhes.
                </p>
              </div>
              <Calendario
                agendamentos={agendamentos}
                onSelecionarDia={(dataISO) => setModalDia({ aberto: true, data: dataISO })}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <Modal
        aberto={modalServico.aberto}
        titulo={modalServico.servico ? "Editar serviço" : "Novo serviço"}
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
          <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
            Nenhum agendamento para este dia.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {agendamentosDoDia.map((a) => (
              <div key={a.id || a.$id} style={{
                padding: "16px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
                display: "grid", gridTemplateColumns: "100px 1fr", gap: 14, alignItems: "start",
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Horário</div>
                  <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", color: "var(--accent)" }}>{a.horario.slice(0, 5)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.cliente}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                    {a.servico} · {a.duracaoMin} min
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
