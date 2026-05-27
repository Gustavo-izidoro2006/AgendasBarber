import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessaoBarbeariaProvider } from "./contextos/SessaoBarbeariaContexto";
import { BarbeariaProvider } from "./contextos/BarbeariaContexto";
import BarbeariaGuard from "./rotas/guards/BarbeariaGuard";
import RotasPublicas from "./rotas/RotasPublicas";
import RotasPrivadas from "./rotas/RotasPrivadas";
import RotaProtegida from "./rotas/RotaProtegida";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <BrowserRouter>
      <SessaoBarbeariaProvider>
        <BarbeariaProvider>
          <Routes>
            {/* Rotas públicas (landing, login, cadastro, página pública da barbearia) */}
            {RotasPublicas()}

            {/* Onboarding: protegido (precisa de login) mas fora do guard de setup */}
            <Route element={<RotaProtegida semSetupCheck />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Rotas privadas do dashboard (exige login + setup completo) */}
            <Route element={<RotaProtegida />}>
              <Route path="/dashboard/:slug/*" element={<BarbeariaGuard />}>
                <Route path="*" element={<RotasPrivadas />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Navigate to="/login" replace />} />
          </Routes>
        </BarbeariaProvider>
      </SessaoBarbeariaProvider>
    </BrowserRouter>
  );
}
