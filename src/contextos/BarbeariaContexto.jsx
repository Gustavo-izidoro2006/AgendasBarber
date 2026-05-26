import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { databases, COLLECTIONS, DB_ID, Query, getAccount } from "../lib/appwrite";

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
        const user = await getAccount();

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
          // não redireciona aqui; a rota é decidida pelo guard
        } else {
          setBarbearia(null);
        }
      } catch (e) {
        if (cancelled) return;
        // quando não autenticado (401), não poluir erro; só zera barbearia
        if (e?.code === 401) {
          setErro(null);
          setBarbearia(null);
        } else {
          setErro(e);
          setBarbearia(null);
        }
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

