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
 * Usa databases.upsertDocument (PUT) do SDK — idempotente por design.
 * REF: https://appwrite.io/docs/references/cloud/client-web/databases#upsertDocument
 */
async function upsertById(key, documentId, payload) {
  if (!DB_ID) throw new Error("VITE_APPWRITE_DATABASE_ID não configurado");
  return databases.upsertDocument(DB_ID, getCollectionId(key), documentId, payload);
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