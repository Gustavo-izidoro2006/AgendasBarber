import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, clearToken, getAuthToken } from "../lib/api";

const SessaoBarbeariaContexto = createContext(null);

export function useSessaoBarbearia() {
  const ctx = useContext(SessaoBarbeariaContexto);
  if (!ctx) throw new Error("useSessaoBarbearia deve ser usado dentro do provider.");
  return ctx;
}

export function SessaoBarbeariaProvider({ children }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const carregouRef = useRef(false);

  const carregarSessao = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setUsuario(null);
        return null;
      }
      // Valida token e retorna o usuário
      const data = await api.get('/auth/me.php');
      setUsuario(data.usuario ?? null);
      return data.usuario ?? null;
    } catch {
      setUsuario(null);
      clearToken();
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    setErro(null);
    try {
      const data = await api.post('/auth/login.php', { email, senha });

      setToken(data.token);
      setUsuario(data.usuario);

      if (data.onboarding_completo && data.barbearia?.slug) {
        navigate(`/dashboard/${data.barbearia.slug}`);
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error("login erro:", err);
      setErro(err);
      throw err;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    setErro(null);
    try {
      await api.post('/auth/logout.php', {}).catch(() => {});
    } finally {
      clearToken();
      setUsuario(null);
      navigate('/login');
    }
  }, [navigate]);

  const cadastro = useCallback(async ({ email, senha, nomeBarbearia }) => {
    setErro(null);
    try {
      const data = await api.post('/auth/cadastro.php', {
        nome: nomeBarbearia,
        email,
        senha,
        nomeBarbearia,
      });

      setToken(data.token);
      setUsuario(data.usuario);
      navigate('/onboarding');
      return data;
    } catch (err) {
      console.error("cadastro erro:", err);
      setErro(err?.message || err);
      throw err;
    }
  }, [navigate]);

  useEffect(() => {
    if (carregouRef.current) return;
    carregouRef.current = true;
    carregarSessao();
  }, [carregarSessao]);

  const valor = useMemo(() => ({
    usuario, carregando, erro,
    login, logout, cadastro,
    recarregarSessao: carregarSessao,
  }), [usuario, carregando, erro, login, logout, cadastro, carregarSessao]);

  return (
    <SessaoBarbeariaContexto.Provider value={valor}>
      {children}
    </SessaoBarbeariaContexto.Provider>
  );
}
