import { Client, Account, Databases, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;

// Mapeamento das collections - valores podem vir do .env (VITE_COLLECTION_*) ou usar nomes padrões
const COLLECTIONS = {
  barbearias: import.meta.env.VITE_COLLECTION_BARBEARIAS || "barbearias",
  servicos: import.meta.env.VITE_COLLECTION_SERVICOS || "servicos",
  clientes: import.meta.env.VITE_COLLECTION_CLIENTES || "clientes_barbearia",
  agendamentos: import.meta.env.VITE_COLLECTION_AGENDAMENTOS || "agendamentos",
  horarios: import.meta.env.VITE_COLLECTION_HORARIOS || "horarios_atendimento",
  configuracoes: import.meta.env.VITE_COLLECTION_CONFIGURACOES || "configuracoes_barbearia",
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
  // Tenta usar SDK primeiro, mas se houver erro (401/CORS) usa fallback REST com credentials
  if (typeof account.createEmailSession === "function") {
    try {
      return await account.createEmailSession(email, password);
    } catch (err) {
      console.warn("account.createEmailSession falhou, tentando fallback REST:", err?.message || err);
      // continua para fallback
    }
  }

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
  // Se o Appwrite retornar header X-Fallback-Cookies (modo fallback para cookies), persiste em localStorage
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