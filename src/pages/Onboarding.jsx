import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query, ID, upsertById } from "../lib/appwrite";

function Progresso({ etapaAtual, total }) {
  const percent = Math.round((etapaAtual / total) * 100);
  return (
    <div style={{ width: "100%", marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 800 }}>
          Etapa {etapaAtual} de {total}
        </div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{percent}%</div>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "linear-gradient(90deg,#FD366E,#F2A63A)",
            transition: "width 0.3s ease",
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
        padding: 22,
        borderRadius: 18,
        background: "linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function Botao({ children, variante = "primario", ...props }) {
  const bg = variante === "secundario" ? "rgba(255,255,255,0.06)" : "#FD366E";
  return (
    <button
      {...props}
      style={{
        padding: "12px 18px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: bg,
        color: "white",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        opacity: props.disabled ? 0.5 : 1,
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

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
};

export default function Onboarding() {
  const { carregando, usuario } = useSessaoBarbearia();
  const { barbearia, setBarbearia } = useBarbearia();
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) navigate("/login", { replace: true });
  }, [carregando, usuario, navigate]);

  const etapas = useMemo(
    () => [
      { chave: "horarios", titulo: "Horários" },
      { chave: "servicos", titulo: "Serviços" },
      { chave: "precos", titulo: "Preços" },
    ],
    []
  );

  const [etapaIndex, setEtapaIndex] = useState(0);
  const [horarios, setHorarios] = useState({});
  const [servicos, setServicos] = useState([]);
  const [precos, setPrecos] = useState({});

  const total = etapas.length;
  const etapaAtual = etapaIndex + 1;
  const etapaChave = etapas[etapaIndex]?.chave;

  const avancar = () => setEtapaIndex((i) => Math.min(total - 1, i + 1));
  const voltar = () => setEtapaIndex((i) => Math.max(0, i - 1));

  const finalizar = useCallback(async () => {
    if (salvando) return;
    setSalvando(true);
    setErroSalvar(null);

    try {
      const user = usuario;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      let barbeariaDoc = barbearia?.$id ? barbearia : null;

      if (!barbeariaDoc?.$id) {
        const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ]);
        barbeariaDoc = resp?.documents?.[0] ?? null;
      }

      if (!barbeariaDoc?.$id) {
        const nome = user?.name ?? "Barbearia";
        const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        barbeariaDoc = await databases.createDocument(DB_ID, COLLECTIONS.barbearias, ID.unique(), {
          nome,
          slug,
          email: user?.email ?? "",
          telefone: "",
          endereco: "",
          descricao: "",
          imagem: "",
          instagram: "",
          whatsapp: "",
          status: "ativo",
          criado_em: new Date().toISOString(),
          user_id: user.$id,
        });
      }

      const barbeariaId = barbeariaDoc.$id;
      const slug = barbeariaDoc.slug;
      if (!barbeariaId || !slug) throw new Error("Dados da barbearia não resolvidos.");

      // 2) Configurações – ID determinístico (1-1 com barbearia)
      const configId = `cfg_${barbeariaId}`;
      await upsertById("configuracoes", configId, {
        barbearia_id: barbeariaId,
        onboarding_completo: false,
        intervalo_agendamento: 30,
        antecedencia_minima: 1,
      });

      const mapDias = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
      const abertura = horarios?.inicio || "08:00";
      const fechamento = horarios?.fim || "18:00";

      const diasSel = Object.entries(horarios)
        .filter(([k, v]) => typeof v === "boolean" && v)
        .map(([k]) => k);

      // 3) Horários – busca todos e filtra client-side (Relationship não é indexado)
      const allHorarios = await databases.listDocuments(DB_ID, COLLECTIONS.horarios, [
        Query.limit(500),
      ]);
      const meusHorarios = allHorarios.documents.filter(h => {
        const hBarbId = typeof h.barbearia_id === "string" ? h.barbearia_id : h.barbearia_id?.$id;
        return hBarbId === barbeariaId;
      });

      for (const ch of diasSel) {
        const dia_semana = mapDias[ch];
        if (dia_semana === undefined) continue;

        const existingHor = meusHorarios.find(h => h.dia_semana === dia_semana) ?? null;
        const dataHorario = {
          barbearia_id: barbeariaId,
          dia_semana,
          abertura,
          fechamento,
          ativo: "true",
        };
        if (existingHor) {
          await databases.updateDocument(DB_ID, COLLECTIONS.horarios, existingHor.$id, dataHorario);
        } else {
          await databases.createDocument(DB_ID, COLLECTIONS.horarios, ID.unique(), dataHorario);
        }
      }

      // 4) Serviços – busca todos e filtra client-side (Relationship não é indexado)
      const allServicos = await databases.listDocuments(DB_ID, COLLECTIONS.servicos, [
        Query.limit(500),
      ]);
      const meusServicos = allServicos.documents.filter(s => {
        const sBarbId = typeof s.barbearia_id === "string" ? s.barbearia_id : s.barbearia_id?.$id;
        return sBarbId === barbeariaId;
      });

      for (const srv of servicos) {
        const nome = srv.nome?.trim();
        if (!nome) continue;

        const duracao = String(srv.duracaoMin ?? 30);
        const valorRaw = precos?.[srv.id];
        const valor = valorRaw != null && valorRaw !== "" ? String(valorRaw) : "0";

        const existingServ = meusServicos.find(s => s.nome === nome) ?? null;
        const dataServico = {
          barbearia_id: barbeariaId,
          nome,
          descricao: srv.descricao?.trim() || " ",
          valor,
          duracao,
          status: "ativo",
          criado_em: new Date().toISOString(),
        };
        if (existingServ) {
          await databases.updateDocument(DB_ID, COLLECTIONS.servicos, existingServ.$id, dataServico);
        } else {
          await databases.createDocument(DB_ID, COLLECTIONS.servicos, ID.unique(), dataServico);
        }
      }

      // 5) Marca onboarding como completo (mesmo ID determinístico)
      await upsertById("configuracoes", configId, {
        barbearia_id: barbeariaId,
        onboarding_completo: true,
        intervalo_agendamento: 30,
        antecedencia_minima: 1,
      });

      setBarbearia(barbeariaDoc);
      navigate(`/dashboard/${slug}`, { replace: true });
    } catch (err) {
      console.error("Onboarding finalizar() erro:", err?.message, err);
      setErroSalvar(err?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }, [salvando, usuario, barbearia, horarios, servicos, precos, navigate, setBarbearia]);

  return (
    <main style={{ padding: 24, color: "white", minHeight: "100vh", background: "#0a0a0a" }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .onboarding-card { animation: fadeSlideUp 0.25s ease; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      <Card>
        <div className="onboarding-card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Configure sua barbearia</h1>
              <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.70)", fontSize: 14 }}>
                Configure o essencial para começar a receber agendamentos.
              </p>
              <Progresso etapaAtual={etapaAtual} total={total} />
            </div>

            <div style={{ minWidth: 220, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Sua barbearia
              </div>
              <div style={{ marginTop: 6, fontWeight: 800 }}>{barbearia?.nome || "—"}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                {barbearia?.slug ? `/${barbearia.slug}` : "slug gerado ao concluir"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            {etapaChave === "horarios" && (
              <section>
                <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 20, fontWeight: 800 }}>Horários de atendimento</h2>
                <p style={{ marginTop: 0, color: "rgba(255,255,255,0.70)", fontSize: 14 }}>
                  Selecione os dias e o horário de funcionamento.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Dias da semana</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: horarios[ch] ? "rgba(253,54,110,0.12)" : "rgba(255,255,255,0.03)",
                            border: horarios[ch] ? "1px solid rgba(253,54,110,0.35)" : "1px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
                          <input
                            type="checkbox"
                            checked={!!horarios[ch]}
                            onChange={(e) => setHorarios((h) => ({ ...h, [ch]: e.target.checked }))}
                            style={{ accentColor: "#FD366E", width: 16, height: 16 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Campo label="Horário de início">
                      <input
                        type="time"
                        value={horarios.inicio ?? ""}
                        onChange={(e) => setHorarios((h) => ({ ...h, inicio: e.target.value }))}
                        style={inputStyle}
                      />
                    </Campo>

                    <Campo label="Horário de término">
                      <input
                        type="time"
                        value={horarios.fim ?? ""}
                        onChange={(e) => setHorarios((h) => ({ ...h, fim: e.target.value }))}
                        style={inputStyle}
                      />
                    </Campo>

                    <div style={{ padding: 14, borderRadius: 14, background: "rgba(253,54,110,0.08)", border: "1px solid rgba(253,54,110,0.20)", fontSize: 13, color: "rgba(255,255,255,0.80)" }}>
                      Os slots de horário serão gerados automaticamente entre o início e o término, com intervalos de 30 minutos.
                    </div>
                  </div>
                </div>
              </section>
            )}

            {etapaChave === "servicos" && (
              <section>
                <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 20, fontWeight: 800 }}>Serviços oferecidos</h2>
                <p style={{ marginTop: 0, color: "rgba(255,255,255,0.70)", fontSize: 14 }}>
                  Adicione os serviços da sua barbearia.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontWeight: 700 }}>Lista de serviços</span>
                      <button
                        type="button"
                        onClick={() => {
                          const id = `srv-${Date.now()}`;
                          setServicos((s) => [...s, { id, nome: "", duracaoMin: 30 }]);
                        }}
                        style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                      >
                        + Adicionar
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {servicos.length === 0 && (
                        <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.10)", textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                          Nenhum serviço adicionado ainda
                        </div>
                      )}

                      {servicos.map((srv) => (
                        <div key={srv.id} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <Campo label="Nome">
                            <input
                              value={srv.nome}
                              onChange={(e) => {
                                const v = e.target.value;
                                setServicos((l) => l.map((x) => (x.id === srv.id ? { ...x, nome: v } : x)));
                              }}
                              placeholder="Ex: Corte simples"
                              style={inputStyle}
                            />
                          </Campo>

                          <Campo label="Duração (min)">
                            <input
                              type="number"
                              min={5}
                              step={5}
                              value={srv.duracaoMin}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setServicos((l) => l.map((x) => (x.id === srv.id ? { ...x, duracaoMin: v } : x)));
                              }}
                              style={inputStyle}
                            />
                          </Campo>

                          <button
                            type="button"
                            onClick={() => {
                              setServicos((l) => l.filter((x) => x.id !== srv.id));
                              setPrecos((p) => {
                                const n = { ...p };
                                delete n[srv.id];
                                return n;
                              });
                            }}
                            style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,80,80,0.10)", border: "1px solid rgba(255,80,80,0.20)", color: "#ff8080", cursor: "pointer", fontSize: 13 }}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ padding: 16, borderRadius: 14, background: "rgba(242,166,58,0.08)", border: "1px solid rgba(242,166,58,0.20)" }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Pré-visualização</div>
                      {servicos.length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Adicione serviços para ver a pré-visualização</div>
                      ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                          {servicos.map((srv) => (
                            <div key={srv.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{srv.nome || "—"}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{srv.duracaoMin} min</div>
                              </div>
                              <div style={{ fontWeight: 700, color: "#FD366E" }}>
                                {precos[srv.id] != null && precos[srv.id] !== "" ? `R$ ${precos[srv.id]}` : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {etapaChave === "precos" && (
              <section>
                <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 20, fontWeight: 800 }}>Preços</h2>
                <p style={{ marginTop: 0, color: "rgba(255,255,255,0.70)", fontSize: 14 }}>
                  Defina o preço de cada serviço.
                </p>

                {servicos.length === 0 ? (
                  <div style={{ marginTop: 16, padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)", textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
                    Nenhum serviço cadastrado. Volte à etapa anterior e adicione serviços.
                  </div>
                ) : (
                  <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                    {servicos.map((srv) => (
                      <div key={srv.id} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "1fr 180px", gap: 12, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{srv.nome}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{srv.duracaoMin} min</div>
                        </div>
                        <Campo label="Preço (R$)">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={precos[srv.id] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value === "" ? "" : Number(e.target.value);
                              setPrecos((p) => ({ ...p, [srv.id]: v }));
                            }}
                            placeholder="0.00"
                            style={inputStyle}
                          />
                        </Campo>
                      </div>
                    ))}
                  </div>
                )}

                {erroSalvar && (
                  <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(255,80,80,0.10)", border: "1px solid rgba(255,80,80,0.25)", color: "#ff8080", fontSize: 14 }}>
                    ⚠️ {erroSalvar}
                  </div>
                )}
              </section>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
            <Botao variante="secundario" onClick={voltar} disabled={etapaIndex === 0} type="button">
              Voltar
            </Botao>

            {etapaIndex === total - 1 ? (
              <Botao onClick={finalizar} disabled={salvando} type="button">
                {salvando ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Salvando...
                  </span>
                ) : (
                  "Concluir"
                )}
              </Botao>
            ) : (
              <Botao onClick={avancar} type="button">
                Continuar
              </Botao>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}