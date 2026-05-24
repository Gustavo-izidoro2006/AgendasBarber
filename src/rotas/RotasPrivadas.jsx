import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Onboarding from "../pages/Onboarding";
import Servicos from "../pages/Servicos";

export default function RotasPrivadas() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/onboarding" element={<Onboarding />} />
      <Route path="/dashboard/servicos" element={<Servicos />} />
      {/* fallback para qualquer subpath não mapeado */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
