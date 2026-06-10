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
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

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

  const alterarCampo = useCallback((campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  }, []);

  const salvar = useCallback(async () => {
    if (salvando) return;
    setSalvando(true);
    setMensagem(null);
    try {
      if (!barbearia?.id) throw new Error("Barbearia não encontrada.");
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
      await recarregarBarbearia();
      setMensagem({ tipo: "sucesso", texto: "Dados salvos com sucesso!" });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      setMensagem({ tipo: "erro", texto: "Erro ao salvar. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  }, [salvando, barbearia, form, recarregarBarbearia]);

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
          maxWidth: 700,
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