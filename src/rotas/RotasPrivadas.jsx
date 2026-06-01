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
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="servicos" element={<Servicos />} />
      <Route path="configuracoes" element={<Configuracoes />} />
      {/* fallback */}
      <Route
        path="*"
        element={<Navigate to={slug ? `/dashboard/${slug}` : "/login"} replace />}
      />
    </Routes>
  );
}
