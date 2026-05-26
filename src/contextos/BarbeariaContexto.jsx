import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";

const BarbeariaContexto = createContext(null);

export function useBarbearia() {
  const ctx = useContext(BarbeariaContexto);
  if (!ctx) throw new Error("useBarbearia deve ser usado dentro de BarbeariaProvider");
  return ctx;
}

export function BarbeariaProvider({ children }) {
  const navigate = useNavigate();

  const [barbearia, setBarbearia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const user = await account.get();

        if (!DB_ID) {
          if (!cancelled) {
            setBarbearia(null);
            setCarregando(false);
          }
          return;
        }

        const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ]);

        const doc = resp?.documents?.[0] ?? null;

        if (cancelled) return;

        if (doc) {
          setBarbearia(doc);
          // navega somente após terminar a query
          navigate(`/dashboard/${doc.slug}`, { replace: true });
        } else {
          // sem documento de barbearia => onboarding
          navigate(`/dashboard/onboarding`, { replace: true });
        }
      } catch (e) {
        if (cancelled) return;
        setErro(e);
        setBarbearia(null);
        // Se usuário não estiver autenticado, deixa o app/guard redirecionar
        // (aqui não redirecionamos para evitar loops)
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const valor = useMemo(
    () => ({
      barbearia,
      carregando,
      erro,
      setBarbearia,
      recarregar: undefined,
    }),
    [barbearia, carregando, erro]
  );

  return <BarbeariaContexto.Provider value={valor}>{children}</BarbeariaContexto.Provider>;
}

