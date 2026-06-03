import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { account, databases, COLLECTIONS, DB_ID, createEmailSession, deleteSession, Query, getAccount, ID } from "../lib/appwrite";
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
  const carregouRef = useRef(false);

  const carregarSessao = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const user = await getAccount();
      setUsuario(user ?? null);
      return user ?? null;
    } catch (err) {
      if (err?.code !== 401) console.error("Erro inesperado na sessão:", err);
      setUsuario(null);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    setErro(null);

    try {
      try {
        await deleteSession("current");
      } catch {
        // ignora
      }

      await createEmailSession(email, senha);

      const user = await carregarSessao();
      if (!user) throw new Error("Sessão não encontrada após login.");

      const respBarb = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]);

      const barb = respBarb?.documents?.[0] ?? null;

      if (!barb?.$id) {
        navigate("/onboarding");
        return;
      }

      const cfgResp = await databases.listDocuments(DB_ID, COLLECTIONS.configuracoes, [
        Query.equal("barbearia_id", barb.$id),
        Query.limit(1),
      ]);

      const cfg = cfgResp?.documents?.[0] ?? null;

      if (cfg?.onboarding_completo === true && barb.slug) {
        navigate(`/dashboard/${barb.slug}`);
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      console.error("login erro:", err);
      setErro(err);
      throw err;
    }
  }, [carregarSessao, navigate]);

  const logout = useCallback(async () => {
    setErro(null);

    try {
      await deleteSession("current");
      setUsuario(null);
      navigate("/login");
    } catch (err) {
      console.error("logout erro:", err);
      setErro(err);
      throw err;
    }
  }, [navigate]);

  const cadastro = useCallback(async ({ email, senha, nomeBarbearia }) => {
    setErro(null);

    try {
      const created = await account.create(ID.unique(), email, senha, nomeBarbearia || undefined);

      if (DB_ID && nomeBarbearia) {
        const slug =
          nomeBarbearia
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") + "-" + created.$id.substring(0, 6);

        await databases.createDocument(DB_ID, COLLECTIONS.barbearias, ID.unique(), {
          nome: nomeBarbearia,
          slug,
          email,
          user_id: created.$id,
          status: "ativo",
        });
      }

      await createEmailSession(email, senha);
      await carregarSessao();
      navigate("/onboarding");
      return created;
    } catch (err) {
      console.error("cadastro erro:", err);
      setErro(err?.message || err);
      throw err;
    }
  }, [carregarSessao, navigate]);

  useEffect(() => {
    if (carregouRef.current) return;
    carregouRef.current = true;
    carregarSessao();
  }, [carregarSessao]);

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      erro,
      login,
      logout,
      cadastro,
      recarregarSessao: carregarSessao,
    }),
    [usuario, carregando, erro, login, logout, cadastro, carregarSessao]
  );

  return <SessaoBarbeariaContexto.Provider value={valor}>{children}</SessaoBarbeariaContexto.Provider>;
}