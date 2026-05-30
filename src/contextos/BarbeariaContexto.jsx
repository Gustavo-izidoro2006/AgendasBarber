import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { databases, COLLECTIONS, DB_ID, Query, getAccount } from "../lib/appwrite";

const BarbeariaContexto = createContext(null);

export function useBarbearia() {
  const ctx = useContext(BarbeariaContexto);
  if (!ctx) throw new Error("useBarbearia deve ser usado dentro de BarbeariaProvider");
  return ctx;
}

export function BarbeariaProvider({ children }) {
  const [barbearia, setBarbearia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      // getAccount() retorna null para guests — tratado silenciosamente no appwrite.js
      const user = await getAccount();

      if (!user || !DB_ID) {
        setBarbearia(null);
        return;
      }

      const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]);

      setBarbearia(resp?.documents?.[0] ?? null);
    } catch (e) {
      // 401 = guest, silencioso. Outros erros são logados.
      if (e?.code !== 401) {
        console.error("BarbeariaContexto erro:", e);
        setErro(e);
      }
      setBarbearia(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await carregar();
    };
    run();
    return () => { cancelled = true; };
  }, [carregar]);

  const valor = useMemo(
    () => ({
      barbearia,
      carregando,
      erro,
      setBarbearia,
      recarregarBarbearia: carregar, // útil após onboarding
    }),
    [barbearia, carregando, erro, carregar]
  );

  return <BarbeariaContexto.Provider value={valor}>{children}</BarbeariaContexto.Provider>;
}
