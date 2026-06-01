import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  buscarBarbeariaPorSlug,
  buscarServicosDaBarbearia,
  buscarHorariosDaBarbearia,
  buscarHorariosOcupados,
  buscarConfiguracoesDaBarbearia,
  criarAgendamento,
} from "../services/barbeariaPublicaService";
import {
  buscarClientePorBarbeariaTelefone,
  criarCliente,
} from "../services/clientesService";

// ─── helpers ────────────────────────────────────────────────────────────────

function isoParaPT(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}

function gerarProximosDias(qtd = 30) {
  const hoje = new Date();
  return Array.from({ length: qtd }, (_, i) => {
    const dt = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  });
}

// dia_semana: 0=Dom,1=Seg,...,6=Sáb  (igual ao Date.getDay())
function diaDaSemanaISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function gerarSlots(abertura, fechamento, intervaloMin = 30) {
  // abertura/fechamento: "HH:MM" ou "HH:MM:SS"
  const toMin = (str) => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };
  const inicio = toMin(abertura);
  const fim = toMin(fechamento);
  const slots = [];
  for (let t = inicio; t < fim; t += intervaloMin) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    slots.push(`${h}:${m}:00`);
  }
  return slots;
}

// ─── componentes UI ──────────────────────────────────────────────────────────

function Chip({ ativo, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        border: ativo ? "2px solid #FD366E" : "1px solid rgba(255,255,255,0.12)",
        background: ativo ? "rgba(253,54,110,0.15)" : disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        color: disabled ? "rgba(255,255,255,0.3)" : "white",
        fontWeight: ativo ? 700 : 400,
        fontSize: 13,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function ServicoCard({ servico, ativo, onClick }) {
  const valor = servico.valor != null ? `R$ ${Number(servico.valor).toFixed(2).replace(".", ",")}` : "R$ —";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: 14,
        cursor: "pointer",
        border: ativo ? "2px solid #FD366E" : "1px solid rgba(255,255,255,0.10)",
        background: ativo ? "rgba(253,54,110,0.10)" : "rgba(255,255,255,0.03)",
        color: "white",
        width: "100%",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{servico.nome}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#FD366E" }}>{valor}</span>
      </div>
      {servico.descricao ? (
        <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.60)" }}>{servico.descricao}</div>
      ) : null}
      <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
        ⏱ {servico.duracao ?? "—"} min
      </div>
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "white",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.outline = "2px solid #FD366E")}
        onBlur={(e) => (e.currentTarget.style.outline = "none")}
      />
    </label>
  );
}

// ─── página principal ────────────────────────────────────────────────────────

