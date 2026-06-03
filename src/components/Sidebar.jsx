import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

const NAV_ITEMS = [
  { key: "dashboard", label: "Visão Geral", icon: "◈", path: "" },
  { key: "agendamentos", label: "Agendamentos", icon: "◷", path: "agendamentos" },
  { key: "servicos", label: "Serviços", icon: "✂", path: "servicos" },
  { key: "configuracoes", label: "Configurações", icon: "⚙", path: "configuracoes" },
];

export default function Sidebar({ aberta, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { barbearia } = useBarbearia();
  const { logout } = useSessaoBarbearia();
  const [copiado, setCopiado] = useState(false);

  const slug = barbearia?.slug || "";
  const publicLink = `${window.location.origin}/${slug}`;

  const activeKey = (() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const section = parts[2] || "";
    if (!section || section === "dashboard") return "dashboard";
    return section;
  })();

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = publicLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  async function sair() {
    try { await logout(); } catch { navigate("/login"); }
  }

  function irPara(path) {
    navigate(`/dashboard/${slug}/${path}`);
    if (onToggle) onToggle();
  }

  const sidebarContent = (
    <div style={{
      width: 240, height: "100vh",
      background: "rgba(8,8,9,0.98)",
      border: "1px solid var(--border-default)",
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(20px)",
      overflow: "hidden",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--gold))", flexShrink: 0 }} />

      {/* Brand */}
      <div style={{
        padding: "20px 18px 18px",
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--accent), #c9213f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 10px rgba(232,40,74,0.35)",
            flexShrink: 0,
          }}>✂</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Barbearia
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {barbearia?.nome || barbearia?.nomeBarbearia || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 8, paddingLeft: 8 }}>
          Menu
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => irPara(item.path)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "10px 12px", borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--accent-border)" : "transparent"}`,
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer", fontWeight: active ? 700 : 500,
                  fontSize: 14, transition: "all var(--duration-fast) var(--ease-out)",
                  display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                <span style={{ fontSize: 13, width: 16, textAlign: "center", opacity: active ? 1 : 0.55 }}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: "var(--accent)",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{
        padding: "14px 10px 18px",
        borderTop: "1px solid var(--border-subtle)",
        flexShrink: 0,
        display: "grid", gap: 8,
      }}>
        {/* Copy link */}
        <button onClick={copiarLink} style={{
          width: "100%", padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: copiado ? "1px solid var(--success-border)" : "1px solid var(--gold-border)",
          background: copiado ? "var(--success-soft)" : "var(--gold-soft)",
          color: copiado ? "var(--success)" : "var(--gold)",
          cursor: "pointer", fontWeight: 600, fontSize: 13,
          fontFamily: "inherit", transition: "all var(--duration-fast) var(--ease-out)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>{copiado ? "✓" : "◎"}</span>
          {copiado ? "Link copiado!" : "Copiar link público"}
        </button>

        {/* Logout */}
        <button onClick={sair} style={{
          width: "100%", padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-default)",
          background: "transparent", color: "var(--text-muted)",
          cursor: "pointer", fontWeight: 600, fontSize: 13,
          fontFamily: "inherit", transition: "all var(--duration-fast) var(--ease-out)",
          display: "flex", alignItems: "center", gap: 8,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-soft)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger-border)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
        >
          <span>→</span> Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {aberta && (
        <div onClick={onToggle} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 99, backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }} />
      )}

      {/* Desktop sidebar */}
      <aside style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
      }}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {aberta && (
        <div style={{
          position: "fixed", left: 0, top: 0, bottom: 0,
          zIndex: 100, animation: "fadeSlideUp 0.25s var(--ease-out)",
        }}>
          {sidebarContent}
        </div>
      )}
    </>
  );
}
