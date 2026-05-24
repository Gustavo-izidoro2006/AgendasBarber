import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1080,
          display: "grid",
          gap: 24,
          gridTemplateColumns: "1.15fr 0.85fr",
          alignItems: "center",
        }}
      >
        <section style={{ textAlign: "left" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#FD366E",
                boxShadow: "0 0 0 6px rgba(253,54,110,0.12)",
              }}
            />
            <span style={{ fontSize: 14, opacity: 0.95 }}>Sistema de barbearia com agendamento online</span>
          </div>

          <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: 0 }}>
            Centralize clientes, serviços e{" "}
            <span style={{ color: "#FD366E" }}>agenda</span>.
          </h1>

          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 18, opacity: 0.9 }}>
            Crie sua barbearia em minutos, personalize seu fluxo e permita que seus clientes agendem
            automaticamente—com confirmação de status e histórico.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/cadastro")}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "#FD366E",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Cadastrar barbearia
            </button>

            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Entrar
            </button>
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              opacity: 0.95,
            }}
          >
            {[
              { t: "Agenda com horários livres", d: "evita conflitos e facilita o dia a dia" },
              { t: "Status do agendamento", d: "ativo, cancelado e concluído" },
              { t: "Link público único", d: "seu cliente agenda por um caminho simples" },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  flex: "1 1 220px",
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{item.t}</div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>{item.d}</div>
              </div>
            ))}
          </div>
        </section>

        <aside
          style={{
            padding: 18,
            borderRadius: 18,
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>Como funciona</h2>

          <ol style={{ textAlign: "left", paddingLeft: 18, margin: 0 }}>
            <li style={{ marginBottom: 10, opacity: 0.92 }}>
              <strong>Cadastre sua barbearia</strong>
              <div style={{ fontSize: 14, opacity: 0.85 }}>nome, credenciais e início do onboarding</div>
            </li>
            <li style={{ marginBottom: 10, opacity: 0.92 }}>
              <strong>Configure agenda</strong>
              <div style={{ fontSize: 14, opacity: 0.85 }}>horários disponíveis e serviços</div>
            </li>
            <li style={{ marginBottom: 0, opacity: 0.92 }}>
              <strong>Publique seu link</strong>
              <div style={{ fontSize: 14, opacity: 0.85 }}>clientes agendam e acompanham status</div>
            </li>
          </ol>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              background: "rgba(253,54,110,0.10)",
              border: "1px solid rgba(253,54,110,0.25)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Pronto para começar?</div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 12 }}>
              Leva poucos minutos e seu protótipo fica no ar.
            </div>

            <button
              onClick={() => navigate("/cadastro")}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "#FD366E",
                color: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Criar conta
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
