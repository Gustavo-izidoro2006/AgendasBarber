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
        // QUERY COM RELATIONSHIP FIELDS: Appwrite documenta que Query.equal com relationship fields
        // pode falhar silenciosamente. Estratégia: busca sem filtro e filtra no client.
        // REF: https://appwrite.io/docs/products/databases/relationships#limitations
        const configRes = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.configuracoes,
          [] // Sem filtro - carrega TODOS os configuracoes docs
        );

        if (cancelled) return;

        // Filtra no client-side pela barbearia_id (evita limitation do Query com relationship)
        const configDoc = configRes?.documents?.find(
          (d) =>
            d.barbearia_id === barbearia.$id ||
            d.barbearia_id?.$id === barbearia.$id
        ) ?? null;

        // Verifica se onboarding foi completado
        // ✅ Se true: permite acesso ao dashboard
        // ❌ Se false/null: redireciona de volta para onboarding
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
