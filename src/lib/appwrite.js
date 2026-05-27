import { Client, Account, Databases, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Mapeamento das collections - valores podem vir do .env (VITE_COLLECTION_*) ou usar nomes padrões
const COLLECTIONS = {
  barbearias: import.meta.env.VITE_APPWRITE_BARBEARIAS_TABLE_ID || "barbearias",
  servicos: import.meta.env.VITE_APPWRITE_SERVICOS_TABLE_ID || "servicos",
  clientes: import.meta.env.VITE_APPWRITE_CLIENTES_TABLE_ID || "clientes_barbearia",
  agendamentos: import.meta.env.VITE_APPWRITE_AGENDAMENTOS_TABLE_ID || "agendamentos",
  horarios: import.meta.env.VITE_APPWRITE_HORARIOS_TABLE_ID || "horarios_atendimento",
  configuracoes: import.meta.env.VITE_APPWRITE_CONFIGURACOES_TABLE_ID || "configuracoes_barbearia",
};

function ensureDatabaseConfig() {
  if (!DB_ID) {
    console.warn("VITE_APPWRITE_DATABASE_ID não está configurada. Operações de banco de dados não estarão disponíveis.");
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

async function createEmailSession(email, password) {
  // 1. Tenta o método moderno do SDK atual (Appwrite v14+)
  if (typeof account.createEmailPasswordSession === "function") {
    return await account.createEmailPasswordSession(email, password);
  }
  
  // 2. Tenta o método antigo do SDK como fallback (Appwrite v13 ou inferior)
  if (typeof account.createEmailSession === "function") {
    try {
      return await account.createEmailSession(email, password);
    } catch (err) {
      console.warn("account.createEmailSession falhou, tentando fallback REST:", err?.message || err);
    }
  }

  // 3. Fallback manual via Fetch API caso o SDK falhe por completo
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
  console.debug("Appwrite createEmailSession fallback, endpoint:", endpoint, "project:", projectId);
  if (!endpoint) throw new Error("VITE_APPWRITE_ENDPOINT não configurado");

  const url = `${endpoint.replace(/\/$/, "")}/account/sessions/email`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Appwrite-Project": projectId },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.response = body;
    throw err;
  }
  
  try {
    const fallback = res.headers.get("X-Fallback-Cookies");
    if (fallback && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("cookieFallback", fallback);
    }
  } catch (e) {
    console.debug("Não foi possível setar cookieFallback:", e?.message || e);
  }

  return res.json();
}

function getFallbackHeaders() {
  return {
    "X-Appwrite-Project": import.meta.env.VITE_APPWRITE_PROJECT_ID,
  };
}

async function getAccount() {
  try {
    return await account.get();
  } catch (e) {
    // Se não estiver logado (erro 401), apenas retorna null amigavelmente
    // Isso evita que o console fique inundado de erros vermelhos de fetch manual
    if (e?.code === 401 || e?.status === 401) {
      return null;
    }
    throw e;
  }
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
export { client, account, databases, DB_ID, COLLECTIONS, Query, listCollection, getDocument, createDocument, updateDocument, deleteDocument, createEmailSession, deleteSession, getAccount };
