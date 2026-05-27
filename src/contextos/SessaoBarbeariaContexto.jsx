import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { account, databases, COLLECTIONS, DB_ID, createEmailSession, deleteSession, Query, getAccount } from "../lib/appwrite";
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

  const carregarSessao = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const user = await getAccount();
      setUsuario(user);
      if (!user) {
        setCarregando(false);
        return null;
      }
      setCarregando(false);
      return user;
    } catch (err) {
      if (err?.code !== 401) {
        console.error("Erro inesperado na sessão:", err);
      }
      setUsuario(null);
      setCarregando(false);
      return null;
    }
  }, []);

  const login = useCallback(
    async (email, senha) => {
      setErro(null);
      try {
        try {
          await deleteSession("current");
        } catch {
          // ignora se não houver sessão ativa
        }

        await createEmailSession(email, senha);

        // Busca a barbearia uma única vez para decidir a navegação
        const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", (await getAccount())?.$id ?? ""),
          Query.limit(1),
        ]);
        const barb = resp?.documents?.[0] ?? null;

        // Atualiza o contexto de sessão
        await carregarSessao();

        navigate(barb ? `/dashboard/${barb.slug}` : "/dashboard/onboarding");
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
      navigate("/");
    } catch (err) {
      console.error("logout erro:", err);
      setErro(err);
      throw err;
    }
  }, [navigate]);

  const cadastro = useCallback(
    async ({ email, senha, nomeBarbearia }) => {
      setErro(null);
      try {
        const created = await account.create(
          "unique()",
          email,
          senha,
          nomeBarbearia || undefined
        );

        if (DB_ID && nomeBarbearia) {
          try {
            const slug = nomeBarbearia.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') + '-' + created.$id.substring(0, 6);

            await databases.createDocument(DB_ID, COLLECTIONS.barbearias, "unique()", {
              nome: nomeBarbearia,
              slug: slug,
              email: email,
              user_id: created.$id,
            });
          } catch (err) {
            console.error("Erro interno ao criar documento da barbearia:", err);
          }
        }

        await createEmailSession(email, senha);
        await carregarSessao();

        return created;
      } catch (err) {
        console.error("cadastro erro:", err);
        setErro(err?.message || err);
        throw err;
      }
    },
    [carregarSessao]
  );

  useEffect(() => {
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
