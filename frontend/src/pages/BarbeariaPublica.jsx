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

// dia_semana: 0=Dom,1=Seg,...,6=Sáb (igual ao Date.getDay())
function diaDaSemanaISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function formatarChipData(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const diaSemana = dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").substring(0, 3);
  const diaNum = String(dt.getDate()).padStart(2, "0");
  const mes = dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").substring(0, 3);
  return { diaSemana, diaNum, mes };
}

function gerarSlots(abertura, fechamento, intervaloMin = 30) {
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

function ServicoCard({ servico, ativo, onClick }) {
  const valor = servico.valor != null && Number(servico.valor) > 0 
    ? `R$ ${Number(servico.valor).toFixed(2).replace(".", ",")}`
    : null;
  const duracao = servico.duracao != null ? Number(servico.duracao) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "18px 20px",
        borderRadius: 16,
        cursor: "pointer",
        border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-default)",
        background: ativo ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
        color: "white",
        width: "100%",
        boxShadow: ativo ? "0 0 16px var(--accent-glow)" : "none",
        transition: "all 0.25s var(--ease-out)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        if (!ativo) {
          e.currentTarget.style.background = "var(--bg-card-hover)";
          e.currentTarget.style.borderColor = "var(--border-hover)";
        }
      }}
      onMouseLeave={e => {
        if (!ativo) {
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          e.currentTarget.style.borderColor = "var(--border-default)";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, letterSpacing: "-0.01em" }}>
            {servico.nome}
          </div>
          {servico.descricao ? (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.4 }}>
              {servico.descricao}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {duracao && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ⏱ {duracao} min
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {valor && (
            <span style={{ fontWeight: 800, fontSize: 16, color: ativo ? "white" : "var(--accent)" }}>
              {valor}
            </span>
          )}
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: ativo ? "none" : "2px solid var(--border-default)",
            background: ativo ? "var(--accent)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: "bold"
          }}>
            {ativo ? "✓" : ""}
          </div>
        </div>
      </div>
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  const [focado, setFocado] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 12,
          border: focado ? "1px solid var(--accent)" : "1px solid var(--border-default)",
          background: "rgba(255,255,255,0.03)",
          color: "white",
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box",
          boxShadow: focado ? "0 0 12px var(--accent-glow)" : "none",
          transition: "all 0.25s var(--ease-out)",
        }}
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
  const [horariosDaBarbearia, setHorariosDaBarbearia] = useState([]);
  const [intervaloMin, setIntervaloMin] = useState(30);

  // seleção
  const [servicosIds, setServicosIds] = useState([]);
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
          buscarServicosDaBarbearia(found.id),
          buscarHorariosDaBarbearia(found.id),
          buscarConfiguracoesDaBarbearia(found.id),
        ]);
        if (!mounted) return;

        setServicos(svcs ?? []);
        setHorariosDaBarbearia(hors ?? []);
        if (cfg?.intervalo_agendamento) setIntervaloMin(Number(cfg.intervalo_agendamento));
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

    // pega o doc de horário correspondente ao dia da semana com type check robusto
    const docHorario = horariosDaBarbearia.find((h) => {
      const ds = typeof h.dia_semana === "number" ? h.dia_semana : Number(h.dia_semana);
      const ativo = h.ativo !== undefined && (Number(h.ativo) === 1 || h.ativo === true || h.ativo === "true" || h.ativo === "1");
      return ds === diaSemana && ativo;
    });

    if (!docHorario) return [];

    return gerarSlots(docHorario.abertura, docHorario.fechamento, intervaloMin);
  }, [data, horariosDaBarbearia, intervaloMin]);

  // ── agrupar slots por período ──
  const slotsAgrupados = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];
    slotsDisponiveis.forEach(slot => {
      const h = Number(slot.split(":")[0]);
      if (h < 12) morning.push(slot);
      else if (h < 18) afternoon.push(slot);
      else evening.push(slot);
    });
    return { morning, afternoon, evening };
  }, [slotsDisponiveis]);

  // ── buscar ocupados quando data muda ──
  useEffect(() => {
    if (!barbearia?.id || !data) return;
    buscarHorariosOcupados(barbearia?.id, data).then(setOcupados).catch(() => setOcupados([]));
  }, [barbearia, data]);

  // limpa horário selecionado se data muda
  useEffect(() => { setHorario(""); }, [data]);

  // ── auto-fill nome ao digitar telefone (cliente retornante) ──
  useEffect(() => {
    if (!barbearia?.id || clienteTelefone.trim().length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const existing = await buscarClientePorBarbeariaTelefone({
          barbeariaId: barbearia?.id,
          telefone: clienteTelefone.trim(),
        });
        if (existing?.nome) setClienteNome(existing.nome);
      } catch { /* silencioso */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [barbearia, clienteTelefone]);

  const servicosSelecionados = useMemo(
    () => servicos.filter((s) => servicosIds.includes(s.id)),
    [servicos, servicosIds]
  );

  const valorTotal = useMemo(() => {
    return servicosSelecionados.reduce((sum, s) => sum + (Number(s.valor) || 0), 0);
  }, [servicosSelecionados]);

  const duracaoTotal = useMemo(() => {
    return servicosSelecionados.reduce((sum, s) => sum + (Number(s.duracao) || Number(s.duracaoMin) || 0), 0);
  }, [servicosSelecionados]);

  // ── confirmar agendamento ──
  const confirmar = useCallback(async () => {
    setErroForm(null);
    setEnviando(true);
    try {
      if (!clienteNome.trim()) throw new Error("Informe seu nome completo.");
      if (!clienteTelefone.trim()) throw new Error("Informe seu telefone de contato.");
      if (!data) throw new Error("Selecione um dia para seu atendimento.");
      if (!horario) throw new Error("Escolha um horário disponível.");
      if (servicosSelecionados.length === 0) throw new Error("Selecione pelo menos um serviço.");

      const barbeariaId = barbearia?.id;

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

      // Cria agendamento para cada serviço selecionado
      const agendamentos = [];
      for (const servico of servicosSelecionados) {
        const criado = await criarAgendamento({
          barbearia_id: barbeariaId,
          cliente_id: clienteDoc?.id ?? null,
          servico_id: servico.id,
          data_agendamento: data,
          horario,
          observacoes: null,
        });
        agendamentos.push(criado);
      }

      setConfirmado({ servicos: agendamentos, primeiro: agendamentos[0] });
    } catch (e) {
      setErroForm(e?.message || "Falha ao confirmar agendamento.");
    } finally {
      setEnviando(false);
    }
  }, [barbearia, clienteNome, clienteTelefone, data, horario, servicosSelecionados]);

  // ── render estados ──
  if (carregando) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080809", color: "white" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(232, 40, 74, 0.08)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>Carregando barbearia...</div>
      </div>
    </main>
  );

  if (erro) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080809", color: "white" }}>
      <div style={{ textAlign: "center", maxWidth: 440, padding: 24, borderRadius: 20, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-default)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Desculpe, ocorreu um erro</h2>
        <div style={{ color: "#ff8080", fontSize: 14, lineHeight: 1.5 }}>{erro}</div>
      </div>
    </main>
  );

  const nomeBarbearia = barbearia?.nome ?? "Barbearia";
  const valorFormatado = valorTotal > 0
    ? `R$ ${valorTotal.toFixed(2).replace(".", ",")}`
    : null;

  return (
    <main className="bp-main" style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "white", padding: "40px 16px" }}>
      
      {/* Container Principal Constrito */}
      <div style={{ maxWidth: 1100, margin: "0 auto", minWidth: 0 }}>

        {/* Header Cover Style */}
        <header style={{ 
          marginBottom: 36, 
          display: "flex", 
          alignItems: "center", 
          gap: 20, 
          padding: 24, 
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid var(--border-default)",
        }}>
          {barbearia?.imagem ? (
            <img src={barbearia.imagem} alt={nomeBarbearia} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: "1px solid var(--border-hover)", boxShadow: "var(--shadow-sm)" }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 16, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✂️</div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{nomeBarbearia}</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Escolha serviço, data e horário para agendar online de forma rápida e prática.
            </p>
          </div>
        </header>

        {/* Grid com prevenção de estouro por minWidth: 0 */}
        <div className="bp-grid" style={{ display: "grid", gap: 24 }}>

          {/* Coluna esquerda com minWidth 0 para conter flex items */}
          <div style={{ display: "grid", gap: 32, minWidth: 0 }}>

            {/* Serviços */}
            <section style={{ minWidth: 0 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                1. Escolha os Serviços
              </h2>
              {servicos.length === 0 ? (
                <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-default)", color: "var(--text-muted)", fontSize: 14 }}>
                  Nenhum serviço disponível no momento.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {servicos.map((s) => (
                    <ServicoCard
                      key={s.id}
                      servico={s}
                      ativo={servicosIds.includes(s.id)}
                      onClick={() => setServicosIds(prev => 
                        prev.includes(s.id) 
                          ? prev.filter(id => id !== s.id)
                          : [...prev, s.id]
                      )}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Datas */}
            <section style={{ minWidth: 0 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                2. Escolha o Dia
              </h2>
              
              {/* Flex Container de Chips com rolagem horizontal controlada */}
              <div style={{ 
                display: "flex", 
                gap: 10, 
                overflowX: "auto", 
                paddingBottom: 10,
                width: "100%",
                maxWidth: "100%",
                WebkitOverflowScrolling: "touch",
              }}>
                {dias.map((iso) => {
                  const diaSemanaIdx = diaDaSemanaISO(iso);
                  const temHorario = horariosDaBarbearia.some(
                    (h) => {
                      const ds = typeof h.dia_semana === "number" ? h.dia_semana : Number(h.dia_semana);
                      const ativo = h.ativo !== undefined && (Number(h.ativo) === 1 || h.ativo === true || h.ativo === "true" || h.ativo === "1");
                      return ds === diaSemanaIdx && ativo;
                    }
                  );
                  const { diaSemana, diaNum, mes } = formatarChipData(iso);
                  const ativo = iso === data;

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!temHorario}
                      onClick={() => setData(iso)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "14px 18px",
                        borderRadius: 14,
                        minWidth: 72,
                        cursor: temHorario ? "pointer" : "not-allowed",
                        border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                        background: ativo ? "var(--accent-soft)" : temHorario ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                        boxShadow: ativo ? "0 0 12px var(--accent-glow)" : "none",
                        color: temHorario ? "white" : "var(--text-muted)",
                        opacity: temHorario ? 1 : 0.3,
                        transition: "all 0.2s var(--ease-out)",
                      }}
                      onMouseEnter={e => {
                        if (temHorario && !ativo) {
                          e.currentTarget.style.background = "var(--bg-card-hover)";
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (temHorario && !ativo) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                          e.currentTarget.style.borderColor = "var(--border-default)";
                        }
                      }}
                    >
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: ativo ? "var(--accent)" : "var(--text-muted)", fontWeight: 700 }}>
                        {diaSemana}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 2px", color: ativo ? "white" : "var(--text-primary)" }}>
                        {diaNum}
                      </span>
                      <span style={{ fontSize: 9, textTransform: "uppercase", color: ativo ? "var(--accent)" : "var(--text-muted)" }}>
                        {mes}
                      </span>
                    </button>
                  );
                })}
              </div>
              {slotsDisponiveis.length === 0 && data && (
                <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--danger-soft)", color: "var(--danger)", fontSize: 14 }}>
                  🛇 A barbearia está fechada neste dia. Selecione outro dia acima.
                </div>
              )}
            </section>

            {/* Horários */}
            {slotsDisponiveis.length > 0 && (
              <section style={{ minWidth: 0 }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  3. Escolha o Horário
                </h2>
                
                <div style={{ display: "grid", gap: 20 }}>
                  
                  {/* Manhã */}
                  {slotsAgrupados.morning.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🌅</span> Manhã
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {slotsAgrupados.morning.map((slot) => {
                          const ocupado = ocupados.includes(slot);
                          const ativo = slot === horario;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={ocupado}
                              onClick={() => setHorario(slot)}
                              style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                cursor: ocupado ? "not-allowed" : "pointer",
                                border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                                background: ativo ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                                color: ocupado ? "var(--text-muted)" : "white",
                                opacity: ocupado ? 0.35 : 1,
                                fontSize: 14,
                                fontWeight: ativo ? 700 : 500,
                                textDecoration: ocupado ? "line-through" : "none",
                                transition: "all 0.15s",
                              }}
                            >
                              {slot.slice(0, 5)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tarde */}
                  {slotsAgrupados.afternoon.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>☀️</span> Tarde
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {slotsAgrupados.afternoon.map((slot) => {
                          const ocupado = ocupados.includes(slot);
                          const ativo = slot === horario;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={ocupado}
                              onClick={() => setHorario(slot)}
                              style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                cursor: ocupado ? "not-allowed" : "pointer",
                                border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                                background: ativo ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                                color: ocupado ? "var(--text-muted)" : "white",
                                opacity: ocupado ? 0.35 : 1,
                                fontSize: 14,
                                fontWeight: ativo ? 700 : 500,
                                textDecoration: ocupado ? "line-through" : "none",
                                transition: "all 0.15s",
                              }}
                            >
                              {slot.slice(0, 5)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Noite */}
                  {slotsAgrupados.evening.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🌙</span> Noite
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {slotsAgrupados.evening.map((slot) => {
                          const ocupado = ocupados.includes(slot);
                          const ativo = slot === horario;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={ocupado}
                              onClick={() => setHorario(slot)}
                              style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                cursor: ocupado ? "not-allowed" : "pointer",
                                border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                                background: ativo ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                                color: ocupado ? "var(--text-muted)" : "white",
                                opacity: ocupado ? 0.35 : 1,
                                fontSize: 14,
                                fontWeight: ativo ? 700 : 500,
                                textDecoration: ocupado ? "line-through" : "none",
                                transition: "all 0.15s",
                              }}
                            >
                              {slot.slice(0, 5)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </section>
            )}

          </div>

          {/* Coluna direita — dados do cliente + resumo */}
          <aside className="bp-aside" style={{ 
            background: "rgba(13,13,16,0.98)", 
            border: "1px solid var(--border-default)", 
            borderRadius: 20, 
            padding: 24,
            display: "grid", 
            gap: 20,
            boxShadow: "var(--shadow-xl)",
            alignSelf: "start",
          }}>

            <div style={{ fontWeight: 800, fontSize: 18, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12, letterSpacing: "-0.015em" }}>
              Seus Dados
            </div>

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
              placeholder="(34) 99999-9999"
            />

            {/* Resumo Estilizado */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.015)", 
              border: "1px solid var(--border-subtle)", 
              borderRadius: 14, 
              padding: 16 
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Resumo do Agendamento
              </div>
              
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Serviços selecionados:</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>
                    {servicosSelecionados.length > 0 ? servicosSelecionados.map(s => s.nome).join(", ") : "Nenhum serviço selecionado"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Data e Horário:</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>
                    {data ? isoParaPT(data) : "—"} {horario ? ` às ${horario.slice(0,5)}` : ""}
                  </div>
                </div>

                {duracaoTotal > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Duração estimada:</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>
                      ⏱ {duracaoTotal} min
                    </div>
                  </div>
                )}

                {valorFormatado && (
                  <div style={{ 
                    marginTop: 6, 
                    paddingTop: 8, 
                    borderTop: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>Valor total:</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>{valorFormatado}</span>
                  </div>
                )}
              </div>
            </div>

            {erroForm && (
              <div style={{ 
                padding: "12px 14px", 
                borderRadius: 10, 
                background: "rgba(239,68,68,0.08)", 
                border: "1px solid var(--danger-border)", 
                color: "var(--danger)", 
                fontSize: 13,
                lineHeight: 1.4
              }}>
                ⚠️ {erroForm}
              </div>
            )}

            {confirmado ? (
              <div style={{ 
                padding: "16px", 
                borderRadius: 14, 
                background: "rgba(34,197,94,0.08)", 
                border: "1px solid var(--success-border)", 
                textAlign: "center"
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--success)", marginBottom: 6 }}>Agendamento Confirmado!</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Seus serviços foram reservados com sucesso. Esperamos por você!
                </p>
                <button
                  type="button"
                  onClick={() => { setConfirmado(null); setHorario(""); setServicosIds([]); }}
                  style={{ 
                    marginTop: 14, 
                    background: "rgba(255,255,255,0.04)", 
                    border: "1px solid var(--border-default)", 
                    borderRadius: 10, 
                    color: "white", 
                    padding: "8px 14px", 
                    cursor: "pointer", 
                    fontSize: 13,
                    fontWeight: 600,
                    width: "100%",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                >
                  Novo Agendamento
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={confirmar}
                disabled={enviando || servicosSelecionados.length === 0 || !horario || !data}
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: enviando || servicosSelecionados.length === 0 || !horario || !data
                    ? "rgba(232,40,74,0.3)"
                    : "linear-gradient(135deg, var(--accent) 0%, #c9213f 100%)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: enviando || servicosSelecionados.length === 0 || !horario || !data ? "not-allowed" : "pointer",
                  boxShadow: enviando || servicosSelecionados.length === 0 || !horario || !data ? "none" : "0 4px 16px rgba(232,40,74,0.25)",
                  transition: "all 0.2s var(--ease-out)",
                }}
                onMouseEnter={e => { if (!enviando && servicosSelecionados.length > 0 && horario && data) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { if (!enviando && servicosSelecionados.length > 0 && horario && data) e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {enviando ? "Confirmando..." : "Confirmar Agendamento"}
              </button>
            )}

          </aside>
        </div>
      </div>
    </main>
  );
}