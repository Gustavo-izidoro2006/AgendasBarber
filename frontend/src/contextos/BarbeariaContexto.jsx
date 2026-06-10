import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, getAuthToken } from "../lib/api";

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
  const tokenRef = useRef(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setBarbearia(null);
        return;
      }
      // Endpoint retorna a barbearia do usuário logado
      const data = await api.get('/barbearias/minha.php');
      setBarbearia(data ?? null);
    } catch (e) {
      console.error("BarbeariaContexto erro:", e);
      setErro(e);
      setBarbearia(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    
    // Se o token mudou, reseta e recarrega
    if (token !== tokenRef.current) {
      tokenRef.current = token;
      carregouRef.current = false;
      setBarbearia(null);
    }
    
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

  return (
    <BarbeariaContexto.Provider value={valor}>
      {children}
    </BarbeariaContexto.Provider>
  );
}
