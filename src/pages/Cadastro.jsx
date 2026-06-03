import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

export default function Cadastro() {
  const { cadastro } = useSessaoBarbearia();
  const navigate = useNavigate();

  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [focusField, setFocusField] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      await cadastro({ email, senha, nomeBarbearia });
    } catch (err) {
      setErro(err?.message || "Falha ao cadastrar.");
    } finally {
      setCarregando(false);
    }
  }

  const isDisabled = carregando || !nomeBarbearia.trim() || !email.trim() || !senha.trim();

  const inputStyle = (field) => ({
    width: "100%",
    padding: "14px 16px 14px 46px",
    borderRadius: "var(--radius-md)",
    border: `1px solid ${focusField === field ? "var(--border-focus)" : "var(--border-default)"}`,
    background: focusField === field ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
    color: "white",
    outline: "none",
    fontSize: 15,
    transition: "all var(--duration-fast) var(--ease-out)",
    boxSizing: "border-box",
    fontFamily: "inherit",
    boxShadow: focusField === field ? "0 0 0 3px rgba(232,40,74,0.1)" : "none",
  });

  const iconStyle = {
    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
    fontSize: 14, opacity: 0.35, pointerEvents: "none", color: "white",
  };

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--text-secondary)", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px",
      position: "relative",
      overflow: "hidden",
      background: "var(--bg-primary)",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-25%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 500,
          background: "radial-gradient(ellipse at center, rgba(232,40,74,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 0%, black 30%, transparent 100%)",
        }} />
      </div>

      {/* Back */}
      <button onClick={() => navigate("/")} style={{
        position: "absolute", top: 24, left: 24,
        display: "flex", alignItems: "center", gap: 7,
        padding: "8px 14px", borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-default)", background: "transparent",
        color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 500,
        transition: "all var(--duration-fast) var(--ease-out)",
      }}
      onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
      >
        ← Voltar
      </button>

      <div style={{
        width: "100%", maxWidth: 420,
        animation: "fadeSlideUp 0.45s var(--ease-out) forwards",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          padding: "40px 36px",
          borderRadius: "var(--radius-xl)",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xl), 0 0 60px rgba(232,40,74,0.05)",
          backdropFilter: "blur(24px)",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Accent bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 3,
            background: "linear-gradient(90deg, var(--accent), var(--gold))",
          }} />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "var(--radius-md)",
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 6px 24px rgba(212,168,67,0.35)",
            }}>✂</div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em",
            }}>
              Criar sua barbearia
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.55 }}>
              Configure em minutos. Sem cartão de crédito.
            </p>
          </div>

          {/* Error */}
          {erro && (
            <div style={{
              padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: 20,
              background: "var(--danger-soft)", border: "1px solid var(--danger-border)",
              color: "var(--danger)", fontSize: 14, fontWeight: 500,
              animation: "fadeSlideDown 0.2s ease",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠</span> {erro}
            </div>
          )}

          <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Nome */}
            <div>
              <label style={labelStyle}>Nome da barbearia</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>⌂</span>
                <input
                  placeholder="Ex: Barbearia do João"
                  value={nomeBarbearia}
                  onChange={e => setNomeBarbearia(e.target.value)}
                  onFocus={() => setFocusField("nome")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("nome")}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>E-mail</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>✉</span>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("email")}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>⚿</span>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onFocus={() => setFocusField("senha")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("senha")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              style={{
                width: "100%", padding: "15px",
                borderRadius: "var(--radius-md)", border: "none",
                background: isDisabled
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, var(--accent) 0%, #c9213f 100%)",
                color: isDisabled ? "var(--text-muted)" : "white",
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 15, marginTop: 6,
                transition: "all var(--duration-fast) var(--ease-out)",
                boxShadow: isDisabled ? "none" : "0 4px 20px rgba(232,40,74,0.3)",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,40,74,0.4)"; } }}
              onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(232,40,74,0.3)"; } }}
            >
              {carregando ? "Criando sua conta..." : "Criar conta →"}
            </button>
          </form>

          <div style={{
            textAlign: "center", marginTop: 24, paddingTop: 20,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: 14, color: "var(--text-muted)",
          }}>
            Já tem conta?{" "}
            <Link to="/login" style={{ fontWeight: 600, color: "var(--accent)" }}>
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
