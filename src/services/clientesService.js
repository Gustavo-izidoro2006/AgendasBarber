import { listCollection, getDocument, createCollectionDocument, updateCollectionDocument, deleteCollectionDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

export async function listarClientes(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");

  const queriesComFiltro = [
    `equal(barbearia_id,"${barbeariaId}")`,
    ...queries,
  ];

  const resp = await listCollection("clientes", queriesComFiltro);
  return resp?.documents ?? [];
}

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

    const created = await createCollectionDocument("clientes", payload);
    return created;
  } catch (err) {
    console.error("Erro ao criar cliente:", err);
    throw new Error("Falha ao criar cliente. Verifique os dados e tente novamente.");
  }
}

export async function atualizarCliente(clienteId, { nome, telefone, email, observacoes }) {
  obrigatorio(clienteId, "clienteId");
  try {
    const payload = {};
    if (nome !== undefined) payload.nome = String(nome).trim();
    if (telefone !== undefined) payload.telefone = telefone ? String(telefone).trim() : null;
    if (email !== undefined) payload.email = email ? String(email).trim() : null;
    if (observacoes !== undefined) payload.observacoes = observacoes;

    const updated = await updateCollectionDocument("clientes", clienteId, payload);
    return updated;
  } catch (err) {
    console.error("Erro ao atualizar cliente:", err);
    throw new Error("Falha ao atualizar cliente. Verifique os dados e tente novamente.");
  }
}

export async function removerCliente(clienteId) {
  obrigatorio(clienteId, "clienteId");
  try {
    await deleteCollectionDocument("clientes", clienteId);
  } catch (err) {
    console.error("Erro ao remover cliente:", err);
    throw new Error("Falha ao remover cliente. Tente novamente.");
  }
}
