import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  buscarBarbeariaPorSlug,
  buscarServicosDaBarbearia,
  criarAgendamento,
} from "../services/barbeariaPublicaService";
import { criarCliente } from "../services/clientesService";

function formatarDataISOParaPT(dataISO) {
  const [y, m, d] = dataISO.split("-").map((x) => Number(x));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function gerarProximosDias(qtd = 21) {
  const hoje = new Date();
  const dias = [];
  for (let i = 0; i < qtd; i++) {
    const dt = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    dias.push(iso);
  }
  return dias;
}

export default function BarbeariaPublica() {
  const { slug } = useParams();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);

  const [dias] = useState(() => gerarProximosDias(21));
  const [data, setData] = useState(dias[0] ?? "");

  const horariosBase = useMemo(
    () => ["08:00:00", "09:00:00", "10:00:00", "11:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00"],
    []
  );
  const [horario, setHorario] = useState(horariosBase[0] ?? "");

  const [servicoId, setServicoId] = useState("");
  const selecionadoServico = useMemo(() => {
    return servicos.find((s) => s.$id === servicoId || s.id === servicoId) ?? null;
  }, [servicos, servicoId]);

  const duracaoMin = selecionadoServico?.duracaoMin ?? selecionadoServico?.duracao ?? null;
  const servicoNome = selecionadoServico?.nome ?? selecionadoServico?.titulo ?? "";
  const preco = selecionadoServico?.preco ?? null;

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      setBarbearia(null);
      setServicos([]);

      try {
        if (!slug) throw new Error("Slug não informado.");

        const found = await buscarBarbeariaPorSlug(slug);
        if (!mounted) return;

        if (!found) {
          setErro("Barbearia não encontrada.");
          setCarregando(false);
          return;
        }

        setBarbearia(found);

        const lista = await buscarServicosDaBarbearia(found.$id ?? found.id);
        if (!mounted) return;

        setServicos(lista ?? []);

        const first = lista?.[0];
        if (first) setServicoId(first.$id ?? first.id ?? "");
      } catch (e) {
        if (!mounted) return;
        setErro(e?.message || "Falha ao carregar dados da barbearia.");
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregar();
    return () => {
      mounted = false;
    };
  }, [slug]);

  async function confirmarAgendamento() {
    setErro(null);
    setEnviando(true);
    setConfirmado(null);

    try {
      if (!barbearia?.$id && !barbearia?.id) throw new Error("Barbearia não carregada.");
      const barbeariaId = barbearia.$id ?? barbearia.id;

      if (!clienteNome.trim()) throw new Error("Informe seu nome.");
      if (!clienteTelefone.trim()) throw new Error("Informe seu telefone.");
      if (!data) throw new Error("Selecione uma data.");
      if (!horario) throw new Error("Selecione um horário.");
      if (!selecionadoServico) throw new Error("Selecione um serviço.");
      if (!duracaoMin) throw new Error("Duração do serviço inválida.");

      // Monta horario fim com base na duração do serviço.
      const inicio = new Date(`1970-01-01T${horario}`);
      const fim = new Date(inicio.getTime() + Number(duracaoMin) * 60 * 1000);

      const formatHora = (dt) =>
        `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:00`;

      const horarioFim = formatHora(fim);

      // cria cliente localmente na collection `clientes_barbearia` e vincula ao agendamento
      let clienteDoc = null;
      try {
        clienteDoc = await criarCliente({
          barbearia_id: barbeariaId,
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim(),
          email: null,
          observacoes: null,
        });
      } catch (err) {
        // se falhar, continuamos com cliente_id null e colocamos nome/telefone em observacoes
        console.warn("Falha ao criar cliente automático:", err);
      }

      const criado = await criarAgendamento({
        barbearia_id: barbeariaId,
        cliente_id: clienteDoc?.$id ?? clienteDoc?.id ?? null,
        servico_id: selecionadoServico.$id ?? selecionadoServico.id,
        data_agendamento: data,
        horario: horario,
        observacoes: clienteDoc ? null : `Nome: ${clienteNome.trim()} • Telefone: ${clienteTelefone.trim()}`,
      });

      setConfirmado(criado);
    } catch (e) {
      setErro(e?.message || "Falha ao confirmar agendamento.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <main style={{ minHeight: "100vh", padding: 24, color: "white" }}>
        <h1 style={{ margin: 0 }}>Carregando...</h1>
      </main>
    );
  }

  if (erro) {
    return (
      <main style={{ minHeight: "100vh", padding: 24, color: "white" }}>
        <h1 style={{ margin: 0 }}>Ops</h1>
        <p style={{ marginTop: 12, color: "rgba(255,128,128,0.95)" }}>{erro}</p>
      </main>
    );
  }

  const nomeBarbearia = barbearia?.nomeBarbearia ?? barbearia?.nome ?? "Barbearia";
  const descricao = barbearia?.descricao ?? "";
  const imagem = barbearia?.imagem ?? null;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 18,
        color: "white",
        background:
          "radial-gradient(900px circle at 10% 10%, rgba(253,54,110,0.18), transparent 40%), radial-gradient(700px circle at 90% 0%, rgba(253,166,60,0.14), transparent 45%), rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16, gridTemplateColumns: "1.05fr 0.95fr" }}>
        <section style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <header style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {imagem ? (
              <img
                src={imagem}
                alt={nomeBarbearia}
                style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 18, background: "rgba(253,54,110,0.16)", border: "1px solid rgba(253,54,110,0.30)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                ✂️
              </div>
            )}

            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>{nomeBarbearia}</h1>
              {descricao ? (
                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.85)" }}>{descricao}</p>
              ) : null}
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.70)" }}>
                Escolha serviço, data e horário para agendar online.
              </p>
            </div>
          </header>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Serviços e preços</div>

              <div style={{ display: "grid", gap: 10 }}>
                {servicos.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>Nenhum serviço disponível.</div>
                ) : (
                  servicos.map((s) => {
                    const id = s.$id ?? s.id;
                    const ativo = id === servicoId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setServicoId(id);
                        }}
                        style={{
                          textAlign: "left",
                          padding: 14,
                          borderRadius: 16,
                          cursor: "pointer",
                          border: ativo ? "2px solid #F2B705" : "1px solid rgba(255,255,255,0.10)",
                          background: ativo ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                          color: "white",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 1000 }}>{s.nome ?? s.titulo}</div>
                          <div style={{ fontWeight: 1000, color: "rgba(255,255,255,0.95)" }}>
                            {s.preco != null ? `R$ ${s.preco}` : "—"}
                          </div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                          Duração: {s.duracaoMin ?? s.duracao ?? "—"} min
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Data</div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                {dias.map((iso) => {
                  const ativo = iso === data;
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => setData(iso)}
                      style={{
                        minWidth: 132,
                        padding: "12px 12px",
                        borderRadius: 14,
                        cursor: "pointer",
                        border: ativo ? "2px solid #F2B705" : "1px solid rgba(255,255,255,0.10)",
                        background: ativo ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                        color: "white",
                        fontWeight: 900,
                      }}
                    >
                      {formatarDataISOParaPT(iso)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Horário</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {horariosBase.map((h) => {
                  const ativo = h === horario;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorario(h)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        cursor: "pointer",
                        border: ativo ? "2px solid #F2B705" : "1px solid rgba(255,255,255,0.10)",
                        background: ativo ? "rgba(242,183,5,0.10)" : "rgba(255,255,255,0.03)",
                        color: "white",
                        fontWeight: 900,
                      }}
                    >
                      {h.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                Horários ocupados são verificados pelo backend.
              </div>
            </div>
          </div>
        </section>

        <aside style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div style={{ fontWeight: 1000, marginBottom: 8 }}>Seus dados</div>

          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "block" }}>
              <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>Nome</div>
              <input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                type="text"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "block" }}>
              <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>Telefone</div>
              <input
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                type="tel"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                }}
              />
            </label>

            <div style={{ marginTop: 2 }}>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Resumo</div>
              <div style={{ padding: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontWeight: 900 }}>
                  {servicoNome ? servicoNome : "Serviço selecionado"}
                </div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)", fontSize: 13 }}>
                  {data ? formatarDataISOParaPT(data) : "—"} • {horario ? horario.slice(0, 5) : "—"}
                </div>
                <div style={{ marginTop: 8, color: "rgba(255,255,255,0.78)", fontSize: 13 }}>
                  {preco != null ? `Preço: R$ ${preco}` : ""}
                </div>
              </div>
            </div>

            {erro ? (
              <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,128,128,0.35)", background: "rgba(255,128,128,0.10)", color: "#ff8080", fontSize: 14 }}>
                {erro}
              </div>
            ) : null}

            {confirmado ? (
              <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(242,183,5,0.35)", background: "rgba(242,183,5,0.10)", fontSize: 14, color: "rgba(255,255,255,0.92)" }}>
                <div style={{ fontWeight: 1000, marginBottom: 6 }}>Agendamento confirmado ✅</div>
                <div style={{ color: "rgba(255,255,255,0.80)" }}>
                  ID: {confirmado.$id}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={confirmarAgendamento}
              disabled={enviando || !selecionadoServico}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: enviando ? "rgba(253,54,110,0.35)" : "#FD366E",
                color: "white",
                cursor: enviando ? "not-allowed" : "pointer",
                fontWeight: 900,
              }}
            >
              {enviando ? "Confirmando..." : "Confirmar agendamento"}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              O agendamento é vinculado ao documento da barbearia via <strong>barbeariaId</strong> (multi-tenant).
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
