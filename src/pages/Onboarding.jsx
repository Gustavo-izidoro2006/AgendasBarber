import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { databases, COLLECTIONS, DB_ID } from "../lib/appwrite";

function Progresso({ etapaAtual, total }) {
  const percent = Math.round((etapaAtual / total) * 100);

  return (
    <div style={{ width: "100%", marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Etapa {etapaAtual} de {total}
        </div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{percent}%</div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "linear-gradient(90deg, rgba(253,54,110,0.95), rgba(253,166,60,0.95))",
          }}
        />
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
        textAlign: "left",
        padding: 22,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function Botao({ children, variante = "primario", ...props }) {
  const cores =
    variante === "secundario"
      ? {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          cor: "white",
        }
      : {
          background: "#FD366E",
          border: "1px solid rgba(255,255,255,0.10)",
          cor: "white",
        };

  return (
    <button
      {...props}
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        border: cores.border,
        background: cores.background,
        color: cores.cor,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function Campo({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

export default function Onboarding() {
  const { barbearia } = useSessaoBarbearia();
  const navigate = useNavigate();

  const etapas = useMemo(
    () => [
      { chave: "horarios", titulo: "Horários" },
      { chave: "servicos", titulo: "Serviços" },
      { chave: "precos", titulo: "Preços" },
      { chave: "promocoes", titulo: "Promoções" },
      { chave: "descricao", titulo: "Descrição" },
    ],
    []
  );

  const [etapaIndex, setEtapaIndex] = useState(0);

  const [horarios, setHorarios] = useState({});
  const [servicos, setServicos] = useState([]);
  const [precos, setPrecos] = useState({});
  const [promocoes, setPromocoes] = useState({ habilitada: false, tipo: "percentual", valor: 0 });
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (!barbearia) return;
    setHorarios(barbearia.horarios ?? {});
    setServicos(barbearia.servicos ?? []);
    setPrecos(barbearia.precos ?? {});
    setPromocoes(barbearia.promocoes ?? { habilitada: false, tipo: "percentual", valor: 0 });
    setDescricao(barbearia.descricao ?? "");
  }, [barbearia]);

  const total = etapas.length;
  const etapaAtual = etapaIndex + 1;
  const etapaChave = etapas[etapaIndex]?.chave;

  function avancar() {
    setEtapaIndex((i) => Math.min(total - 1, i + 1));
  }

  function voltar() {
    setEtapaIndex((i) => Math.max(0, i - 1));
  }

  async function finalizar() {
    // Persiste dados de onboarding na collection de barbearias
    try {
      const COL = COLLECTIONS.barbearias;
      const payload = { horarios, servicos, precos, promocoes, descricao };

      if (barbearia?.$id || barbearia?.id) {
        await databases.updateDocument(DB_ID, COL, barbearia.$id ?? barbearia.id, payload);
      } else {
        await databases.createDocument(DB_ID, COL, "unique()", { ...payload, nome: barbearia?.nome ?? "" });
      }
    } catch (err) {
      console.error("Onboarding finalizar() erro:", err);
    } finally {
      navigate("/dashboard");
    }
  }

  return (
    <main style={{ padding: 24, color: "white", minHeight: "100vh" }}>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 30 }}>Onboarding da barbearia</h1>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.82)" }}>
              Configure o essencial para liberar seu painel e começar a receber agendamentos.
            </p>
            <Progresso etapaAtual={etapaAtual} total={total} />
          </div>

          <div
            style={{
              minWidth: 240,
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 800 }}>
              Barbearia (sessão)
            </div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 900 }}>
              {barbearia?.nome || barbearia?.nomeBarbearia || "—"}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {barbearia?.slug ? `/${barbearia.slug}` : "Link será criado após persistência"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {/* Etapas */}
          {etapaChave === "horarios" ? (
            <section>
              <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>Horários</h2>
              <p style={{ marginTop: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                Selecione os dias de atendimento e o intervalo principal.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.86)",
                      fontSize: 14,
                      fontWeight: 800,
                      marginBottom: 10,
                    }}
                  >
                    Dias da semana
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {[
                      ["seg", "Segunda"],
                      ["ter", "Terça"],
                      ["qua", "Quarta"],
                      ["qui", "Quinta"],
                      ["sex", "Sexta"],
                      ["sab", "Sábado"],
                      ["dom", "Domingo"],
                    ].map(([ch, label]) => (
                      <label
                        key={ch}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 12,
                          borderRadius: 14,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.86)", fontWeight: 800 }}>
                          {label}
                        </span>
                        <input
                          type="checkbox"
                          checked={horarios[ch]}
                          onChange={(e) => setHorarios((h) => ({ ...h, [ch]: e.target.checked }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Campo label="Horário de início">
                    <input
                      type="time"
                      value={horarios.inicio}
                      onChange={(e) => setHorarios((h) => ({ ...h, inicio: e.target.value }))}
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
                  </Campo>

                  <Campo label="Horário de término">
                    <input
                      type="time"
                      value={horarios.fim}
                      onChange={(e) => setHorarios((h) => ({ ...h, fim: e.target.value }))}
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
                  </Campo>

                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 16,
                      background: "rgba(253,54,110,0.10)",
                      border: "1px solid rgba(253,54,110,0.22)",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                    }}
                  >
                    <strong>Obs.:</strong> os horários são salvos no backend e serão usados para gerar slots livres no calendário.
                    automaticamente.
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {etapaChave === "servicos" ? (
            <section>
              <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>Serviços</h2>
              <p style={{ marginTop: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                Adicione serviços e defina a duração.
              </p>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>Lista de serviços</div>
                    <button
                      type="button"
                      onClick={() => {
                        const id = `srv-${Date.now()}`;
                        setServicos((s) => [...s, { id, nome: "Novo serviço", duracaoMin: 30 }]);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: 900,
                      }}
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {servicos.map((srv) => (
                      <div
                        key={srv.id}
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>ID: {srv.id}</div>

                        <div style={{ marginTop: 10 }}>
                          <Campo label="Nome do serviço">
                            <input
                              value={srv.nome}
                              onChange={(e) => {
                                const v = e.target.value;
                                setServicos((list) => list.map((x) => (x.id === srv.id ? { ...x, nome: v } : x)));
                              }}
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
                          </Campo>
                        </div>

                        <Campo label="Duração (min)">
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={srv.duracaoMin}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setServicos((list) => list.map((x) => (x.id === srv.id ? { ...x, duracaoMin: v } : x)));
                            }}
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
                        </Campo>

                        <button
                          type="button"
                          onClick={() => {
                            setServicos((list) => list.filter((x) => x.id !== srv.id));
                            setPrecos((p) => {
                              const next = { ...p };
                              delete next[srv.id];
                              return next;
                            });
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: "rgba(255,128,128,0.12)",
                            border: "1px solid rgba(255,128,128,0.22)",
                            color: "#ff8080",
                            cursor: "pointer",
                            fontWeight: 900,
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "rgba(253,166,60,0.08)",
                      border: "1px solid rgba(253,166,60,0.22)",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Próximo passo</div>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                      Depois de definir serviços, vamos configurar <strong>preços</strong> para cada item.
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>Pré-visualização</div>
                    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                      {servicos.slice(0, 4).map((srv) => (
                        <div
                          key={srv.id}
                          style={{
                            padding: 14,
                            borderRadius: 16,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900 }}>{srv.nome}</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{srv.duracaoMin} min</div>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.86)", fontWeight: 900 }}>
                            {precos[srv.id] != null ? `R$ ${precos[srv.id]}` : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {etapaChave === "precos" ? (
            <section>
              <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>Preços</h2>
              <p style={{ marginTop: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Defina o preço de cada serviço.</p>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {servicos.map((srv) => (
                  <div
                    key={srv.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "grid",
                      gridTemplateColumns: "1fr 200px",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>{srv.nome}</div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{srv.duracaoMin} min</div>
                    </div>

                    <Campo label="Preço (R$)">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={precos[srv.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? "" : Number(e.target.value);
                          setPrecos((p) => ({ ...p, [srv.id]: v }));
                        }}
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
                    </Campo>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {etapaChave === "promocoes" ? (
            <section>
              <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>Promoções</h2>
              <p style={{ marginTop: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                Habilite uma promoção e defina regras (serão salvas no backend).
              </p>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Campo label="Habilitar promoções">
                    <select
                      value={promocoes.habilitada ? "sim" : "nao"}
                      onChange={(e) => setPromocoes((p) => ({ ...p, habilitada: e.target.value === "sim" }))}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        color: "white",
                        outline: "none",
                      }}
                    >
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </Campo>

                  <Campo label="Tipo">
                    <select
                      value={promocoes.tipo}
                      onChange={(e) => setPromocoes((p) => ({ ...p, tipo: e.target.value }))}
                      disabled={!promocoes.habilitada}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        color: "white",
                        outline: "none",
                        opacity: promocoes.habilitada ? 1 : 0.6,
                      }}
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor">Valor fixo (R$)</option>
                    </select>
                  </Campo>

                  <Campo label={promocoes.tipo === "percentual" ? "Percentual" : "Valor (R$)"}>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={promocoes.valor}
                      onChange={(e) => setPromocoes((p) => ({ ...p, valor: Number(e.target.value) }))}
                      disabled={!promocoes.habilitada}
                      style={{
                        width: "100%",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        color: "white",
                        outline: "none",
                        opacity: promocoes.habilitada ? 1 : 0.6,
                      }}
                    />
                  </Campo>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: "rgba(253,166,60,0.08)",
                    border: "1px solid rgba(253,166,60,0.22)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Exemplo</div>
                  <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14 }}>
                    {promocoes.habilitada ? (
                      <>
                        Todos os serviços com{" "}
                        <strong>{promocoes.tipo === "percentual" ? `${promocoes.valor}%` : `R$ ${promocoes.valor}`}</strong>{" "}
                        de desconto.
                      </>
                    ) : (
                      <>Promoções desabilitadas no momento.</>
                    )}
                  </div>
                  <div style={{ marginTop: 12, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    No Appwrite, depois modelaremos promoções por escopo (serviço/cliente) e regras.
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {etapaChave === "descricao" ? (
            <section>
              <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>Descrição</h2>
              <p style={{ marginTop: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                Uma breve descrição para aparecer no link público.
              </p>

              <div style={{ marginTop: 14 }}>
                <Campo label="Descrição">
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </Campo>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 13,
                  }}
                >
                  <strong>Pronto:</strong> ao clicar em “Concluir”, vamos liberar seu Dashboard.
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {/* Rodapé do onboarding */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
          <Botao
            variante="secundario"
            onClick={voltar}
            disabled={etapaIndex === 0}
            type="button"
          >
            Voltar
          </Botao>

          {etapaIndex === total - 1 ? (
            <Botao onClick={finalizar} type="button">
              Concluir
            </Botao>
          ) : (
            <Botao onClick={avancar} type="button">
              Continuar
            </Botao>
          )}
        </div>
      </Card>
    </main>
  );
}
