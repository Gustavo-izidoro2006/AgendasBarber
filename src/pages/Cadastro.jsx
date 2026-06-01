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

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    outline: "none",
    fontSize: 15,
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "radial-gradient(ellipse at 50% 0%, rgba(253,54,110,0.06) 0%, #0a0a0a 60%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 32,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          animation: "fadeSlideUp 0.25s ease forwards",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(253,54,110,0.15)",
              border: "1px solid rgba(253,54,110,0.35)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              marginBottom: 12,
            }}
            aria-hidden="true"
          >
            🧑‍🦱
          </div>
          <h1 style={{ margin: 0, color: "white", fontSize: 26, fontWeight: 700 }}>
            Criar conta
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
            Cadastre sua barbearia e comece a agendar
          </p>
        </div>

        <form onSubmit={enviar}>
          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
              Nome da barbearia
            </div>
            <input
              value={nomeBarbearia}
              onChange={(e) => setNomeBarbearia(e.target.value)}
              type="text"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="Ex: Barbearia do João"
            />
          </label>

          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
              E-mail
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="seu@email.com"
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
              Senha
            </div>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.outline = "2px solid #FD366E")}
              onBlur={(e) => (e.target.style.outline = "none")}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          {erro && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(253,54,110,0.3)",
                background: "rgba(253,54,110,0.1)",
                color: "#FD366E",
                fontSize: 13,
                fontWeight: 600,
              }}
              role="alert"
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 10,
              border: "none",
              background: isDisabled ? "rgba(253,54,110,0.35)" : "#FD366E",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              Já tem conta?{" "}
              <Link
                to="/login"
                style={{ color: "#FD366E", textDecoration: "none", fontWeight: 600 }}
              >
                Entrar
              </Link>
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}