export default function BarbeariaPublica() {
  const { slug } = useParams();
  const dias = useMemo(() => gerarProximosDias(30), []);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [horariosDaBarbearia, setHorariosDaBarbearia] = useState([]); // docs horarios_atendimento
  const [intervaloMin, setIntervaloMin] = useState(30);

  // seleção
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState(dias[0] ?? "");
  const [horario, setHorario] = useState("");

  // horários ocupados na data selecionada
  const [ocupados, setOcupados] = useState([]);

  // dados do cliente
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(null);
  const [erroForm, setErroForm] = useState(null);

  // ── carregar barbearia + serviços + horários ──
  useEffect(() => {
    let mounted = true;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        if (!slug) throw new Error("Slug não informado.");
        const found = await buscarBarbeariaPorSlug(slug);
        if (!mounted) return;
        if (!found) { setErro("Barbearia não encontrada."); return; }
        setBarbearia(found);

        const [svcs, hors, cfg] = await Promise.all([
          buscarServicosDaBarbearia(found.$id),
          buscarHorariosDaBarbearia(found.$id),
          buscarConfiguracoesDaBarbearia(found.$id),
        ]);
        if (!mounted) return;

        setServicos(svcs ?? []);
        setHorariosDaBarbearia(hors ?? []);
        if (cfg?.intervalo_agendamento) setIntervaloMin(Number(cfg.intervalo_agendamento));

        if (svcs?.length) setServicoId(svcs[0].$id);
      } catch (e) {
        if (mounted) setErro(e?.message || "Falha ao carregar.");
      } finally {
        if (mounted) setCarregando(false);
      }
    }
    carregar();
    return () => { mounted = false; };
  }, [slug]);

  // ── calcular slots disponíveis para a data selecionada ──
  const slotsDisponiveis = useMemo(() => {
    if (!data || !horariosDaBarbearia.length) return [];
    const diaSemana = diaDaSemanaISO(data);

    // pega o doc de horário correspondente ao dia da semana
    const docHorario = horariosDaBarbearia.find((h) => {
      const ds = typeof h.dia_semana === "number" ? h.dia_semana : Number(h.dia_semana);
      return ds === diaSemana && (h.ativo === true || h.ativo === "true");
    });

    if (!docHorario) return []; // barbearia fechada nesse dia

    return gerarSlots(docHorario.abertura, docHorario.fechamento, intervaloMin);
  }, [data, horariosDaBarbearia, intervaloMin]);

  // ── buscar ocupados quando data muda ──
  useEffect(() => {
    if (!barbearia?.$id || !data) return;
    buscarHorariosOcupados(barbearia.$id, data).then(setOcupados).catch(() => setOcupados([]));
  }, [barbearia, data]);

  // limpa horário selecionado se data muda
  useEffect(() => { setHorario(""); }, [data]);

  // ── auto-fill nome ao digitar telefone (cliente retornante) ──
  useEffect(() => {
    if (!barbearia?.$id || clienteTelefone.trim().length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const existing = await buscarClientePorBarbeariaTelefone({
          barbeariaId: barbearia.$id,
          telefone: clienteTelefone.trim(),
        });
        if (existing?.nome) setClienteNome(existing.nome);
      } catch { /* silencioso */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [barbearia, clienteTelefone]);

  // Auto-fill nome do cliente por telefone (retornante)
  useEffect(() => {
    if (!barbearia?.$id || clienteTelefone.trim().length < 10) return;
    const timer = setTimeout(async () => {
      try {
        const found = await buscarClientePorBarbeariaTelefone({
          barbeariaId: barbearia.$id,
          telefone: clienteTelefone.trim(),
        });
        if (found?.nome) setClienteNome(found.nome);
      } catch { /* silencioso */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [clienteTelefone, barbearia]);

  const servicoSelecionado = useMemo(
    () => servicos.find((s) => s.$id === servicoId) ?? null,
    [servicos, servicoId]
  );

  // ── confirmar agendamento ──
  const confirmar = useCallback(async () => {
    setErroForm(null);
    setEnviando(true);
    try {
      if (!clienteNome.trim()) throw new Error("Informe seu nome.");
      if (!clienteTelefone.trim()) throw new Error("Informe seu telefone.");
      if (!data) throw new Error("Selecione uma data.");
      if (!horario) throw new Error("Selecione um horário.");
      if (!servicoSelecionado) throw new Error("Selecione um serviço.");

      const barbeariaId = barbearia.$id;

      // busca ou cria cliente (evita duplicatas)
      let clienteDoc = null;
      try {
        clienteDoc = await buscarClientePorBarbeariaTelefone({ barbeariaId, telefone: clienteTelefone.trim() });
      } catch { /* não existe ainda */ }

      if (!clienteDoc) {
        clienteDoc = await criarCliente({
          barbearia_id: barbeariaId,
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim(),
          email: null,
          observacoes: null,
        });
      }

      const criado = await criarAgendamento({
        barbearia_id: barbeariaId,
        cliente_id: clienteDoc?.$id ?? null,
        servico_id: servicoSelecionado.$id,
        data_agendamento: data,
        horario,
        observacoes: null,
      });

      setConfirmado(criado);
    } catch (e) {
      setErroForm(e?.message || "Falha ao confirmar agendamento.");
    } finally {
      setEnviando(false);
    }
  }, [barbearia, clienteNome, clienteTelefone, data, horario, servicoSelecionado]);

  // ── render estados ──
  if (carregando) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✂️</div>
        <div>Carregando...</div>
      </div>
    </main>
  );

  if (erro) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "#ff8080" }}>{erro}</div>
      </div>
    </main>
  );

  const nomeBarbearia = barbearia?.nome ?? "Barbearia";
  const valor = servicoSelecionado?.valor != null
    ? `R$ ${Number(servicoSelecionado.valor).toFixed(2).replace(".", ",")}`
    : null;

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "24px 16px", animation: "fadeSlideUp 0.3s ease" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
          {barbearia?.imagem ? (
            <img src={barbearia.imagem} alt={nomeBarbearia} style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(253,54,110,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✂️</div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{nomeBarbearia}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.60)" }}>
              Escolha serviço, data e horário para agendar online.
            </p>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* Coluna esquerda */}
          <div style={{ display: "grid", gap: 24 }}>

            {/* Serviços */}
            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.70)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Serviços</h2>
              {servicos.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.50)", fontSize: 14 }}>Nenhum serviço disponível.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {servicos.map((s) => (
                    <ServicoCard
                      key={s.$id}
                      servico={s}
                      ativo={s.$id === servicoId}
                      onClick={() => setServicoId(s.$id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Datas */}
            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.70)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data</h2>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {dias.map((iso) => {
                  const diaSemana = diaDaSemanaISO(iso);
                  const temHorario = horariosDaBarbearia.some(
                    (h) => (typeof h.dia_semana === "number" ? h.dia_semana : Number(h.dia_semana)) === diaSemana &&
                    (h.ativo === true || h.ativo === "true")
                  );
                  return (
                    <Chip
                      key={iso}
                      ativo={iso === data}
                      disabled={!temHorario}
                      onClick={() => setData(iso)}
                    >
                      {isoParaPT(iso)}
                    </Chip>
                  );
                })}
              </div>
              {slotsDisponiveis.length === 0 && data && (
                <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  Barbearia fechada neste dia.
                </div>
              )}
            </section>

            {/* Horários */}
            {slotsDisponiveis.length > 0 && (
              <section>
                <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.70)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Horário</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slotsDisponiveis.map((slot) => {
                    const ocupado = ocupados.includes(slot);
                    return (
                      <Chip
                        key={slot}
                        ativo={slot === horario}
                        disabled={ocupado}
                        onClick={() => setHorario(slot)}
                      >
                        {slot.slice(0, 5)}
                        {ocupado ? " ✗" : ""}
                      </Chip>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

          {/* Coluna direita — dados do cliente + resumo */}
          <aside style={{ position: "sticky", top: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>

            <div style={{ fontWeight: 700, fontSize: 16 }}>Seus dados</div>

            <Input
              label="Nome completo"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Ex: João Silva"
            />
            <Input
              label="Telefone"
              type="tel"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder="(34) 90000-0000"
            />

            {/* Resumo */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>Resumo</div>
              <div style={{ fontWeight: 700 }}>{servicoSelecionado?.nome ?? "—"}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.60)" }}>
                {data ? isoParaPT(data) : "—"} {horario ? `• ${horario.slice(0,5)}` : ""}
              </div>
              {valor && (
                <div style={{ marginTop: 6, fontWeight: 700, color: "#FD366E" }}>{valor}</div>
              )}
            </div>

            {erroForm && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,80,80,0.10)", border: "1px solid rgba(255,80,80,0.25)", color: "#ff8080", fontSize: 13 }}>
                {erroForm}
              </div>
            )}

            {confirmado ? (
              <div style={{ padding: "14px", borderRadius: 12, background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.30)", fontSize: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✅ Agendamento confirmado!</div>
                <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 13 }}>
                  {servicoSelecionado?.nome} — {data ? isoParaPT(data) : ""} às {horario?.slice(0,5)}
                </div>
                <button
                  type="button"
                  onClick={() => { setConfirmado(null); setHorario(""); }}
                  style={{ marginTop: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 8, color: "rgba(255,255,255,0.70)", padding: "6px 12px", cursor: "pointer", fontSize: 12 }}
                >
                  Fazer outro agendamento
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={confirmar}
                disabled={enviando || !servicoSelecionado || !horario || !data}
                style={{
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: enviando || !servicoSelecionado || !horario || !data
                    ? "rgba(253,54,110,0.35)"
                    : "#FD366E",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: enviando || !servicoSelecionado || !horario || !data ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {enviando ? "Confirmando..." : "Confirmar agendamento"}
              </button>
            )}

          </aside>
        </div>
      </div>
    </main>
  );
}
