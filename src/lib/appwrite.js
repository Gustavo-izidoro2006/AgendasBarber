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
 * Estratégia: busca primeiro se o documento já existe (por constraints únicas),
 * e então decide entre criar ou atualizar. Evita completamente o ciclo 409→404.
 */
async function upsertById(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  const collId = getCollectionId(key);

  // Upsert real usando o mesmo $id:
  // - tenta createDocument
  // - se já existir (409), faz updateDocument no MESMO documentId
  // Isso elimina completamente o risco de 409→404 por divergência entre IDs.
  try {
    return await databases.createDocument(DB_ID, collId, documentId, payload);
  } catch (e) {
    if (!(e?.code === 409 || e?.status === 409)) throw e;

    // Já existe: atualiza no mesmo ID
    return await databases.updateDocument(DB_ID, collId, documentId, payload);
  }
}

/**
 * Busca documento existente pelas constraints únicas de cada collection.
 * Usa listDocuments com filtro no cliente porque Query.equal com Relationship
 * não é suportado diretamente pelo Appwrite.
 */
async function _findExistingDoc(key, payload, collId) {
  try {
    // Busca genérica — filtra no cliente
    // Observação: Relationship pode vir como string ou objeto {$id} dependendo do nível de permissões/expansão.
    const res = await databases.listDocuments(DB_ID, collId, [Query.limit(500)]);
    const docs = res?.documents ?? [];
    const bid = payload.barbearia_id;

    const normalizeId = v => {
      if (!v) return v;
      return typeof v === "object" ? v.$id : v;
    };

    return docs.find(d => {
      const dBarbId = normalizeId(d.barbearia_id);
      if (!bid || dBarbId !== bid) return false;

      if (key === "configuracoes") {
        // configuracoes: unique(barbearia_id)
        // (não depende de mais nada além do relacionamento)
        return true;
      }

      if (key === "horarios") {
        return d.dia_semana === payload.dia_semana;
      }

      if (key === "servicos") {
        return d.nome === payload.nome;
      }

      return true;
    }) ?? null;
  } catch {
    return null;
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
