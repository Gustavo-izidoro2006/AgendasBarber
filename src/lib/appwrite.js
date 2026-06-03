import { Client, Account, Databases, Query, ID } from "appwrite";

const APPWRITE_ENDPOINT = (import.meta.env.VITE_APPWRITE_ENDPOINT || "").toString().trim();
const APPWRITE_PROJECT_ID = (import.meta.env.VITE_APPWRITE_PROJECT_ID || "").toString().trim();

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = (import.meta.env.VITE_APPWRITE_DATABASE_ID || "").toString().trim();

const COLLECTIONS = {
  barbearias:    (import.meta.env.VITE_APPWRITE_BARBEARIAS_TABLE_ID    || "clientes").toString().trim(),
  servicos:      (import.meta.env.VITE_APPWRITE_SERVICOS_TABLE_ID      || "servicos").toString().trim(),
  clientes:      (import.meta.env.VITE_APPWRITE_CLIENTES_TABLE_ID      || "clientes_barbearia").toString().trim(),
  agendamentos:  (import.meta.env.VITE_APPWRITE_AGENDAMENTOS_TABLE_ID  || "agendamentos").toString().trim(),
  horarios:      (import.meta.env.VITE_APPWRITE_HORARIOS_TABLE_ID      || "horarios_atendimento").toString().trim(),
  configuracoes: (import.meta.env.VITE_APPWRITE_CONFIGURACOES_TABLE_ID || "configuracoes_barbearia").toString().trim(),
};

function getCollectionId(key) {
  const id = COLLECTIONS[key];
  if (!id) throw new Error(`Collection não configurada: ${key}`);
  return id;
}

// ─── CRUD wrappers ───────────────────────────────────────────────────────────

async function listCollection(key, queries = []) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.listDocuments(DB_ID, getCollectionId(key), queries);
}

async function getDocument(key, documentId) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.getDocument(DB_ID, getCollectionId(key), documentId);
}

async function createDocument(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.createDocument(DB_ID, getCollectionId(key), documentId, payload);
}

async function updateDocument(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.updateDocument(DB_ID, getCollectionId(key), documentId, payload);
}

async function deleteDocument(key, documentId) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.deleteDocument(DB_ID, getCollectionId(key), documentId);
}

/**
 * Upsert seguro por $id conhecido.
 * Quando você já tem o $id do documento, use esta função para criar ou atualizar.
 * Tenta criar o documento primeiro, e se já existir (erro 409), atualiza.
 * Se der conflito de chave única/relacionamento (409), localiza o documento e atualiza.
 */
async function upsertById(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  try {
    return await databases.createDocument(DB_ID, getCollectionId(key), documentId, payload);
  } catch (e) {
    if (e?.code === 409 || e?.status === 409) {
      try {
        // Tenta atualizar pelo ID fornecido caso ele seja o existente
        return await databases.updateDocument(DB_ID, getCollectionId(key), documentId, payload);
      } catch (updateErr) {
        if (updateErr?.code === 404 || updateErr?.status === 404) {
          // Conflito de 409 ocorreu por causa de uma restrição única/relacionamento em outro ID.
          // Vamos buscar o documento existente para atualizá-lo.
          const queries = [];
          if (payload.barbearia_id) {
            queries.push(Query.equal("barbearia_id", payload.barbearia_id));
          }
          if (key === "horarios" && payload.dia_semana !== undefined) {
            queries.push(Query.equal("dia_semana", payload.dia_semana));
          }
          if (key === "servicos" && payload.nome) {
            queries.push(Query.equal("nome", payload.nome));
          }

          let docs = [];
          try {
            const res = await databases.listDocuments(DB_ID, getCollectionId(key), queries);
            docs = res?.documents ?? [];
          } catch {
            // Fallback: busca tudo e filtra no cliente (se falhar query de relação)
            const resAll = await databases.listDocuments(DB_ID, getCollectionId(key), [Query.limit(100)]);
            const bid = payload.barbearia_id;
            docs = (resAll?.documents ?? []).filter(d => {
              const matchesBarbearia = d.barbearia_id === bid || d.barbearia_id?.$id === bid;
              if (!matchesBarbearia) return false;
              if (key === "horarios") {
                return d.dia_semana === payload.dia_semana;
              }
              if (key === "servicos") {
                return d.nome === payload.nome;
              }
              return true;
            });
          }

          if (docs.length > 0) {
            const existingId = docs[0].$id;
            return await databases.updateDocument(DB_ID, getCollectionId(key), existingId, payload);
          }
        }
        throw updateErr;
      }
    }
    throw e;
  }
}

/**
 * Cria email/password session.
 * REF: https://appwrite.io/docs/products/auth/email-password
 */
async function createEmailSession(email, password) {
  if (typeof account.createEmailPasswordSession === "function") {
    return account.createEmailPasswordSession(email, password);
  }
  // fallback SDK antigo
  return account.createEmailSession(email, password);
}

/**
 * Get current user. Retorna null para guests (401) — não lança erro.
 */
async function getAccount() {
  try {
    return await account.get();
  } catch (e) {
    if (e?.code === 401 || e?.status === 401) return null;
    throw e;
  }
}

async function deleteSession(sessionId = "current") {
  try {
    return await account.deleteSession(sessionId);
  } catch (e) {
    // Ignora 401 (sessão já expirada)
    if (e?.code === 401) return null;
    throw e;
  }
}

export {
  client, account, databases,
  DB_ID, COLLECTIONS, Query, ID,
  listCollection, getDocument, createDocument, updateDocument,
  deleteDocument, createEmailSession, deleteSession, getAccount,
  upsertById,
};
