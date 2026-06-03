import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { account, databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";
import { ID } from "appwrite";

function formatarDataISOParaPT(dataISO) {
  // dataISO: YYYY-MM-DD
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
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      role="dialog"
      aria-modal="true"
      onMouseDown={onFechar}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 18,
          background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
          color: "white",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 900 }}>{titulo}</div>
          <button
            onClick={onFechar}
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

function Card({ children, variante = "normal" }) {
  const style =
    variante === "destaque"
      ? {
          background: "rgba(253,166,60,0.08)",
          border: "1px solid rgba(253,166,60,0.22)",
        }
      : variante === "rosa"
      ? {
          background: "rgba(253,54,110,0.10)",
          border: "1px solid rgba(253,54,110,0.25)",
        }
      : {
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.10)",
        };

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
        color: "white",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Botao({
  children,
  onClick,
  variante = "primario",
  type = "button",
  disabled,
  style,
}) {
  const isPrimario = variante === "primario";
  const base = isPrimario
    ? {
        background: "#FD366E",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "white",
      }
    : {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "white",
      };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        ...(base || {}),
        ...(style || {}),
      }}
    >
      {children}
    </button>
  );
}

function FormServicoModal({ servico, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor: "",
    duracao: "",
  });

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome || "",
        descricao: servico.descricao || "",
        valor: String(servico.valor || ""),
        duracao: String(servico.duracao || ""),
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        valor: "",
        duracao: "",
      });
    }
  }, [servico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800, fontSize: 13 }}>
          Nome do serviço *
        </label>
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 500,
          }}
          placeholder="Ex: Corte de cabelo"
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800, fontSize: 13 }}>
          Descrição
        </label>
        <input
          type="text"
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 500,
          }}
          placeholder="Ex: Corte simples com máquina e tesoura"
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800, fontSize: 13 }}>
          Preço (R$) *
        </label>
        <input
          type="number"
          name="valor"
          value={formData.valor}
          onChange={handleChange}
          required
          step="0.01"
          min="0"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 500,
          }}
          placeholder="0.00"
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800, fontSize: 13 }}>
          Duração (minutos) *
        </label>
        <input
          type="number"
          name="duracao"
          value={formData.duracao}
          onChange={handleChange}
          required
          min="1"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 500,
          }}
          placeholder="30"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={onCancelar}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(253,54,110,0.35)",
            background: "rgba(253,54,110,0.15)",
            color: "white",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

