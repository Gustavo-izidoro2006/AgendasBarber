import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Onboarding from "../pages/Onboarding";
import Servicos from "../pages/Servicos";
import Configuracoes from "../pages/Configuracoes";

export default function RotasPrivadas() {
  const { slug } = useParams();

  return (
    <Routes>
      {/* Paths relativos ao /dashboard/:slug/* do pai */}
      <Route index element={<Dashboard />} />
      <Route path="servicos" element={<Servicos />} />
      <Route path="configuracoes" element={<Configuracoes />} />
      {/* Onboarding deve ser acessado via /onboarding (rota fora do /dashboard) */}
      {/* fallback */}
      <Route
        path="*"
        element={<Navigate to={slug ? `/dashboard/${slug}` : "/login"} replace />}
      />
    </Routes>
  );
}
