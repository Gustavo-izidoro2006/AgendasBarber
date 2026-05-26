import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessaoBarbeariaProvider } from "./contextos/SessaoBarbeariaContexto";
import { BarbeariaProvider } from "./contextos/BarbeariaContexto";
import BarbeariaGuard from "./rotas/guards/BarbeariaGuard";
import RotasPublicas from "./rotas/RotasPublicas";
import RotasPrivadas from "./rotas/RotasPrivadas";
import RotaProtegida from "./rotas/RotaProtegida";

export default function App() {
  return (
    <BrowserRouter>
      <SessaoBarbeariaProvider>
        <BarbeariaProvider>
          <Routes>
            {/* Rotas públicas */}
            {RotasPublicas()}


            {/* Rotas privadas */}
            <Route element={<RotaProtegida />}>
              <Route path="/dashboard/:slug/*" element={<BarbeariaGuard />}>
                <Route path="*" element={<RotasPrivadas />} />
              </Route>
            </Route>

            {/* Redirects básicos */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Navigate to="/login" replace />} />
          </Routes>
        </BarbeariaProvider>
      </SessaoBarbeariaProvider>
    </BrowserRouter>
  );
}
