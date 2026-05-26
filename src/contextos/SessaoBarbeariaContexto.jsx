import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { account, databases, COLLECTIONS, createEmailSession, deleteSession, Query, DB_ID, createDocument } from "../lib/appwrite";
import { useNavigate } from "react-router-dom";

const SessaoBarbeariaContexto = createContext(null);

export function useSessaoBarbearia() {
  const ctx = useContext(SessaoBarbeariaContexto);
  if (!ctx) throw new Error("useSessaoBarbearia deve ser usado dentro do provider.");
  return ctx;
}

export function SessaoBarbeariaProvider({ children }) {
  // Compatibilidade: este provider continua existindo, mas o fluxo principal
  // (useBarbearia) agora será usado no guard/rotas.

  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [barbearia, setBarbearia] = useState(null);
  const [barbeariaId, setBarbeariaId] = useState(null);

  const carregarSessao = useCallback(async () => {
    // garante que o loading seja desligado em todos os caminhos e trata sessão expirada
    let cancelled = false;
    setCarregando(true);
    setErro(null);

    try {
      const user = await account.get();
      setUsuario(user);

      if (!DB_ID) {
        setBarbearia(null);
      setBarbeariaId(null);
        setCarregando(false);
        return null;
      }

      // Busca a barbearia do usuário logado na collection "clientes" (que armazena barbearias)
      try {
        const resposta = await databases.listDocuments(DB_ID, COLLECTIONS.barbearias, [
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ]);
        const barbeariaDoUsuario = resposta?.documents?.[0] ?? null;
        setBarbearia(barbeariaDoUsuario);
        setBarbeariaId(barbeariaDoUsuario?.$id || null);
        return barbeariaDoUsuario;
      } catch (err) {
        console.error("Erro ao buscar barbearia:", err);
        setBarbearia(null);
      setBarbeariaId(null);
        return null;
      }
    } catch (err) {
      // Usuário não autenticado ou erro na chamada (esperado quando não logged in)
      // Não mostra erro para o usuário, apenas reseta estado
      console.debug("Sessão não autenticada:", err?.message);
      setUsuario(null);
      setBarbearia(null);
      setBarbeariaId(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(
    async (email, senha) => {
      setErro(null);
      try {
        // Limpa sessão existente antes de criar nova
        try {
          await deleteSession("current");
        } catch {
          // ignora se não houver sessão ativa
        }

        await createEmailSession(email, senha);
        const barbeariaAtiva = await carregarSessao();

        // Verifica se a barbearia já está configurada
        if (barbeariaAtiva) {
          navigate(`/dashboard/${barbeariaAtiva.slug}`);
        } else {
          // onboarding multi-tenant será decidido pelo guard (RotaProtegida)
          // mantendo o fluxo atual apenas como fallback
          navigate("/dashboard/onboarding");
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
      setBarbearia(null);
      setBarbeariaId(null);
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
        // Cria usuário no Appwrite Auth
        const created = await account.create(
          "unique()",
          email,
          senha,
          nomeBarbearia || undefined
        );

        // Cria o documento da barbearia na collection "clientes"
        if (DB_ID && nomeBarbearia) {
          try {
            const slug = nomeBarbearia.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') + '-' + created.$id.substring(0, 6);

            await createDocument("barbearias", "unique()", {
              nome: nomeBarbearia,
              slug: slug,
              email: email,
              user_id: created.$id,
            });
          } catch (err) {
            console.error("Erro ao criar documento da barbearia:", err);
          }
        }

        // Redireciona para login após cadastro
        navigate("/login");
        return created;
      } catch (err) {
        console.error("cadastro erro:", err);
        setErro(err);
        throw err;
      }
    },
    []
  );

  // Função para atualizar a barbearia após onboarding
  const atualizarBarbearia = useCallback(async (dados) => {
    if (!barbearia?.$id) {
      throw new Error("Barbearia não encontrada");
    }

    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTIONS.barbearias,
        barbearia.$id,
        dados
      );
      setBarbearia(response);
      return response;
    } catch (err) {
      console.error("Erro ao atualizar barbearia:", err);
      throw err;
    }
  }, [barbearia]);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const valor = useMemo(
    () => ({
      usuario,
      barbearia,
      barbeariaId,
      carregando,
      erro,
      login,
      logout,
      cadastro,
      atualizarBarbearia,
      recarregarSessao: carregarSessao,
    }),
    [usuario, barbearia, barbeariaId, carregando, erro, login, logout, cadastro, atualizarBarbearia, carregarSessao]
  );

  return <SessaoBarbeariaContexto.Provider value={valor}>{children}</SessaoBarbeariaContexto.Provider>;
}