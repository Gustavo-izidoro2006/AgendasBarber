import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const carregouRef = useRef(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const user = await getAccount();
      if (!user || !DB_ID) { setBarbearia(null); return; }

      const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]);
      setBarbearia(resp?.documents?.[0] ?? null);
    } catch (e) {
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
    if (carregouRef.current) return;
    carregouRef.current = true;
    carregar();
  }, [carregar]);

  const valor = useMemo(() => ({
    barbearia,
    carregando,
    erro,
    setBarbearia,
    recarregarBarbearia: carregar,
  }), [barbearia, carregando, erro, carregar]);

  return <BarbeariaContexto.Provider value={valor}>{children}</BarbeariaContexto.Provider>;
}
