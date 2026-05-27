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

  // Carrega apenas o usuário autenticado — sem buscar barbearia aqui.
  // A barbearia é responsabilidade exclusiva do BarbeariaContexto.
  const carregarSessao = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const user = await getAccount(); // retorna null se guest (401 já tratado no appwrite.js)
      setUsuario(user ?? null);
      return user ?? null;
    } catch (err) {
      // Erros inesperados (não 401) são logados
      if (err?.code !== 401) console.error("Erro inesperado na sessão:", err);
      setUsuario(null);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(
    async (email, senha) => {
      setErro(null);
      try {
        // Limpa sessão anterior silenciosamente
        try { await deleteSession("current"); } catch { /* ignora */ }

        await createEmailSession(email, senha);

        // Recarrega o usuário no contexto
        const user = await carregarSessao();
        if (!user) throw new Error("Usuário não encontrado após login.");

        // Busca barbearia UMA VEZ para decidir para onde redirecionar
        const resp = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ]);
        const barb = resp?.documents?.[0] ?? null;

        if (barb?.slug) {
          navigate(`/dashboard/${barb.slug}`);
        } else {
          navigate("/onboarding");
        }
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
      navigate("/login");
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
        // 1) Cria o usuário no Appwrite Auth
        const created = await account.create("unique()", email, senha, nomeBarbearia || undefined);

        // 2) Cria o documento da barbearia vinculado ao user_id
        if (DB_ID && nomeBarbearia) {
          try {
            const slug =
              nomeBarbearia.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
              "-" +
              created.$id.substring(0, 6);

            await databases.createDocument(DB_ID, COLLECTIONS.barbearias, "unique()", {
              nome: nomeBarbearia,
              slug,
              email,
              user_id: created.$id,
              status: "ativo",
            });
          } catch (err) {
            console.error("Erro ao criar documento da barbearia:", err);
          }
        }

        // 3) Login automático
        await createEmailSession(email, senha);

        // 4) Atualiza o contexto de sessão
        await carregarSessao();

        // 5) Redireciona para onboarding (barbearia existe mas ainda não tem config)
        navigate("/onboarding");

        return created;
      } catch (err) {
        console.error("cadastro erro:", err);
        setErro(err?.message || err);
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
