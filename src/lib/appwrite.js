import { Client, Account, Databases, Query, ID } from "appwrite";

// Trim environment variables to avoid leading/trailing spaces from env files
const APPWRITE_ENDPOINT = (import.meta.env.VITE_APPWRITE_ENDPOINT || "").toString().trim();
const APPWRITE_PROJECT_ID = (import.meta.env.VITE_APPWRITE_PROJECT_ID || "").toString().trim();

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = (import.meta.env.VITE_APPWRITE_DATABASE_ID || "").toString().trim();

// Mapeamento das collections - valores podem vir do .env (VITE_COLLECTION_*) ou usar nomes padrões
const COLLECTIONS = {
  barbearias: (import.meta.env.VITE_APPWRITE_BARBEARIAS_TABLE_ID || "barbearias").toString().trim(),
  servicos: (import.meta.env.VITE_APPWRITE_SERVICOS_TABLE_ID || "servicos").toString().trim(),
  clientes: (import.meta.env.VITE_APPWRITE_CLIENTES_TABLE_ID || "clientes_barbearia").toString().trim(),
  agendamentos: (import.meta.env.VITE_APPWRITE_AGENDAMENTOS_TABLE_ID || "agendamentos").toString().trim(),
  horarios: (import.meta.env.VITE_APPWRITE_HORARIOS_TABLE_ID || "horarios_atendimento").toString().trim(),
  configuracoes: (import.meta.env.VITE_APPWRITE_CONFIGURACOES_TABLE_ID || "configuracoes_barbearia").toString().trim(),
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
  return databases.createDocument(DB_ID, getCollectionId(key), ID.unique(), payload);
}

async function updateDocument(key, documentId, payload) {
  ensureDatabaseConfig();
  return databases.updateDocument(DB_ID, getCollectionId(key), documentId, payload);
}

async function deleteDocument(key, documentId) {
  ensureDatabaseConfig();
  return databases.deleteDocument(DB_ID, getCollectionId(key), documentId);
}

/**
 * Upsert document com tratamento de 409 Conflict.
 * 
 * ESTRATÉGIA APPWRITE OFICIAL (v21.5.0+):
 * 1. Tenta criar com ID.unique() para novo documento
 * 2. Em caso de 409 (Conflict): usa queries fornecidas para localizar documento existente
 * 3. Fallback: busca sem filtro (para cases onde Query.equal com relationship fields falha)
 * 4. Se encontrar: atualiza; senão ignora silenciosamente (já existe)
 * 
 * NOTA: Query.equal() com relationship fields pode falhar silenciosamente - sempre há fallback!
 * REF: https://appwrite.io/docs/products/databases/relationships#queries
 * 
 * @param {string} key - Chave da collection (ex: 'configuracoes')
 * @param {Array} queries - Array de Query.equal(...) para localizar doc existente
 * @param {Object} payload - Dados a criar ou atualizar
 * @returns {Object|null} Documento criado/atualizado ou null se 409 foi ignorado silenciosamente
 */
async function upsertDocument(key, queries = [], payload) {
  ensureDatabaseConfig();
  try {
    // Tenta criar novo documento com ID único
    return await databases.createDocument(DB_ID, getCollectionId(key), ID.unique(), payload);
  } catch (err) {
    // Se não for 409 Conflict, propagar erro
    if (err?.code !== 409) throw err;

    console.debug(`[upsertDocument] 409 Conflict detected para ${key}. Tentando localizar documento existente...`);

    // Conflito 409 — tenta localizar o documento existente
    try {
      // Estratégia 1: Usa queries fornecidas (Query.equal, etc)
      if (queries.length > 0) {
        try {
          const found = await databases.listDocuments(DB_ID, getCollectionId(key), queries.concat([Query.limit(25)]));
          const doc = (found?.documents ?? [])[0] ?? null;
          if (doc?.$id) {
            console.debug(`[upsertDocument] Documento encontrado via queries. Atualizando...`);
            return await databases.updateDocument(DB_ID, getCollectionId(key), doc.$id, payload);
          }
        } catch (e) {
          // Se falhar com as queries, continua para fallback
          console.debug(`[upsertDocument] Query falhou (relationship limitation?). Tentando fallback sem filtro...`);
        }
      }

      // Estratégia 2: Fallback - busca sem filtro
      // Para cases onde Query.equal com relationship fields falha silenciosamente
      // REF: https://appwrite.io/docs/products/databases/relationships#limitations
      const all = await databases.listDocuments(DB_ID, getCollectionId(key), [Query.limit(100)]);
      const doc = (all?.documents ?? [])[0] ?? null;
      if (doc?.$id) {
        console.debug(`[upsertDocument] Documento encontrado via fallback. Atualizando...`);
        return await databases.updateDocument(DB_ID, getCollectionId(key), doc.$id, payload);
      }
    } catch (e) {
      // Fallback falhou também - ignora silenciosamente
      console.debug(`[upsertDocument] Ambas estratégias falharam para ${key}:`, e?.message || e);
    }

    // Se chegou aqui: 409 foi tratada, documento já existe, não conseguimos atualizar
    // Retorna null para indicar que document já existia e não foi modificado
    console.debug(`[upsertDocument] Ignorando 409 silenciosamente para ${key} (documento já existe).`);
    return null;
  }
}

