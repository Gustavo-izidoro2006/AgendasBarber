import { useMemo, useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query, upsertDocument } from "../lib/appwrite";
import { ID } from "appwrite";
import {
  criarServico,
} from "../services/servicosService";


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
  const { carregando, usuario } = useSessaoBarbearia();
  const { barbearia, recarregarBarbearia, setBarbearia } = useBarbearia();
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      navigate("/login", { replace: true });
      return;
    }
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

  // We remove this effect because the barbearia document (from clientes collection) does not contain
  // horarios, servicos, precos, promocoes, descricao. These are stored in separate collections.
  // Instead, we will load existing data from those collections when editing (if needed) in a separate step.
  // For initial onboarding, we start with empty/default state.

  const total = etapas.length;
  const etapaAtual = etapaIndex + 1;
  const etapaChave = etapas[etapaIndex]?.chave;

  function avancar() {
    setEtapaIndex((i) => Math.min(total - 1, i + 1));
  }

  function voltar() {
    setEtapaIndex((i) => Math.max(0, i - 1));
  }

    // Substitua a sua função inteira por esta até o início do seu "return (" do HTML
  const finalizar = async () => {
    if (salvando) return; // evita dupla execução (React StrictMode)
    setSalvando(true);
    try {
      // 1) Usa o usuário já autenticado do contexto — sem chamar getAccount() de novo
      const user = usuario;

      if (!user) {
        // Fallback: não deveria chegar aqui pois RotaProtegida já garante autenticação
        navigate("/login", { replace: true });
        return;
      }

      let barbeariaDoc = barbearia?.$id ? barbearia : null;
      let barbeariaId = barbeariaDoc?.$id ?? barbeariaDoc?.id ?? null;
      let slug = barbeariaDoc?.slug ?? barbearia?.slug ?? null;

      if (!barbeariaId) {
        const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ]);
        barbeariaDoc = resp?.documents?.[0] ?? null;
        barbeariaId = barbeariaDoc?.$id ?? null;
        slug = barbeariaDoc?.slug ?? null;
      }

      if (!barbeariaId) {
        // Caso não exista documento, cria a partir da conta
        const nomeAut = user?.name ?? user?.email ?? "Barbearia";
        const baseSlug = String(nomeAut)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        slug = baseSlug || "barbearia";

        const created = await databases.createDocument(DB_ID, COLLECTIONS.barbearias, ID.unique(), {
          nome: nomeAut,
          slug,
          email: user?.email ?? "",
          user_id: user.$id,
          status: "ativo",
        });
        barbeariaDoc = created;
        barbeariaId = created.$id;
      }

      if (!barbeariaId) throw new Error("barbeariaId não resolvido");
      if (!slug) throw new Error("slug da barbearia não resolvido");


      // 2) Criar/atualizar `configuracoes_barbearia` (One-to-One)
      // Busca doc existente — Relationship pode falhar com Query.equal, usa fallback
      let configDoc = null;
      try {
        const configDocs = await databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, [
          Query.equal("barbearia_id", barbeariaId),
          Query.limit(1),
        ]);
        configDoc = configDocs?.documents?.[0] ?? null;
      } catch {
        // Fallback: busca tudo e filtra no cliente
        try {
          const all = await databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, [Query.limit(25)]);
          configDoc = (all?.documents ?? []).find(
            (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
          ) ?? null;
        } catch { /* ignora — vai criar abaixo */ }
      }

      const configuracoesPayload = {
        barbearia_id: barbeariaId,
        // FIELD TYPES: Appwrite é STRICT com tipos! 
        // Schema diz: onboarding_completo = BOOLEAN → enviar true/false (NOT "true"/"false")
        // Erro comum: 400 "Invalid document structure: Attribute 'onboarding_completo' has invalid type"
        // REF: https://appwrite.io/docs/products/databases
        onboarding_completo: false,
        intervalo_agendamento: 15,
        antecedencia_minima: 2,
      };

      console.debug("[Onboarding] configuracoesPayload ->", configuracoesPayload);

      // Usa upsert para garantir idempotência (evita 409 Conflict se já existir)
      // ESTRATÉGIA APPWRITE: Create com ID.unique() → 409? → Busca & Update
      // REF: https://appwrite.io/docs/references/cloud/client-web/databases#upsert-a-document
      const upsertResult = await upsertDocument("configuracoes", [Query.equal("barbearia_id", barbeariaId)], configuracoesPayload);
      if (upsertResult?.$id) {
        configDoc = upsertResult;
      } else {
        // Se upsert não encontrou/atualizou, busca manualmente (pode ser que já exista de tentativa anterior)
        try {
          const all = await databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, [Query.limit(25)]);
          configDoc = all?.documents?.find(d => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId) ?? configDoc;
        } catch { /* ignora */ }
      }

      // 3) Criar documentos em `horarios_atendimento`
      const diasSelecionados = Object.entries(horarios)
        .filter(([k, v]) => typeof v === "boolean" && v === true)
        .map(([k]) => k);

      const abertura = horarios?.inicio || "";
      const fechamento = horarios?.fim || "";

      const mapDiaSemana = {
        dom: 0,
        seg: 1,
        ter: 2,
        qua: 3,
        qui: 4,
        sex: 5,
        sab: 6,
      };

      for (const ch of diasSelecionados) {
        const dia_semana = mapDiaSemana[ch];
        // dia_semana pode ser 0 (domingo) — verificar undefined ou null em vez de falsy
        if (dia_semana === undefined || dia_semana === null) continue;

        const horariosPayload = {
          barbearia_id: barbeariaId,
          dia_semana,
          abertura,
          fechamento,
          // FIELD TYPES: Schema diz ativo = STRING → enviar "true"/"false" (NOT boolean true/false)
          // Erro comum: 400 "Invalid document structure: Attribute 'ativo' has invalid type"
          // REF: https://appwrite.io/docs/products/databases
          ativo: "true",
        };

        console.debug("[Onboarding] horariosPayload ->", horariosPayload);

        // QUERY COM RELATIONSHIP: Query.equal("barbearia_id", ...) pode falhar com Relationship fields
        // Sempre há fallback de busca sem filtro + client-side filter (vejo abaixo)
        // REF: https://appwrite.io/docs/products/databases/relationships#limitations
        let existingHorario = null;
        try {
          const existing = await databases.listDocuments(DB_ID, COLLECTIONS.horarios, [
            Query.equal("barbearia_id", barbeariaId),
            Query.equal("dia_semana", dia_semana),
            Query.limit(1),
          ]);
          existingHorario = existing?.documents?.[0] ?? null;
        } catch {
          // Fallback: busca tudo e filtra no cliente (quando Query falha silenciosamente)
          try {
            const all = await databases.listDocuments(DB_ID, COLLECTIONS.horarios, [Query.limit(100)]);
            existingHorario = (all?.documents ?? []).find(
              (d) =>
                (d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId) &&
                d.dia_semana === dia_semana
            ) ?? null;
          } catch { /* query falhou, tenta criar direto */ }
        }

        // Upsert: 409 é esperado e tratado silenciosamente pela função
        // Garante idempotência - múltiplas tentativas do onboarding não criam duplicatas
        try {
          await upsertDocument("horarios", [Query.equal("barbearia_id", barbeariaId), Query.equal("dia_semana", dia_semana)], horariosPayload);
        } catch (err) {
          // Rethrow só se for erro grave (não 409)
          if (err?.code !== 409) throw err;
          // 409 com upsert significa que já existe mas não conseguimos atualizar — ignora
        }
      }

      // 4) Criar documentos em `servicos`
      console.log("[Onboarding] servicos:", servicos, "precos:", precos);
      for (const srv of servicos) {
        // duracaoMin vem do state de serviços, duracao é fallback
        const duracao = srv.duracaoMin ?? srv.duracao ?? 30;
        // precos é um objeto { [srv.id]: valor } preenchido na etapa de preços
        const valorRaw = precos?.[srv.id];
        const valor = valorRaw != null && valorRaw !== "" ? String(valorRaw) : "0";

        if (!srv.nome?.trim()) continue; // pula serviços sem nome

        await criarServico({
          nome: srv.nome.trim(),
          descricao: " ",
          valor,
          duracao: String(duracao),
          status: "ativo",
          barbearia_id: barbeariaId,
        });
      }

      // 5) Atualizar `configuracoes_barbearia` setando `onboarding_completo: true`
      // Usa o configDoc capturado antes, ou busca sem filtro de Relationship
      let cfgDocFinal = configDoc ?? null;
      if (!cfgDocFinal?.$id) {
        try {
          const cfg2 = await databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, []);
          cfgDocFinal = cfg2?.documents?.find(
            (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
          ) ?? null;
        } catch { /* ignora */ }
      }
      if (cfgDocFinal?.$id) {
        await databases.updateDocument(DB_ID, COLLECTIONS.configuracoes, cfgDocFinal.$id, {
          onboarding_completo: true,
        });
      }

      // 6) Redirecionar para dashboard
      // ⚠️ IMPORTANTE - FLUXO CORRETO PER APPWRITE DOCS:
      // - ❌ NÃO chamar getAccount() aqui! Pode perder sessão localStorage se custom domain não configurado
      // - ✅ Confiar na sessão criada durante login (SDK mantém automaticamente)
      // - ✅ BarbeariaGuard verifica onboarding_completo=true quando dashboard carregar
      // - ✅ Se não estiver logado, BarbeariaGuard redireciona de volta para /login
      // REF: https://appwrite.io/docs/products/auth/email-password#login
      if (slug) {
        navigate(`/dashboard/${slug}`, { replace: true });
      } else {
        console.error("Não foi possível redirecionar: slug não encontrado.");
      }

    } catch (err) {
      console.error("Onboarding finalizar() erro detalhado:", err?.message, err?.response || err);
    } finally {
      setSalvando(false);
    }
  }; // Fim exato da função finalizar


  return (
    <main style={{ padding: 24, color: "white", minHeight: "100vh", background: "#0a0a0a", animation: "fadeSlideUp 0.3s ease" }}>
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
                              onFocus: (e) => (e.currentTarget.style.outline = "2px solid #FD366E"),
                              onBlur: (e) => (e.currentTarget.style.outline = "none"),
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
                              onFocus: (e) => (e.currentTarget.style.outline = "2px solid #FD366E"),
                              onBlur: (e) => (e.currentTarget.style.outline = "none"),
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
                              onFocus: (e) => (e.currentTarget.style.outline = "2px solid #FD366E"),
                              onBlur: (e) => (e.currentTarget.style.outline = "none"),
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
                              onFocus: (e) => (e.currentTarget.style.outline = "2px solid #FD366E"),
                              onBlur: (e) => (e.currentTarget.style.outline = "none"),
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
                              onFocus: (e) => (e.currentTarget.style.outline = "2px solid #FD366E"),
                              onBlur: (e) => (e.currentTarget.style.outline = "none"),
                        }}
                      />
                    </Campo>
                  </div>
                ))}
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
            <Botao onClick={finalizar} type="button" disabled={salvando}>
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
      </Card>
    </main>
  );
}
