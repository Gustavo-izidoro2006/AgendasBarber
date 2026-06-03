import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

const NAV_ITEMS = [
  { key: "dashboard", label: "Visão Geral", emoji: "📊", path: "" },
  { key: "agendamentos", label: "Agendamentos", emoji: "📅", path: "agendamentos" },
  { key: "servicos", label: "Serviços", emoji: "✂️", path: "servicos" },
  { key: "configuracoes", label: "Configurações", emoji: "⚙️", path: "configuracoes" },
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

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div onClick={onToggle} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998, display: "block",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        }} />
      )}

      <aside style={{
        position: "fixed", top: 0, left: aberta ? 0 : -260, width: 260, height: "100vh",
        background: "rgba(8,8,10,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border-default)", zIndex: 999,
        display: "flex", flexDirection: "column", transition: "left 0.25s var(--ease-out)", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>✂️</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{
                color: "var(--text-primary)", fontWeight: 700, fontSize: 15,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{barbearia?.nomear || "Barbearia"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>AgendasBarber</div>
            </div>
          </div>
        </div>

        {/* Link público */}
        {slug && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{
              color: "var(--text-muted)", fontSize: 10, marginBottom: 6, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>Link público</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)", padding: "6px 10px",
            }}>
              <span style={{
                color: "var(--text-secondary)", fontSize: 12, flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{slug}</span>
              <button onClick={copiarLink} style={{
                padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "none",
                background: copiado ? "var(--success-soft)" : "var(--accent-soft)",
                color: copiado ? "var(--success)" : "var(--accent)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                transition: "all var(--duration-fast) var(--ease-out)", flexShrink: 0,
              }}>
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeKey === item.key;
            return (
              <button key={item.key} onClick={() => irPara(item.path)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "none",
                background: isActive ? "var(--accent-soft)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                cursor: "pointer", transition: "all var(--duration-fast) var(--ease-out)",
                textAlign: "left", marginBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={sair} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(253,54,110,0.15)", background: "transparent",
            color: "var(--accent)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "all var(--duration-fast) var(--ease-out)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            🚪 Sair
          </button>
        </div>
      </aside>
    </>
  );
}
