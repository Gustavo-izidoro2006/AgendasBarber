import { useEffect } from "react";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";

export default function Logout() {
  const { logout } = useSessaoBarbearia();

  useEffect(() => {
    // Executa logout ao abrir a rota
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, color: "white" }}>
      <h1>Saindo...</h1>
      <p>Você está sendo desconectado.</p>
    </main>
  );
}
