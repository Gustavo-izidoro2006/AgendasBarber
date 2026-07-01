import { useState, useEffect, useCallback } from "react";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { api } from "../lib/api";

const fmt = (v) => (v == null ? "" : String(v));

export default function Configuracoes() {
  const { barbearia, recarregarBarbearia } = useBarbearia();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    descricao: "",
    imagem: "",
    instagram: "",
    whatsapp: "",
  });
  const [horarios, setHorarios] = useState({
    seg: false,
    ter: false,
    qua: false,
    qui: false,
    sex: false,
    sab: false,
    dom: false,
    inicio: "08:00",
    fim: "18:00",
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  // Carregar dados cadastrais básicos
  useEffect(() => {
    if (barbearia) {
      setForm({
        nome: fmt(barbearia.nome),
        email: fmt(barbearia.email),
        telefone: fmt(barbearia.telefone),
        endereco: fmt(barbearia.endereco),
        descricao: fmt(barbearia.descricao),
        imagem: fmt(barbearia.imagem),
        instagram: fmt(barbearia.instagram),
        whatsapp: fmt(barbearia.whatsapp),
      });
    }
  }, [barbearia]);

  // Carregar horários de atendimento salvos
  useEffect(() => {
    if (barbearia?.id) {
      async function carregarHorarios() {
        try {
          const list = await api.get(`/horarios/index.php?barbearia_id=${barbearia.id}`);
          if (list && list.length > 0) {
            const mapDiasInverso = { 0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab" };
            const novoHorario = {
              seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false,
              inicio: "08:00",
              fim: "18:00",
            };
            list.forEach(h => {
              const diaStr = mapDiasInverso[h.dia_semana];
              if (diaStr) {
                novoHorario[diaStr] = Number(h.ativo) === 1 || h.ativo === true || h.ativo === "true" || h.ativo === "1";
              }
              if (h.abertura) novoHorario.inicio = h.abertura.slice(0, 5);
              if (h.fechamento) novoHorario.fim = h.fechamento.slice(0, 5);
            });
            setHorarios(novoHorario);
          }
        } catch (err) {
          console.error("Erro ao carregar horários:", err);
        }
      }
      carregarHorarios();
    }
  }, [barbearia]);

  const alterarCampo = useCallback((campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  }, []);

  const salvar = useCallback(async () => {
    if (salvando) return;
    setSalvando(true);
    setMensagem(null);
    try {
      if (!barbearia?.id) throw new Error("Barbearia não encontrada.");
      
      // 1. Salvar dados cadastrais
      await api.put('/barbearias/atualizar.php', {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        endereco: form.endereco,
        descricao: form.descricao,
        imagem: form.imagem,
        instagram: form.instagram,
        whatsapp: form.whatsapp,
      });

      // 2. Salvar horários de atendimento
      const mapDias = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
      const abertura   = horarios.inicio || "08:00";
      const fechamento = horarios.fim    || "18:00";
      const diasSel = Object.entries(horarios)
        .filter(([k, v]) => typeof v === "boolean" && v)
        .map(([k]) => k);

      const horariosPayload = diasSel
        .filter((ch) => mapDias[ch] !== undefined)
        .map((ch) => ({
          dia_semana: mapDias[ch],
          abertura,
          fechamento,
          ativo: true,
        }));

      await api.post('/horarios/salvar.php', {
        barbearia_id: barbearia.id,
        horarios: horariosPayload,
      });

      await recarregarBarbearia();
      setMensagem({ tipo: "sucesso", texto: "Dados e horários salvos com sucesso!" });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      setMensagem({ tipo: "erro", texto: "Erro ao salvar. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  }, [salvando, barbearia, form, horarios, recarregarBarbearia]);

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 15,
    outline: "none",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  };

  return (
    <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
      <style>{`
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>
      <h2 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700 }}>
        ⚙️ Configurações
      </h2>

      {mensagem && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            background: mensagem.tipo === "sucesso" ? "rgba(16,185,129,0.12)" : "rgba(253,54,110,0.12)",
            border: `1px solid ${mensagem.tipo === "sucesso" ? "rgba(16,185,129,0.3)" : "rgba(253,54,110,0.3)"}`,
            color: mensagem.tipo === "sucesso" ? "#10b981" : "#FD366E",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {mensagem.texto}
        </div>
      )}

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 750,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
            Nome da barbearia
          </label>
          <input
            style={inputStyle}
            value={form.nome}
            onChange={alterarCampo("nome")}
            onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
            onBlur={(e) => (e.target.style.outline = "none")}
            placeholder="Ex: Barbearia do João"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
              E-mail
            </label>
            <input
              style={inputStyle}
              value={form.email}
              onChange={alterarCampo("email")}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              type="email"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
              Telefone
            </label>
            <input
              style={inputStyle}
              value={form.telefone}
              onChange={alterarCampo("telefone")}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
            Endereço
          </label>
          <input
            style={inputStyle}
            value={form.endereco}
            onChange={alterarCampo("endereco")}
            onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
            onBlur={(e) => (e.target.style.outline = "none")}
            placeholder="Rua, número, bairro"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
            Descrição
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            value={form.descricao}
            onChange={alterarCampo("descricao")}
            onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
            onBlur={(e) => (e.target.style.outline = "none")}
            placeholder="Descreva sua barbearia..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
              Instagram (@)
            </label>
            <input
              style={inputStyle}
              value={form.instagram}
              onChange={alterarCampo("instagram")}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="minhabarbearia"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
              WhatsApp
            </label>
            <input
              style={inputStyle}
              value={form.whatsapp}
              onChange={alterarCampo("whatsapp")}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {/* Seção de Horários de Funcionamento */}
        <div style={{ marginTop: 28, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            🕒 Horários de Funcionamento
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
            Selecione os dias em que a barbearia atende e defina o expediente.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 10, fontWeight: 600 }}>
                Dias úteis:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["seg", "Segunda-feira"],
                  ["ter", "Terça-feira"],
                  ["qua", "Quarta-feira"],
                  ["qui", "Quinta-feira"],
                  ["sex", "Sexta-feira"],
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
                      borderRadius: 8,
                      background: horarios[ch] ? "rgba(253,54,110,0.09)" : "rgba(255,255,255,0.02)",
                      border: horarios[ch] ? "1px solid rgba(253,54,110,0.25)" : "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: horarios[ch] ? "#FD366E" : "rgba(255,255,255,0.7)" }}>
                      {label}
                    </span>
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
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
                  Horário de abertura
                </label>
                <input
                  type="time"
                  style={inputStyle}
                  value={horarios.inicio}
                  onChange={(e) => setHorarios((h) => ({ ...h, inicio: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: 600 }}>
                  Horário de encerramento
                </label>
                <input
                  type="time"
                  style={inputStyle}
                  value={horarios.fim}
                  onChange={(e) => setHorarios((h) => ({ ...h, fim: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            padding: "12px 32px",
            borderRadius: 10,
            border: "none",
            background: salvando ? "rgba(253,54,110,0.5)" : "#FD366E",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: salvando ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            marginTop: 8,
          }}
        >
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
            "Salvar alterações"
          )}
        </button>
      </div>
    </div>
  );
}