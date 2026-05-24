import { Navigate, Outlet } from "react-router-dom";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

export default function RotaProtegida() {
  const { carregando, usuario } = useSessaoBarbearia();

  if (carregando) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
