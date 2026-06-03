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
  // collection_id real da sua coleção de barbearias
  barbearias: (import.meta.env.VITE_APPWRITE_BARBEARIAS_TABLE_ID || "clientes").toString().trim(),
  servicos: (import.meta.env.VITE_APPWRITE_SERVICOS_TABLE_ID || "servicos").toString().trim(),
  clientes: (import.meta.env.VITE_APPWRITE_CLIENTES_TABLE_ID || "clientes_barbearia").toString().trim(),
  agendamentos: (import.meta.env.VITE_APPWRITE_AGENDAMENTOS_TABLE_ID || "agendamentos").toString().trim(),
  horarios: (import.meta.env.VITE_APPWRITE_HORARIOS_TABLE_ID || "horarios_atendimento").toString().trim(),
  configuracoes: (import.meta.env.VITE_APPWRITE_CONFIGURACOES_TABLE_ID || "configuracoes_barbearia").toString().trim(),
};

function getCollectionId(key) {
  const id = COLLECTIONS[key];
  if (!id) throw new Error(`Collection não configurada: ${key}`);
  return id;
}

// CRUD
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
 * Upsert por filtro.
 * Usa listDocuments para achar o registro certo e atualiza ele;
 * se não existir, cria um novo com ID único.
 */
async function upsertByQuery(key, queries, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");

  const collId = getCollectionId(key);
  const res = await databases.listDocuments(DB_ID, collId, queries);
  const existing = res?.documents?.[0] ?? null;

  if (existing?.$id) {
    return databases.updateDocument(DB_ID, collId, existing.$id, payload);
  }

  return databases.createDocument(DB_ID, collId, ID.unique(), payload);
}

/**
 * Upsert nativo do Appwrite SDK 21.x (PUT /documents/:id).
 * Cria se não existe, atualiza se existe. Verdadeiramente idempotente.
 * REF: https://appwrite.io/docs/references/cloud/client-web/databases#upsertDocument
 */
async function upsertById(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  const collId = getCollectionId(key);

  // databases.upsertDocument usa PUT — cria se não existe, substitui se existe
  // Disponível no SDK appwrite@16+ via método direto
  if (typeof databases.upsertDocument === "function") {
    return databases.upsertDocument(DB_ID, collId, documentId, payload);
  }

  // Fallback para SDKs que não têm upsertDocument nativo
  try {
    return await databases.createDocument(DB_ID, collId, documentId, payload);
  } catch (e) {
    if (e?.code === 409 || e?.status === 409) {
      return databases.updateDocument(DB_ID, collId, documentId, payload);
    }
    throw e;
  }
}

async function createEmailSession(email, password) {
  if (typeof account.createEmailPasswordSession === "function") {
    return account.createEmailPasswordSession(email, password);
  }
  return account.createEmailSession(email, password);
}

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
    if (e?.code === 401 || e?.status === 401) return null;
    throw e;
  }
}

export {
  client,
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
  ID,
  listCollection,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  createEmailSession,
  deleteSession,
  getAccount,
  upsertById,
  upsertByQuery,
};