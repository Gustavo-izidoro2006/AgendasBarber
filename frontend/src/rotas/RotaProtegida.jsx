import { Navigate, Outlet } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";

// semSetupCheck: usado na rota /onboarding — protege contra não autenticados
// mas não redireciona por falta de setup (senão vira loop infinito)
export default function RotaProtegida({ semSetupCheck = false }) {
  const { carregando: carregandoSessao, usuario } = useSessaoBarbearia();
  const { barbearia, carregando: carregandoBarbearia } = useBarbearia();

  if (carregandoSessao || carregandoBarbearia) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  // Não autenticado → login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Rota sem checagem de setup (ex: /onboarding) — só valida autenticação
  if (semSetupCheck) {
    return <Outlet />;
  }

  // Autenticado mas sem barbearia → onboarding
  if (!barbearia) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}