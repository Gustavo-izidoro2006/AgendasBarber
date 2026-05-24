import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessaoBarbeariaProvider } from "./contextos/SessaoBarbeariaContexto";
import RotasPublicas from "./rotas/RotasPublicas";
import RotasPrivadas from "./rotas/RotasPrivadas";
import RotaProtegida from "./rotas/RotaProtegida";

export default function App() {
  return (
    <BrowserRouter>
      <SessaoBarbeariaProvider>
        <Routes>
          {/* Rotas públicas */}
          {RotasPublicas()}

          {/* Rotas privadas */}
          <Route element={<RotaProtegida />}>
            <Route path="/dashboard/*" element={<RotasPrivadas />} />
          </Route>

          {/* Redirects básicos */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SessaoBarbeariaProvider>
    </BrowserRouter>
  );
}
