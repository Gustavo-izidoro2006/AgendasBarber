import { Query, ID } from "appwrite";
import { listCollection, getDocument, createDocument, updateDocument, deleteDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

/**
 * Lista todos os clientes de uma barbearia
 */
export async function listarClientes(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    const resp = await listCollection("clientes", [Query.equal("barbearia_id", barbeariaId), ...queries]);
    const docs = resp?.documents ?? [];
    if (docs.length > 0) return docs;
  } catch { /* Relationship pode falhar com Query.equal */ }

  // Fallback: busca tudo e filtra no cliente
  try {
    const all = await listCollection("clientes", [Query.limit(100), ...queries]);
    return (all?.documents ?? []).filter(
      (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
    );
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    return [];
  }
}

/**
 * Busca um cliente pelo ID
 */
export async function buscarClientePorId(clienteId) {
  obrigatorio(clienteId, "clienteId");
  try {
    return await getDocument("clientes", clienteId);
  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    throw new Error("Falha ao buscar cliente. Tente novamente.");
  }
}

/**
 * Busca um cliente existente por barbearia + telefone
 */
export async function buscarClientePorBarbeariaTelefone({ barbeariaId, telefone }) {
  obrigatorio(barbeariaId, "barbeariaId");
  obrigatorio(telefone, "telefone");

  try {
    const resp = await listCollection("clientes", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("telefone", String(telefone).trim()),
    ]);
    const found = resp?.documents?.[0];
    if (found) return found;
  } catch { /* Relationship pode falhar */ }

  // Fallback: busca todos e filtra no cliente
  try {
    const all = await listCollection("clientes", [Query.limit(100)]);
    return (all?.documents ?? []).find(
      (d) =>
        (d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId) &&
        String(d.telefone ?? "").trim() === String(telefone).trim()
    ) ?? null;
  } catch {
    return null;
  }
}

/**
 * Cria um novo cliente para uma barbearia
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