function Calendario({
  agendamentos,
  onSelecionarDia,
  mesOffset = 0,
}) {
  // usa calendário mensal local
  const hoje = new Date();
  const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesOffset, 1);

  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  // JS: 0=domingo, 1=segunda...
  const inicioSemanaIndex = (primeiroDia.getDay() + 6) % 7; // transforma para começar em seg
  const totalDias = ultimoDia.getDate();

  const diasComAgendamento = useMemo(() => {
    const set = new Set();
    for (const a of agendamentos) {
      if (a.data_agendamento) {
        set.add(a.data_agendamento.substring(0, 10));
      }
    }
    return set;
  }, [agendamentos]);

  const grid = useMemo(() => {
    const cells = [];
    const totalCells = inicioSemanaIndex + totalDias;
    const completa = totalCells % 7 === 0 ? totalCells : totalCells + (7 - (totalCells % 7));
    const total = completa;

    for (let i = 0; i < total; i++) {
      const diaNum = i - inicioSemanaIndex + 1;
      if (diaNum < 1 || diaNum > totalDias) {
        cells.push({ diaNum: null });
        continue;
      }

      const dtISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaNum).padStart(2, "0")}`;
      cells.push({
        diaNum,
        data: dtISO,
        temAgendamento: diasComAgendamento.has(dtISO),
      });
    }
    return cells;
  }, [ano, inicioSemanaIndex, totalDias, mes, diasComAgendamento]);

  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{formatarMesAno(dataReferencia)}</div>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {diasSemana.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontWeight: 900,
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              paddingBottom: 6,
            }}
          >
            {d}
          </div>
        ))}

        {grid.map((cell, idx) => {
          if (!cell.diaNum) {
            return <div key={idx} style={{ height: 46 }} />;
          }

          const tem = cell.temAgendamento;
          return (
            <button
              key={idx}
              onClick={() => onSelecionarDia(cell.data)}
              style={{
                height: 46,
                borderRadius: 14,
                cursor: "pointer",
                border: tem ? "2px solid #F2B705" : "1px solid rgba(255,255,255,0.10)",
                background: tem ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                color: "white",
                fontWeight: 900,
              }}
              title={tem ? "Possui agendamentos" : "Sem agendamentos"}
            >
              {cell.diaNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { carregando, usuario, logout } = useSessaoBarbearia();
  const { setBarbearia: setBarebariaBProv } = useBarbearia().setBarbearia ? useBarbearia() : { setBarbearia: () => {} };
  const [aba, setAba] = useState("estatisticas");
  const [barbearia, setBarbearia] = useState(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  // Guard clause: se não tem slug, impede qualquer render/call perigosa
  useEffect(() => {
    if (!slug) {
      navigate("/login", { replace: true });
    }
  }, [slug, navigate]);

  if (!slug) {
    return (
      <main style={{
        minHeight: "100vh",
        padding: 24,
        color: "white",
        background: "radial-gradient(900px circle at 10% 10%, rgba(253,54,110,0.18), transparent 40%), radial-gradient(700px circle at 90% 0%, rgba(253,166,60,0.12), transparent 45%), rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>Carregando...</h1>
      </main>
    );
  }


  // Dados carregados do Appwrite
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicosState, setServicosState] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      setCarregandoDados(true);
      setErroCarregamento(null);

      try {
        // Valida se o slug da URL corresponde à barbearia do usuário
        const user = await account.get();
        const barbeariaDocs = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.barbearias,
          [Query.equal("user_id", user.$id)]
        );
        const barbeariaDoc = barbeariaDocs?.documents?.[0];
        if (!barbeariaDoc) throw new Error("Barbearia não encontrada para o usuário");

        // Verifica se o slug da URL bate com o slug da barbearia
        if (barbeariaDoc.slug !== slug) {
          navigate(`/dashboard/${barbeariaDoc.slug}`, { replace: true });
          return;
        }

        if (!mounted) return;
        setBarbearia(barbeariaDoc);

        // Carrega os dados da barbearia usando barbeariaDoc (não o estado)
        const barbeariaId = barbeariaDoc.$id;
        const COL_AGEND = COLLECTIONS.agendamentos;
        const COL_CLIENTES = COLLECTIONS.clientes;
        const COL_SERVICOS = COLLECTIONS.servicos;

        // Helper para buscar com fallback de Relationship
        const buscarComFallback = async (col) => {
          try {
            const resp = await databases.listDocuments(DB_ID, col, [Query.equal("barbearia_id", barbeariaId)]);
            if (resp?.documents?.length > 0) return resp.documents;
          } catch { /* Relationship pode falhar com Query.equal */ }
          // Fallback: busca tudo e filtra no cliente
          const all = await databases.listDocuments(DB_ID, col, [Query.limit(200)]);
          return (all?.documents ?? []).filter(
            (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
          );
        };

        const [agDocs, clDocs, svDocs] = await Promise.all([
          DB_ID && COL_AGEND ? buscarComFallback(COL_AGEND) : [],
          DB_ID && COL_CLIENTES ? buscarComFallback(COL_CLIENTES) : [],
          DB_ID && COL_SERVICOS ? buscarComFallback(COL_SERVICOS) : [],
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
    return () => {
      mounted = false;
    };
  }, [slug, navigate]);

  const [modalServico, setModalServico] = useState({ aberto: false, servico: null });
  const [modalDia, setModalDia] = useState({ aberto: false, data: null });

  const salvarServico = useCallback(
    async (dados) => {
      if (!barbearia) return;

      try {
        const payload = {
          nome: dados.nome,
          descricao: dados.descricao || " ",
          valor: String(dados.valor),
          duracao: String(dados.duracao),
          status: "ativo",
        };

        if (modalServico.servico?.$id) {
          // Editar
          await databases.updateDocument(
            DB_ID,
            COLLECTIONS.servicos,
            modalServico.servico.$id,
            payload
          );
        } else {
          // Criar novo
          await databases.createDocument(
            DB_ID,
            COLLECTIONS.servicos,
            ID.unique(),
            { ...payload, barbearia_id: barbearia.$id }
          );
        }

        // Recarrega serviços
        try {
          const sv = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [
            Query.equal("barbearia_id", barbearia.$id),
          ]);
          setServicosState(sv?.documents ?? []);
        } catch {
          const all = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.limit(200)]);
          setServicosState(
            (all?.documents ?? []).filter(
              (d) => d.barbearia_id === barbearia.$id || d.barbearia_id?.$id === barbearia.$id
            )
          );
        }
        setModalServico({ aberto: false, servico: null });
      } catch (err) {
        console.error("Erro ao salvar serviço:", err);
        alert("Erro ao salvar serviço: " + (err?.message || err));
      }
    },
    [barbearia, modalServico.servico]
  );

  const deletarServico = useCallback(
    async (servicoId) => {
      if (!barbearia || !window.confirm("Tem certeza que deseja deletar este serviço?")) return;

      try {
        await databases.deleteDocument(DB_ID, COLLECTIONS.servicos, servicoId);

        // Recarrega serviços
        try {
          const sv = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [
            Query.equal("barbearia_id", barbearia.$id),
          ]);
          setServicosState(sv?.documents ?? []);
        } catch {
          const all = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [Query.limit(200)]);
          setServicosState(
            (all?.documents ?? []).filter(
              (d) => d.barbearia_id === barbearia.$id || d.barbearia_id?.$id === barbearia.$id
            )
          );
        }
      } catch (err) {
        console.error("Erro ao deletar serviço:", err);
        alert("Erro ao deletar serviço: " + (err?.message || err));
      }
    },
    [barbearia]
  );
  const agendamentosDoDia = useMemo(() => {
    if (!modalDia.data) return [];
    return agendamentos
      .filter((a) => a.data_agendamento && a.data_agendamento.substring(0, 10) === modalDia.data)
      .sort((a, b) => (a.horario < b.horario ? -1 : 1));
  }, [agendamentos, modalDia.data]);

  const metrics = useMemo(() => {
    const total = agendamentos.length;
    const ativos = agendamentos.filter((a) => a.status === "ativo").length;
    const cancelados = agendamentos.filter((a) => a.status === "cancelado").length;
    const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
    const totalClientes = clientes.length;
    
    // Calcula faturamento (supondo que agendamentos tem preço)
    const faturamento = agendamentos
      .filter((a) => a.status === "concluido")
      .reduce((sum, a) => sum + (parseFloat(a.servico_id?.valor || a.preco) || 0), 0);
    
    // Dias com agendamentos
    const diasComAgendamentos = new Set(
      agendamentos
        .map((a) => a.data_agendamento?.substring(0, 10))
        .filter(Boolean)
    ).size;
    
    return { total, ativos, cancelados, concluidos, faturamento, totalClientes, diasComAgendamentos };
  }, [agendamentos, clientes]);

  const tAba = {
    estatisticas: "Estatísticas",
    agendamentos: "Agendamentos",
    clientes: "Clientes",
    servicos: "Serviços",
    calendario: "Calendário",
  };

  const itensNav = [
    { chave: "estatisticas" },
    { chave: "agendamentos" },
    { chave: "clientes" },
    { chave: "servicos" },
    { chave: "calendario" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 18,
        color: "white",
        background: "radial-gradient(900px circle at 10% 10%, rgba(253,54,110,0.18), transparent 40%), radial-gradient(700px circle at 90% 0%, rgba(253,166,60,0.12), transparent 45%), rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <aside style={{ position: "sticky", top: 14 }}>
          <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>
                  Barbearia (sessão)
                </div>
                <div style={{ fontWeight: 1000, fontSize: 16 }}>
                  {barbearia?.nome || barbearia?.nomeBarbearia || "—"}
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 16, background: "rgba(253,54,110,0.12)", border: "1px solid rgba(253,54,110,0.30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✂️
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              {itensNav.map((item) => {
                const active = aba === item.chave;
                return (
                  <button
                    key={item.chave}
                    onClick={() => setAba(item.chave)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 12px",
                      borderRadius: 16,
                      border: active ? "1px solid rgba(242,183,5,0.65)" : "1px solid rgba(255,255,255,0.10)",
                      background: active ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    {tAba[item.chave]}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14 }}>
              <Botao
                variante="secundario"
                onClick={logout}
                style={{ width: "100%", background: "rgba(255,128,128,0.10)", border: "1px solid rgba(255,128,128,0.25)" }}
              >
                Sair
              </Botao>
            </div>
          </div>
        </aside>

        <main style={{ display: "grid", gap: 16 }}>
          <header style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>
                  Área logada
                </div>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>{tAba[aba]}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => {
                    const linkUnico = `${window.location.origin}/${barbearia?.slug}`;
                    navigator.clipboard.writeText(linkUnico);
                    alert("Link copiado para a área de transferência!");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(242,183,5,0.35)",
                    background: "rgba(242,183,5,0.10)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                  title="Copiar link único para compartilhar com clientes"
                >
                  📋 Copiar link
                </button>
                <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, fontWeight: 800 }}>
                  {usuario?.email || "—"}
                </div>
              </div>
            </div>
          </header>

          {aba === "estatisticas" ? (
            <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              <Card>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Total agendamentos</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.total}</div>
              </Card>
              <Card variante="destaque">
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Ativos</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.ativos}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Cancelados</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.cancelados}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Concluídos</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.concluidos}</div>
              </Card>

              <Card variante="rosa">
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Total de clientes</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.totalClientes}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Dias com agendamentos</div>
                <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{metrics.diasComAgendamentos}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Faturamento</div>
                <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 6 }}>
                  R$ {metrics.faturamento.toFixed(2).replace(".", ",")}
                </div>
              </Card>
              <Card variante="rosa">
                <div style={{ fontWeight: 1000, marginBottom: 6 }}>Resumo</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.4 }}>
                  Você tem {metrics.total} agendamentos com {metrics.ativos} ativos.
                </div>
              </Card>
            </section>
          ) : null}

          {aba === "agendamentos" ? (
            <section style={{ display: "grid", gap: 12 }}>
              <Card>
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Lista de agendamentos</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Data", "Horário", "Cliente", "Serviço", "Status"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.65)",
                              fontWeight: 900,
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentos.map((a) => (
                        <tr key={a.$id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            {a.data_agendamento ? formatarDataISOParaPT(a.data_agendamento.substring(0, 10)) : "—"}
                          </td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.horario?.slice(0, 5) || "—"}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.cliente_id?.nome || "—"}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.servico_id?.nome || "—"}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", fontWeight: 900, fontSize: 12 }}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : null}

          {aba === "clientes" ? (
            <section style={{ display: "grid", gap: 12 }}>
              <Card>
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Lista de clientes</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Nome", "Telefone", "Email"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.65)",
                              fontWeight: 900,
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((c) => (
                        <tr key={c.$id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.nome}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.telefone}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.email || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : null}

          {aba === "servicos" ? (
            <section style={{ display: "grid", gap: 12 }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 1000, marginBottom: 0 }}>Lista de serviços</div>
                  <Botao
                    onClick={() => setModalServico({ aberto: true, servico: null })}
                    style={{ padding: "8px 12px", fontSize: 13 }}
                  >
                    + Adicionar Serviço
                  </Botao>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Serviço", "Duração", "Preço", "Ações"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.65)",
                              fontWeight: 900,
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {servicosState.map((s) => (
                        <tr key={s.$id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.nome}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.duracao} min</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            R$ {s.valor}
                          </td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <button
                              onClick={() => setModalServico({ aberto: true, servico: s })}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(253,166,60,0.35)",
                                background: "rgba(253,166,60,0.08)",
                                color: "rgba(253,166,60,1)",
                                cursor: "pointer",
                                fontWeight: 900,
                                fontSize: 12,
                                marginRight: 6,
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deletarServico(s.$id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,100,100,0.35)",
                                background: "rgba(255,100,100,0.08)",
                                color: "rgba(255,100,100,1)",
                                cursor: "pointer",
                                fontWeight: 900,
                                fontSize: 12,
                              }}
                            >
                              Deletar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : null}

          {aba === "calendario" ? (
            <section style={{ display: "grid", gap: 12 }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 16 }}>Calendário de agendamentos</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                      Dias com agendamento recebem borda dourada. Clique para ver detalhes.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <Calendario
                    agendamentos={agendamentos}
                    onSelecionarDia={(dataISO) => setModalDia({ aberto: true, data: dataISO })}
                  />
                </div>
              </Card>
            </section>
          ) : null}
        </main>
      </div>

      <Modal
        aberto={modalServico.aberto}
        titulo={modalServico.servico ? "Editar serviço" : "Adicionar serviço"}
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
        titulo={modalDia.data ? `Agendamentos • ${formatarDataISOParaPT(modalDia.data)}` : "Agendamentos"}
        onFechar={() => setModalDia({ aberto: false, data: null })}
      >
        {agendamentosDoDia.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.80)", fontSize: 14 }}>
            Nenhum agendamento para este dia.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {agendamentosDoDia.map((a) => (
              <div
                key={a.$id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ fontWeight: 1000, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>Horário</div>
                  <div style={{ fontWeight: 1000, fontSize: 16, marginTop: 6 }}>
                    {a.horario?.slice(0, 5) || "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 1000 }}>{a.cliente_id?.nome || "—"}</div>
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                    {a.servico_id?.nome || "—"} • {a.servico_id?.duracao || "—"} min
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.03)",
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
