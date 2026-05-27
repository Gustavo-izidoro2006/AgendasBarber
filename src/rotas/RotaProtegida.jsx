import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";

export default function RotaProtegida() {
  const { carregando: carregandoSessao, usuario } = useSessaoBarbearia();
  const { barbearia, carregando: carregandoBarbearia } = useBarbearia();
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (carregandoSessao || !usuario) return;
    if (!barbearia) {
      setSetupComplete(false);
      setSetupLoading(false);
      return;
    }
    let cancelled = false;
    async function checkSetup() {
      try {
        const barbeariaId = barbearia.$id;
        const [horariosRes, configRes, servicosRes] = await Promise.all([
          databases.listDocuments(DB_ID, COLLECTIONS.horarios, [
            Query.equal("barbearia_id", barbeariaId),
            Query.limit(1),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, [
            Query.equal("barbearia_id", barbeariaId),
            Query.limit(1),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.servicos, [
            Query.equal("barbearia_id", barbeariaId),
            Query.limit(1),
          ]),
        ]);
        const hasHorarios = !!horariosRes?.documents?.length;
        const hasConfig = !!configRes?.documents?.length;
        const hasServico = !!servicosRes?.documents?.length;
        if (!cancelled) {
          setSetupComplete(hasHorarios && hasConfig && hasServico);
        }
      } catch (e) {
        if (e?.code !== 401 && e?.code !== 400) {
          console.error("Erro ao verificar onboarding", e);
        }
        if (!cancelled) setSetupComplete(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }
    checkSetup();
    return () => {
      cancelled = true;
    };
  }, [carregandoSessao, carregandoBarbearia, usuario, barbearia]);

  if (carregandoSessao || carregandoBarbearia || setupLoading) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!setupComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

