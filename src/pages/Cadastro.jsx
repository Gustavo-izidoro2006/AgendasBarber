import { useState } from "react";
import { Link } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

export default function Cadastro() {
  const { cadastro } = useSessaoBarbearia();

  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

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

  const inputBase = {
    width: "100%", padding: "13px 16px 13px 42px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)",
    background: "rgba(255,255,255,0.03)", color: "white", outline: "none", fontSize: 15,
    transition: "all var(--duration-fast) var(--ease-out)", boxSizing: "border-box",
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 24px", position: "relative", overflow: "hidden",
      background: `
        radial-gradient(ellipse 70% 50% at 50% -20%, rgba(253,54,110,0.06) 0%, var(--bg-primary) 60%)
      `,
    }}>
      <div style={{
        width: "100%", maxWidth: 440, padding: "36px 32px",
        borderRadius: "var(--radius-xl)", background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xl)",
        animation: "fadeSlideUp 0.4s var(--ease-out) forwards",
        position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "var(--radius-md)", margin: "0 auto 14px",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 20px rgba(253,54,110,0.3)",
          }}>✂️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Criar sua barbearia
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
            Configure em minutos. Sem cartão de crédito.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 16,
            background: "var(--danger-soft)", border: "1px solid var(--danger-border)",
            color: "var(--danger)", fontSize: 14, fontWeight: 500,
            animation: "fadeSlideUp 0.2s ease",
          }}>
            ⚠️ {erro}
          </div>
        )}

        {/* Form */}
        <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nome */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              Nome da barbearia
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, opacity: 0.4, pointerEvents: "none",
              }}>🏪</span>
              <input
                placeholder="Ex: Barbearia do João" value={nomeBarbearia}
                onChange={e => setNomeBarbearia(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
                style={inputBase}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              E-mail
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, opacity: 0.4, pointerEvents: "none",
              }}>📧</span>
              <input
                type="email" placeholder="seu@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
                style={inputBase}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, opacity: 0.4, pointerEvents: "none",
              }}>🔒</span>
              <input
                type="password" placeholder="Mínimo 6 caracteres" value={senha}
                onChange={e => setSenha(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
                style={inputBase}
              />
            </div>
          </div>

          <button
            type="submit" disabled={isDisabled}
            style={{
              width: "100%", padding: "14px", borderRadius: "var(--radius-md)", border: "none",
              background: isDisabled ? "rgba(255,255,255,0.06)" : "var(--accent)",
              color: isDisabled ? "var(--text-muted)" : "white",
              cursor: isDisabled ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 15, marginTop: 4,
              transition: "all var(--duration-fast) var(--ease-out)",
              boxShadow: isDisabled ? "none" : "0 4px 20px rgba(253,54,110,0.25)",
            }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; } }}
          >
            {carregando ? "Criando..." : "Criar conta →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link to="/login" style={{ fontWeight: 600, color: "var(--accent)" }}>Entrar</Link>
        </div>
      </div>
    </main>
  );
}
