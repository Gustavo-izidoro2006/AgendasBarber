import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBarbearia } from "../../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID, Query } from "../../lib/appwrite";

export default function BarbeariaGuard() {
  const { barbearia, carregando: carregandoBarbearia } = useBarbearia();
  const { slug } = useParams();

  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (carregandoBarbearia) return;
    if (!barbearia?.$id || !DB_ID) {
      setSetupComplete(false);
      setSetupLoading(false);
      return;
    }

    let cancelled = false;

    async function checkSetup() {
      try {
        const barbeariaId = barbearia.$id;

        // Verifica as 3 condições do setup em paralelo
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

        if (cancelled) return;

        const hasHorarios = !!horariosRes?.documents?.length;
        const hasServicos = !!servicosRes?.documents?.length;
        const configDoc = configRes?.documents?.[0] ?? null;
        const hasConfig = !!configDoc;

        // Usa o flag onboarding_completo se disponível, senão verifica pelas 3 condições
        const onboardingCompleto =
          configDoc?.onboarding_completo === true
            ? true
            : hasHorarios && hasConfig && hasServicos;

        setSetupComplete(onboardingCompleto);
      } catch (e) {
        if (e?.code !== 401 && e?.code !== 400) {
          console.error("BarbeariaGuard checkSetup erro:", e);
        }
        if (!cancelled) setSetupComplete(false);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }

    checkSetup();
    return () => { cancelled = true; };
  }, [carregandoBarbearia, barbearia]);

  if (carregandoBarbearia || setupLoading) {
    return (
      <main style={{ padding: 24, color: "white" }}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  // Barbearia não encontrada (não deve chegar aqui — RotaProtegida já cobre)
  if (!barbearia) {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding incompleto → redireciona para /dashboard/[slug]/onboarding
  if (!setupComplete) {
    const destSlug = barbearia.slug ?? slug;
    return <Navigate to={`/dashboard/${destSlug}/onboarding`} replace />;
  }

  return <Outlet />;
}
