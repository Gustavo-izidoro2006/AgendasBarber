import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Onboarding from "../pages/Onboarding";
import Servicos from "../pages/Servicos";

export default function RotasPrivadas() {
  const { slug } = useParams();

  return (
    <Routes>
      <Route path="/dashboard/:slug" element={<Dashboard />} />
      <Route path="/dashboard/:slug/onboarding" element={<Onboarding />} />
      <Route path="/dashboard/:slug/servicos" element={<Servicos />} />
      {/* fallback para qualquer subpath não mapeado */}
      <Route
        path="*"
        element={<Navigate to={slug ? `/dashboard/${slug}` : "/login"} replace />} />

    </Routes>
  );
}
