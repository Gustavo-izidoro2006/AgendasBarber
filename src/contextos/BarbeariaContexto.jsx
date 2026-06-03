import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { databases, COLLECTIONS, DB_ID, Query } from "../lib/appwrite";
import { useSessaoBarbearia } from "./SessaoBarbeariaContexto";

const BarbeariaContexto = createContext(null);

export function useBarbearia() {
  const ctx = useContext(BarbeariaContexto);
  if (!ctx) throw new Error("useBarbearia deve ser usado dentro de BarbeariaProvider");
  return ctx;
}

export function BarbeariaProvider({ children }) {
  const { usuario, carregando: carregandoSessao } = useSessaoBarbearia();

  const [barbearia, setBarbearia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      if (!usuario || !DB_ID) {
        setBarbearia(null);
        return;
      }

      // user_id é campo STRING indexado (não Relationship) — Query.equal funciona
      const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
        Query.equal("user_id", usuario.$id),
        Query.limit(1),
      ]);

      setBarbearia(resp?.documents?.[0] ?? null);
    } catch (e) {
      console.error("BarbeariaContexto erro:", e);
      setErro(e);
      setBarbearia(null);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (carregandoSessao) return;
    carregar();
  }, [carregandoSessao, carregar]);

  const valor = useMemo(
    () => ({
      barbearia,
      carregando,
      erro,
      setBarbearia,
      recarregarBarbearia: carregar,
    }),
    [barbearia, carregando, erro, carregar]
  );

  return <BarbeariaContexto.Provider value={valor}>{children}</BarbeariaContexto.Provider>;
}