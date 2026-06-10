import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBarbearia } from "../../contextos/BarbeariaContexto";
import { api } from "../../lib/api";

export default function BarbeariaGuard() {
  const { barbearia, carregando: carregandoBarbearia } = useBarbearia();
  const { slug } = useParams();
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (carregandoBarbearia) return;
    if (!barbearia?.id) {
      setSetupComplete(false);
      setSetupLoading(false);
      return;
    }

    let cancelled = false;

    async function checkSetup() {
      try {
        const cfg = await api.get(`/configuracoes/index.php?barbearia_id=${barbearia.id}`);
        if (cancelled) return;
        setSetupComplete(cfg?.onboarding_completo == 1 || cfg?.onboarding_completo === true);
      } catch {
        if (!cancelled) setSetupComplete(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }

    checkSetup();
    return () => { cancelled = true; };
  }, [carregandoBarbearia, barbearia]);

  if (carregandoBarbearia || setupLoading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#FD366E", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 14 }}>Verificando...</div>
        </div>
      </main>
    );
  }

  if (!barbearia) return <Navigate to="/onboarding" replace />;

  if (!setupComplete) {
    const destSlug = barbearia.slug ?? slug;
    return <Navigate to={`/dashboard/${destSlug}/onboarding`} replace />;
  }

  return <Outlet />;
}
