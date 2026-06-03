import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "white",
      position: "relative",
      overflow: "hidden",
      background: "var(--bg-primary)",
    }}>

      {/* ── Atmospheric background ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Main glow orb */}
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600,
          background: "radial-gradient(ellipse at center, rgba(232,40,74,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        {/* Gold accent orb */}
        <div style={{
          position: "absolute", bottom: "10%", right: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse at center, rgba(212,168,67,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
        }} />
      </div>

      {/* ── Topbar ── */}
      <header style={{
        position: "relative", zIndex: 10,
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--accent), #c9213f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 12px rgba(232,40,74,0.35)",
          }}>✂</div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em",
          }}>AgendasBarber</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/login")} style={{
            padding: "8px 18px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-default)", background: "transparent",
            color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500, fontSize: 14,
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            Entrar
          </button>
          <button onClick={() => navigate("/cadastro")} style={{
            padding: "8px 18px", borderRadius: "var(--radius-sm)",
            border: "none", background: "var(--accent)", color: "white",
            cursor: "pointer", fontWeight: 600, fontSize: 14,
            transition: "all var(--duration-fast) var(--ease-out)",
            boxShadow: "0 2px 12px rgba(232,40,74,0.3)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            Começar grátis
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: 60,
        alignItems: "center",
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        padding: "80px 40px 100px",
        position: "relative", zIndex: 1,
      }}>
        {/* Left */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px 6px 8px",
            background: "linear-gradient(90deg, rgba(212,168,67,0.1), rgba(212,168,67,0.04))",
            border: "1px solid var(--gold-border)",
            borderRadius: "var(--radius-full)", marginBottom: 28,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10,
            }}>★</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-light)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Gestão para barbearias modernas
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(42px, 5.5vw, 68px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            fontWeight: 900,
            marginBottom: 0,
          }}>
            Sua barbearia,{" "}
            <span style={{
              display: "block",
              background: "linear-gradient(130deg, var(--accent) 0%, #ff5c7a 40%, var(--gold) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              no comando.
            </span>
          </h1>

          {/* Decorative line */}
          <div style={{
            width: 60, height: 3,
            background: "linear-gradient(90deg, var(--accent), var(--gold))",
            borderRadius: "var(--radius-full)",
            marginTop: 24, marginBottom: 22,
          }} />

          <p style={{
            fontSize: 17, lineHeight: 1.7,
            color: "var(--text-secondary)", maxWidth: 500,
          }}>
            Centralize agendamentos, clientes e serviços em um painel elegante.
            Seu link único — clientes agendam online, 24h por dia.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/cadastro")} style={{
              padding: "15px 32px", borderRadius: "var(--radius-md)",
              border: "none",
              background: "linear-gradient(135deg, var(--accent) 0%, #c9213f 100%)",
              color: "white", cursor: "pointer", fontWeight: 700, fontSize: 15,
              transition: "all var(--duration-fast) var(--ease-out)",
              boxShadow: "0 6px 28px rgba(232,40,74,0.35)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(232,40,74,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(232,40,74,0.35)"; }}
            >
              Criar minha barbearia →
            </button>
            <button onClick={() => navigate("/login")} style={{
              padding: "15px 28px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)", background: "var(--bg-card)",
              color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: 15,
              transition: "all var(--duration-fast) var(--ease-out)",
              backdropFilter: "blur(12px)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              Já tenho conta
            </button>
          </div>

          {/* Social proof */}
          <div style={{
            display: "flex", gap: 0, marginTop: 44,
            borderTop: "1px solid var(--border-subtle)", paddingTop: 24,
          }}>
            {[
              { value: "2 min", label: "para configurar" },
              { value: "100%", label: "responsivo" },
              { value: "24h", label: "agendamento online" },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1,
                textAlign: i === 1 ? "center" : (i === 2 ? "right" : "left"),
                borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none",
                paddingRight: i < 2 ? 24 : 0,
                paddingLeft: i > 0 ? 24 : 0,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{item.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview card */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.7s 0.12s var(--ease-out), transform 0.7s 0.12s var(--ease-out)",
        }}>
          <div style={{
            borderRadius: "var(--radius-xl)",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid var(--border-default)",
            backdropFilter: "blur(24px)",
            boxShadow: "var(--shadow-xl), 0 0 80px rgba(232,40,74,0.06)",
            overflow: "hidden",
          }}>
            {/* Card header strip */}
            <div style={{
              height: 3,
              background: "linear-gradient(90deg, var(--accent), var(--gold))",
            }} />

            <div style={{ padding: 28 }}>
              {/* Mini dashboard preview */}
              <div style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                padding: 20, marginBottom: 24,
                border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "var(--gold)" }}>◈</span>
                    <span>Visão Geral</span>
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)",
                    padding: "3px 10px", borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    Hoje
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Agendamentos", value: "12", color: "var(--accent)" },
                    { label: "Concluídos", value: "8", color: "var(--success)" },
                    { label: "Cancelados", value: "1", color: "var(--danger)" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: "14px 10px", borderRadius: "var(--radius-sm)",
                      background: "rgba(255,255,255,0.025)", textAlign: "center",
                      border: "1px solid var(--border-subtle)",
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: "-0.03em" }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["09:00", "10:30", "14:00", "16:30"].map((h, i) => (
                    <div key={i} style={{
                      padding: "5px 11px", borderRadius: "var(--radius-xs)",
                      background: i === 2 ? "var(--accent-soft)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${i === 2 ? "var(--accent-border)" : "var(--border-subtle)"}`,
                      fontSize: 12, fontWeight: 600,
                      color: i === 2 ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, fontWeight: 700, marginBottom: 18,
                }}>
                  Como funciona
                </h3>
                {[
                  { step: "01", title: "Cadastre sua barbearia", desc: "Nome, e-mail e senha — em segundos" },
                  { step: "02", title: "Configure agenda e serviços", desc: "Horários, duração e preços" },
                  { step: "03", title: "Compartilhe seu link único", desc: "Clientes agendam online 24h" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, marginBottom: i < 2 ? 16 : 0,
                    paddingBottom: i < 2 ? 16 : 0,
                    borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "var(--radius-sm)", flexShrink: 0,
                      background: i === 0
                        ? "linear-gradient(135deg, var(--accent), #c9213f)"
                        : "var(--bg-tertiary)",
                      border: `1px solid ${i === 0 ? "rgba(232,40,74,0.4)" : "var(--border-default)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                      color: i === 0 ? "white" : "var(--text-muted)",
                      boxShadow: i === 0 ? "0 2px 10px rgba(232,40,74,0.3)" : "none",
                      letterSpacing: "0.03em",
                    }}>{item.step}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.45 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate("/cadastro")} style={{
                width: "100%", padding: "14px 20px",
                borderRadius: "var(--radius-md)", marginTop: 24,
                border: "none",
                background: "linear-gradient(135deg, var(--accent) 0%, #c9213f 100%)",
                color: "white", cursor: "pointer", fontWeight: 700, fontSize: 15,
                transition: "all var(--duration-fast) var(--ease-out)",
                boxShadow: "0 4px 20px rgba(232,40,74,0.3)",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,40,74,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(232,40,74,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Criar minha barbearia →
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
