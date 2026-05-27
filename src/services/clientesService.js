import { Query, ID } from "appwrite";
import { listCollection, getDocument, createDocument, updateDocument, deleteDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

/**
 * Lista todos os clientes de uma barbearia
 * @param {string} barbeariaId - O ID da barbearia
 * @param {Array} queries - Queries adicionais do Appwrite (opcional)
 * @returns {Promise<Array<Object>>} Lista de clientes
 */
export async function listarClientes(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");

  const queriesComFiltro = [
    Query.equal("barbearia_id", barbeariaId),
    ...queries,
  ];

  const resp = await listCollection("clientes", queriesComFiltro);
  return resp?.documents ?? [];
}

/**
 * Busca um cliente pelo ID
 * @param {string} clienteId - O ID do cliente
 * @returns {Promise<Object|null>} O cliente encontrado ou null
 */
export async function buscarClientePorId(clienteId) {
  obrigatorio(clienteId, "clienteId");
  try {
    const resp = await getDocument("clientes", clienteId);
    return resp ?? null;
  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    throw new Error("Falha ao buscar cliente. Tente novamente.");
  }
}

/**
 * Cria um novo cliente para uma barbearia
 * @param {Object} params - Os dados do cliente
 * @returns {Promise<Object>} O cliente criado
 */
/**
 * Busca um cliente existente por barbearia + telefone (PASSO 1 do onboarding público)
 * Se o schema não tiver telefone indexado/único, ainda assim usamos o filtro.
 */
export async function buscarClientePorBarbeariaTelefone({ barbeariaId, telefone }) {
  obrigatorio(barbeariaId, "barbeariaId");
  obrigatorio(telefone, "telefone");

  const resp = await listCollection("clientes", [
    Query.equal("barbearia_id", barbeariaId),
    Query.equal("telefone", String(telefone).trim()),
  ]);

  return resp?.documents?.[0] ?? null;
}

/**
 * Cria um novo cliente para uma barbearia
 * @param {Object} params - Os dados do cliente
 * @returns {Promise<Object>} O cliente criado
 */
export async function criarCliente({ barbearia_id, nome, telefone, email, observacoes }) {
  obrigatorio(barbearia_id, "barbearia_id");
  obrigatorio(nome, "nome");

  try {
    const payload = {
      barbearia_id: String(barbearia_id),
      nome: String(nome).trim(),
      telefone: telefone ? String(telefone).trim() : null,
      email: email ? String(email).trim() : null,
      observacoes: observacoes ?? null,
      criado_em: new Date().toISOString(),
    };

    const created = await createDocument("clientes", ID.unique(), payload);
    return created;
  } catch (err) {
    console.error("Erro ao criar cliente:", err);
    throw new Error("Falha ao criar cliente. Verifique os dados e tente novamente.");
  }
}


/**
 * Atualiza um cliente existente
 * @param {string} clienteId - O ID do cliente
 * @param {Object} updates - Os dados atualizados do cliente
 * @returns {Promise<Object>} O cliente atualizado
 */
export async function atualizarCliente(clienteId, { nome, telefone, email, observacoes }) {
  obrigatorio(clienteId, "clienteId");
  try {
    const payload = {};
    if (nome !== undefined) payload.nome = String(nome).trim();
    if (telefone !== undefined) payload.telefone = telefone ? String(telefone).trim() : null;
    if (email !== undefined) payload.email = email ? String(email).trim() : null;
    if (observacoes !== undefined) payload.observacoes = observacoes;

    const updated = await updateDocument("clientes", clienteId, payload);
    return updated;
  } catch (err) {
    console.error("Erro ao atualizar cliente:", err);
    throw new Error("Falha ao atualizar cliente. Verifique os dados e tente novamente.");
  }
}

/**
 * Remove um cliente
 * @param {string} clienteId - O ID do cliente
 * @returns {Promise<void>}
 */
export async function removerCliente(clienteId) {
  obrigatorio(clienteId, "clienteId");
  try {
    await deleteDocument("clientes", clienteId);
  } catch (err) {
    console.error("Erro ao remover cliente:", err);
    throw new Error("Falha ao remover cliente. Tente novamente.");
  }
}