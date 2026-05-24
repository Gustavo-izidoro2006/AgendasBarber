import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { account, databases, COLLECTIONS, createEmailSession, deleteSession } from "../lib/appwrite";
import { useNavigate } from "react-router-dom";

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
  const [barbearia, setBarbearia] = useState(null);

  const carregarSessao = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const user = await account.get();
      setUsuario(user);

      const databaseId = import.meta.env.VITE_APPWRITE_DB_ID;
      if (!databaseId) {
        setBarbearia(null);
        setCarregando(false);
        return;
      }

      // Tenta ler barbearia - se falhar, continua sem barbearia
      try {
        const resposta = await databases.listDocuments(databaseId, COLLECTIONS.barbearias);
        setBarbearia(resposta?.documents?.[0] ?? null);
      } catch (err) {
        console.error("Erro ao buscar barbearia:", err);
        setBarbearia(null);
      }
    } catch (err) {
      // Usuário não autenticado ou erro na chamada
      console.error("carregarSessao erro:", err);
      setUsuario(null);
      setBarbearia(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(
    async (email, senha) => {
      setErro(null);
      try {
        // usar wrapper que faz fallback para diferentes versões do SDK
        await createEmailSession(email, senha);
        await carregarSessao();
        // Após o primeiro login, direciona para onboarding inicial
        navigate("/dashboard/onboarding");
      } catch (err) {
        console.error("login erro:", err);
        setErro(err);
        throw err;
      }
    },
    [carregarSessao, navigate]
  );

  const logout = useCallback(async () => {
    setErro(null);
    try {
      await deleteSession("current");
      setUsuario(null);
      setBarbearia(null);
      navigate("/");
    } catch (err) {
      console.error("logout erro:", err);
      setErro(err);
      throw err;
    }
  }, [navigate]);

  const cadastro = useCallback(
    async ({ email, senha, nomeBarbearia }) => {
      // Conta/usuário via Appwrite Auth
      setErro(null);
      try {
        const created = await account.create(
          "unique()",
          email,
          senha,
          nomeBarbearia || undefined
        );

        // Cria a sessão após cadastro para facilitar o onboarding
        await createEmailSession(email, senha);

        // O cadastro da barbearia (collection) vem na tela de onboarding (fase seguinte),
        // então aqui só garantimos que o usuário existe.
        await carregarSessao();
        navigate("/dashboard/onboarding");
        return created;
      } catch (err) {
        console.error("cadastro erro:", err);
        setErro(err);
        throw err;
      }
    },
    [carregarSessao, navigate]
  );

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const valor = useMemo(
    () => ({
      usuario,
      barbearia,
      carregando,
      erro,
      login,
      logout,
      cadastro,
      recarregarSessao: carregarSessao,
    }),
    [usuario, barbearia, carregando, erro, login, logout, cadastro, carregarSessao]
  );

  return <SessaoBarbeariaContexto.Provider value={valor}>{children}</SessaoBarbeariaContexto.Provider>;
}
