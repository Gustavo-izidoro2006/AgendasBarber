import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px",
      color: "white",
      position: "relative",
      overflow: "hidden",
      background: "var(--bg-primary)",
    }}>
      {/* Background décor */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(253,54,110,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(242,183,5,0.04) 0%, transparent 50%)
        `,
      }} />

      <div style={{
        width: "100%", maxWidth: 1120, display: "grid", gap: 48,
        gridTemplateColumns: "1.1fr 0.9fr", alignItems: "center", position: "relative", zIndex: 1,
      }}>
        {/* ── Esquerda: Hero ── */}
        <section style={{ textAlign: "left", animation: "fadeSlideUp 0.5s var(--ease-out) forwards" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px",
            background: "rgba(253,54,110,0.08)", border: "1px solid rgba(253,54,110,0.15)",
            borderRadius: "var(--radius-full)", marginBottom: 24,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%", background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
            }}>✂️</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Gestão completa para barbearias
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.035em",
            fontWeight: 900, marginBottom: 0,
          }}>
            Centralize clientes, serviços e{" "}
            <span className="gradient-text">agenda</span>.
          </h1>

          <p style={{
            marginTop: 16, marginBottom: 0, fontSize: 18, lineHeight: 1.65,
            color: "var(--text-secondary)", maxWidth: 520,
          }}>
            Crie sua barbearia em minutos, personalize horários e serviços, e permita
            que seus clientes agendem online — com painel de controle elegante.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/cadastro")}
              style={{
                padding: "14px 28px", borderRadius: "var(--radius-md)",
                border: "none", background: "var(--accent)", color: "white",
                cursor: "pointer", fontWeight: 700, fontSize: 15,
                transition: "all var(--duration-fast) var(--ease-out)",
                boxShadow: "0 4px 20px rgba(253,54,110,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Começar grátis →
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "14px 28px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)", background: "rgba(255,255,255,0.03)",
                color: "white", cursor: "pointer", fontWeight: 600, fontSize: 15,
                transition: "all var(--duration-fast) var(--ease-out)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              Já tenho conta
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", gap: 24, marginTop: 36, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { icon: "⚡", text: "Setup em 2 minutos" },
              { icon: "🔒", text: "Dados seguros" },
              { icon: "📱", text: "100% responsivo" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
                <span>{item.icon}</span> {item.text}
              </div>
            ))}
          </div>
        </section>

        {/* ── Direita: Card Como Funciona ── */}
        <aside style={{ animation: "fadeSlideUp 0.6s 0.1s var(--ease-out) both" }}>
          <div className="glass" style={{
            borderRadius: "var(--radius-xl)", padding: 28,
            boxShadow: "var(--shadow-xl)",
          }}>
            {/* Mini dashboard preview */}
            <div style={{
              background: "var(--bg-secondary)", borderRadius: "var(--radius-md)",
              padding: 20, marginBottom: 20, border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>📊 Visão Geral</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Hoje</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Agendamentos", value: "12", color: "var(--accent)" },
                  { label: "Concluídos", value: "8", color: "var(--success)" },
                  { label: "Cancelados", value: "1", color: "var(--danger)" },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: "12px 10px", borderRadius: "var(--radius-sm)",
                    background: "rgba(255,255,255,0.02)", textAlign: "center",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["09:00", "10:30", "14:00", "16:30"].map((h, i) => (
                  <div key={i} style={{
                    padding: "5px 10px", borderRadius: "var(--radius-sm)",
                    background: i === 2 ? "var(--accent-soft)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${i === 2 ? "var(--accent-border)" : "var(--border-subtle)"}`,
                    fontSize: 12, fontWeight: 600, color: i === 2 ? "var(--accent)" : "var(--text-secondary)",
                  }}>
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>Como funciona</h3>
              {[
                { step: "1", title: "Cadastre sua barbearia", desc: "Nome, email e senha — rápido e simples" },
                { step: "2", title: "Configure agenda e serviços", desc: "Horários, duração e preços" },
                { step: "3", title: "Compartilhe seu link", desc: "Clientes agendam online 24h" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 2 ? 16 : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "var(--accent)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border-default)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: i === 0 ? "white" : "var(--text-muted)",
                  }}>{item.step}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/cadastro")}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: "var(--radius-md)",
                border: "none", background: "var(--accent)", color: "white",
                cursor: "pointer", fontWeight: 700, fontSize: 15,
                transition: "all var(--duration-fast) var(--ease-out)",
                boxShadow: "0 4px 16px rgba(253,54,110,0.25)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              Criar minha barbearia →
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
