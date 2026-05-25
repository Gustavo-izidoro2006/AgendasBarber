import { Client, Account, Databases, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;

// Mapeamento das collections - a collection "clientes" armazena as BARBEARIAS
const COLLECTIONS = {
  barbearias: "clientes", // Collection que armazena as barbearias (cada documento é uma barbearia)
  servicos: "servicos",
  clientes: "clientes_barbearia", // Collection que armazena os clientes de cada barbearia
  agendamentos: "agendamentos",
  horarios: "horarios_atendimento",
  configuracoes: "configuracoes_barbearia",
};

function ensureDatabaseConfig() {
  if (!DB_ID) {
    console.warn("VITE_APPWRITE_DB_ID não está configurada. Operações de banco de dados não estarão disponíveis.");
  }
}

function getCollectionId(key) {
  const collectionId = COLLECTIONS[key];
  if (!collectionId) {
    throw new Error(`Collection não configurada para a chave: ${key}`);
  }
  return collectionId;
}

async function listCollection(key, queries = []) {
  ensureDatabaseConfig();
  return databases.listDocuments(DB_ID, getCollectionId(key), queries);
}

async function getDocument(key, documentId) {
  ensureDatabaseConfig();
  return databases.getDocument(DB_ID, getCollectionId(key), documentId);
}

async function createDocument(key, documentId, payload) {
  ensureDatabaseConfig();
  return databases.createDocument(DB_ID, getCollectionId(key), documentId, payload);
}

async function createCollectionDocument(key, payload) {
  ensureDatabaseConfig();
  return databases.createDocument(DB_ID, getCollectionId(key), "unique()", payload);
}

async function updateDocument(key, documentId, payload) {
  ensureDatabaseConfig();
  return databases.updateDocument(DB_ID, getCollectionId(key), documentId, payload);
}

async function deleteDocument(key, documentId) {
  ensureDatabaseConfig();
  return databases.deleteDocument(DB_ID, getCollectionId(key), documentId);
}

// Compat shim: criar sessão por email (algumas versões do SDK expõem nomes diferentes)
async function createEmailSession(email, password) {
  if (typeof account.createEmailSession === "function") {
    return account.createEmailSession(email, password);
  }
  // fallback via fetch para o endpoint REST usando a variável de ambiente
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  console.debug("Appwrite createEmailSession fallback, endpoint:", endpoint, "project:", import.meta.env.VITE_APPWRITE_PROJECT_ID);
  if (!endpoint) throw new Error("VITE_APPWRITE_ENDPOINT não configurado");

  const url = `${endpoint.replace(/\/$/, "")}/account/sessions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Appwrite-Project": import.meta.env.VITE_APPWRITE_PROJECT_ID },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.response = body;
    throw err;
  }
  return res.json();
}

async function deleteSession(sessionId = "current") {
  if (typeof account.deleteSession === "function") {
    return account.deleteSession(sessionId);
  }
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  console.debug("Appwrite deleteSession fallback, endpoint:", endpoint, "project:", import.meta.env.VITE_APPWRITE_PROJECT_ID);
  if (!endpoint) throw new Error("VITE_APPWRITE_ENDPOINT não configurado");

  const url = `${endpoint.replace(/\/$/, "")}/account/sessions/${sessionId}`;
  const res = await fetch(url, { method: "DELETE", headers: { "X-Appwrite-Project": import.meta.env.VITE_APPWRITE_PROJECT_ID }, credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.response = body;
    throw err;
  }
  return res.json().catch(() => null);
}

// Exporta Query para ser usado nos contextos e services
export { client, account, databases, DB_ID, COLLECTIONS, Query, listCollection, getDocument, createDocument, updateDocument, deleteDocument, createEmailSession, deleteSession };