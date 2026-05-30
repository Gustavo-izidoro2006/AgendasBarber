import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBarbearia } from "../../contextos/BarbeariaContexto";
import { databases, COLLECTIONS, DB_ID } from "../../lib/appwrite";

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
        // Busca direto pelo $id da barbearia em configuracoes
        // Evita Query.equal("barbearia_id") que falha com Relationship
        const configRes = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.configuracoes,
          [] // busca todos, filtra no cliente pelo barbearia_id
        );

        if (cancelled) return;

        // Procura o config doc desta barbearia
        const configDoc = configRes?.documents?.find(
          (d) =>
            d.barbearia_id === barbearia.$id ||
            d.barbearia_id?.$id === barbearia.$id
        ) ?? null;

        // Se onboarding_completo === true, vai pro dashboard direto
        const onboardingCompleto = configDoc?.onboarding_completo === true;

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

  if (!barbearia) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!setupComplete) {
    const destSlug = barbearia.slug ?? slug;
    return <Navigate to={`/dashboard/${destSlug}/onboarding`} replace />;
  }

  return <Outlet />;
}