/**
 * Cria email/password session.
 * 
 * FLUXO CORRETO PER APPWRITE DOCS:
 * 1. Esta função cria a sessão e o SDK a armazena automaticamente em localStorage/cookies
 * 2. Todas as requisições subsequentes usam essa sessão automaticamente
 * 3. NÃO chamar getAccount() múltiplas vezes entre operações - só causa perda de sessão
 * 4. Navegar direto sem re-verificar - BarbeariaGuard verifica flags quando carregar
 * 
 * FALLBACKS: Tenta v14+ SDK → v13 SDK → Fetch API direto
 * REF: https://appwrite.io/docs/products/auth/email-password#login
 */
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
  const endpoint = APPWRITE_ENDPOINT;
  const projectId = APPWRITE_PROJECT_ID;
  console.debug("Appwrite createEmailSession fallback, endpoint:", endpoint, "project:", projectId);
  if (!endpoint) throw new Error("VITE_APPWRITE_ENDPOINT não configurado");

  const url = `${endpoint.replace(/\/$/, "")}/account/sessions/email`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Appwrite-Project": (projectId || "").toString().trim() },
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
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
  };
}

/**
 * Get current user account.
 * 
 * IMPORTANTE - QUANDO USAR:
 * ✅ USE: No load inicial (App.jsx, context providers) para verificar se usuário está logado
 * ❌ NÃO USE: Entre operações de data persistence (após createDocument/updateDocument)
 *           → Isso pode perder a sessão em clients sem custom domain configurado
 * ❌ NÃO USE: Para "re-verificar" sessão antes de navegar
 *           → A sessão já foi criada durante login e é mantida pelo SDK automaticamente
 * 
 * COMPORTAMENTO:
 * - Retorna: User object se logado
 * - Retorna: null se 401 (não logado) - silenciosamente, sem throw
 * - Throw: qualquer outro erro (400, 500, etc)
 * 
 * PROBLEMA 401: Se chamar getAccount() após salvar dados, o SDK pode perder a sessão 
 * localStorage se não houver custom domain em Settings. Use BarbeariaGuard para verificar
 * onboarding_completo flag em vez de re-validar sessão.
 * 
 * REF: https://appwrite.io/docs/references/cloud/client-web/account#get-account
 */
async function getAccount() {
  try {
    return await account.get();
  } catch (e) {
    // Se não estiver logado (erro 401), apenas retorna null amigavelmente
    // Isso evita que o console fique inundado de erros vermelhos de fetch
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
  const endpoint = APPWRITE_ENDPOINT;
  console.debug("Appwrite deleteSession fallback, endpoint:", endpoint, "project:", APPWRITE_PROJECT_ID);
  if (!endpoint) throw new Error("VITE_APPWRITE_ENDPOINT não configurado");

  const url = `${endpoint.replace(/\/$/, "")}/account/sessions/${sessionId}`;
  const res = await fetch(url, { method: "DELETE", headers: { "X-Appwrite-Project": APPWRITE_PROJECT_ID }, credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.response = body;
    throw err;
  }
  return res.json().catch(() => null);
}

// Exporta Query para ser usado nos contextos e services
export { client, account, databases, DB_ID, COLLECTIONS, Query, listCollection, getDocument, createDocument, updateDocument, deleteDocument, createEmailSession, deleteSession, getAccount, upsertDocument };
