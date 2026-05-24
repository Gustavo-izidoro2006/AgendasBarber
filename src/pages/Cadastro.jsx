import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

function Card({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
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

export default function Cadastro() {
  const { cadastro } = useSessaoBarbearia();
  const navigate = useNavigate();

  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  async function enviar(e) {
    e.preventDefault();
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

  const disabled = carregando || !nomeBarbearia || !email || !senha;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, color: "white", fontSize: 28 }}>Cadastre sua barbearia</h1>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.82)", fontSize: 14 }}>
              Crie sua conta para começar o onboarding e configurar sua agenda.
            </p>
          </div>

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(253,54,110,0.15)",
              border: "1px solid rgba(253,54,110,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FD366E",
              fontWeight: 900,
            }}
            aria-hidden="true"
          >
            🧑‍🦱
          </div>
        </div>

        <form onSubmit={enviar} style={{ marginTop: 18 }}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>
              Nome da barbearia
            </div>
              <input
              value={nomeBarbearia}
              onChange={(e) => setNomeBarbearia(e.target.value)}
              type="text"
              required
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
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>
              Email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
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
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, marginBottom: 6 }}>
              Senha
            </div>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              required
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
          </label>

          {erro ? (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,128,128,0.35)",
                background: "rgba(255,128,128,0.10)",
                color: "#ff8080",
                fontSize: 14,
              }}
              role="alert"
            >
              {erro}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={disabled}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: disabled ? "rgba(253,54,110,0.35)" : "#FD366E",
              color: "white",
              cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Link
              to="/login"
              style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, textDecoration: "none" }}
            >
              Já tenho conta
            </Link>

            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.78)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Voltar
            </button>
          </div>
        </form>
      </Card>
    </main>
  );
}
