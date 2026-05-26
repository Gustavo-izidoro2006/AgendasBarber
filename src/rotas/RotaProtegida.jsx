import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";

export default function RotaProtegida() {
  const { carregando, usuario, barbearia } = useSessaoBarbearia();
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  // Verify onboarding status after authentication and barbearia is loaded
  useEffect(() => {
    if (carregando || !usuario) return;
    if (!barbearia) {
      // No barbearia document yet → cannot be complete
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
        if (e.code === 401) {
          console.error('401 Unauthorized accessing collection');
          setSetupComplete(false);
          // Keep loading false to show error screen instead of looping
          setSetupLoading(false);
          return;
        }
        console.error("Erro ao verificar onboarding", e);
        if (!cancelled) setSetupComplete(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }
    checkSetup();
    return () => {
      cancelled = true;
    };
  }, [carregando, usuario, barbearia]);

  if (carregando || setupLoading) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if onboarding data missing or barbearia not loaded
  if (!setupComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

