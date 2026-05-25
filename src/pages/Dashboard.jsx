import { useMemo, useState, useEffect } from "react";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { account, databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";

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
    for (const a of agendamentos) set.add(a.data);
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
  const { usuario, logout } = useSessaoBarbearia();
  const [barbearia, setBarbearia] = useState(null);
  const [aba, setAba] = useState("estatisticas");

  // Dados carregados do Appwrite
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicosState, setServicosState] = useState([]);
  const [promocoes, setPromocoes] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      // load barbearia if not already loaded
      if (!barbearia) {
        try {
          const user = await account.get();
          const barbeariaDocs = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.barbearias,
            [Query.equal("user_id", user.$id)]
          );
          const barbeariaDoc = barbeariaDocs?.documents?.[0];
          if (!barbeariaDoc) throw new Error("Barbearia não encontrada para o usuário");
          if (!mounted) return;
          setBarbearia(barbeariaDoc);
        } catch (err) {
          console.error("Erro ao buscar barbearia:", err);
          setBarbearia(null);
          return;
        }
      }

      if (!barbearia?.$id) {
        setAgendamentos([]);
        setClientes([]);
        setServicosState([]);
        setPromocoes([]);
        return;
      }

      try {
        const barbeariaId = barbearia.$id;
        const COL_AGEND = COLLECTIONS.agendamentos;
        const COL_CLIENTES = COLLECTIONS.clientes;
        const COL_SERVICOS = COLLECTIONS.servicos;

        const [ag, cl, sv] = await Promise.all([
          DB_ID && COL_AGEND
            ? databases.listDocuments(DB_ID, COL_AGEND, [Query.equal("barbearia_id", barbeariaId)])
            : Promise.resolve(null),
          DB_ID && COL_CLIENTES
            ? databases.listDocuments(DB_ID, COL_CLIENTES, [Query.equal("barbearia_id", barbeariaId)])
            : Promise.resolve(null),
          DB_ID && COL_SERVICOS
            ? databases.listDocuments(DB_ID, COL_SERVICOS, [Query.equal("barbearia_id", barbeariaId)])
            : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setAgendamentos(ag?.documents ?? []);
        setClientes(cl?.documents ?? []);
        setServicosState(sv?.documents ?? []);
      } catch (err) {
        console.error("Dashboard carregar() erro:", err);
      }
    }

    carregar();
    return () => {
      mounted = false;
    };
  }, [barbearia]);

  const [modalDia, setModalDia] = useState({ aberto: false, data: null });
  const agendamentosDoDia = useMemo(() => {
    if (!modalDia.data) return [];
    return agendamentos
      .filter((a) => a.data === modalDia.data)
      .sort((a, b) => (a.horario < b.horario ? -1 : 1));
  }, [agendamentos, modalDia.data]);

  const metrics = useMemo(() => {
    const total = agendamentos.length;
    const ativos = agendamentos.filter((a) => a.status === "ativo").length;
    const cancelados = agendamentos.filter((a) => a.status === "cancelado").length;
    const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
    const faturamento = 0; // será calculado com preços/preço promo
    return { total, ativos, cancelados, concluidos, faturamento };
  }, [agendamentos]);

  const tAba = {
    estatisticas: "Estatísticas",
    agendamentos: "Agendamentos",
    clientes: "Clientes",
    servicos: "Serviços",
    promocoes: "Promoções",
    calendario: "Calendário",
  };

  const itensNav = [
    { chave: "estatisticas" },
    { chave: "agendamentos" },
    { chave: "clientes" },
    { chave: "servicos" },
    { chave: "promocoes" },
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
              <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, fontWeight: 800 }}>
                {usuario?.email || "—"}
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

              <div style={{ gridColumn: "1 / -1" }}>
                <Card variante="rosa">
                  <div style={{ fontWeight: 1000, marginBottom: 6 }}>Resumo</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.4 }}>
                    Métricas serão calculadas com os dados reais do Appwrite: faturamento por serviço/horário e aplicação de promoções.
                  </div>
                </Card>
              </div>
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
                        <tr key={a.id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            {formatarDataISOParaPT(a.data)}
                          </td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.horario.slice(0, 5)}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.cliente}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{a.servico}</td>
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
                        <tr key={c.id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.nome}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.telefone}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{c.email}</td>
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
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Lista de serviços</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Serviço", "Duração", "Preço"].map((h) => (
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
                        <tr key={s.id}>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.nome}</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.duracaoMin} min</td>
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            R$ {s.preco}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : null}

          {aba === "promocoes" ? (
            <section style={{ display: "grid", gap: 12 }}>
              <Card>
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Seção de promoções</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  {promocoes.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: p.ativa ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ fontWeight: 1000 }}>{p.titulo}</div>
                      <div style={{ marginTop: 8, color: "rgba(255,255,255,0.82)", fontSize: 14 }}>
                        {p.tipo === "percentual" ? `${p.valor}%` : `R$ ${p.valor}`} de desconto
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: p.ativa ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                            fontWeight: 900,
                            fontSize: 12,
                          }}
                        >
                          {p.ativa ? "Ativa" : "Pausada"}
                        </span>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.35 }}>
                        Regras por escopo e período serão aplicadas pelo backend.
                      </div>
                    </div>
                  ))}
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
                key={a.id}
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
                    {a.horario.slice(0, 5)}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 1000 }}>{a.cliente}</div>
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                    {a.servico} • {a.duracaoMin} min
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
