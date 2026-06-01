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
    // /dashboard/:slug/:section?
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
      // fallback
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
    try {
      await logout();
    } catch {
      navigate("/login");
    }
  }

  function irPara(path) {
    navigate(`/dashboard/${slug}/${path}`);
    if (onToggle) onToggle();
  }

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          onClick={onToggle}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 998,
            display: "block",
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: aberta ? 0 : -260,
          width: 260,
          height: "100vh",
          background: "#0a0a0a",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          transition: "left 0.2s ease",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(253,54,110,0.15)",
                border: "1px solid rgba(253,54,110,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              ✂️
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {barbearia?.nomear || "Barbearia"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                AgendasBarber
              </div>
            </div>
          </div>
        </div>

        {/* Link público */}
        {slug && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6, fontWeight: 600 }}>
              LINK PÚBLICO
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {slug}
              </span>
              <button
                onClick={copiarLink}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: copiado ? "rgba(16,185,129,0.2)" : "rgba(253,54,110,0.15)",
                  color: copiado ? "#10b981" : "#FD366E",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => irPara(item.path)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: isActive ? "rgba(253,54,110,0.12)" : "transparent",
                  color: isActive ? "#FD366E" : "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={sair}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(253,54,110,0.2)",
              background: "transparent",
              color: "#FD366E",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🚪 Sair
          </button>
        </div>
      </aside>
    </>
  );
}
