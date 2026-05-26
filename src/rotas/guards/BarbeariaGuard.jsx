import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSessaoBarbearia } from "../../contextos/SessaoBarbeariaContexto";
import { useBarbearia } from "../../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query } from "../../lib/appwrite";

export default function BarbeariaGuard() {
  const { carregando: carregandoSessao, usuario } = useSessaoBarbearia();
  const { barbearia, carregando: carregandoBarbearia } = useBarbearia();

  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  const barbeariaId = barbearia?.$id;
  const slug = useMemo(() => barbearia?.slug, [barbearia]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setSetupLoading(true);
      try {
        if (!usuario || carregandoSessao || carregandoBarbearia) return;
        if (!barbeariaId || !DB_ID) {
          if (!cancelled) {
            setSetupComplete(false);
          }
          return;
        }

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

        // opcional: se o schema tiver onboarding_completo, usar preferencialmente
        const configDoc = configRes?.documents?.[0];
        const onboardingCompleto = configDoc?.onboarding_completo;

        const complete = hasHorarios && hasConfig && hasServico && (onboardingCompleto === true || onboardingCompleto === undefined);

        if (!cancelled) setSetupComplete(complete);
      } catch {
        // evita loop: se houver erro de backend, não força redirect infinito
        if (!cancelled) setSetupComplete(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [carregandoSessao, carregandoBarbearia, usuario, barbeariaId]);

  if (carregandoSessao || carregandoBarbearia || setupLoading) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  if (!barbeariaId) {
    // sem barbearia => onboarding
    return <Navigate to={`/dashboard/onboarding`} replace />;
  }

  if (!setupComplete) {
    return <Navigate to={`/dashboard/${slug}/onboarding`} replace />;
  }

  return <Outlet />;
}

