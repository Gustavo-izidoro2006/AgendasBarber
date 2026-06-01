import { Query, ID } from "appwrite";
import { listCollection, getDocument, createDocument, updateDocument, deleteDocument, DB_ID, COLLECTIONS } from "../lib/appwrite";

/**
 * Valida se um valor é obrigatório
 * @param {any} valor - O valor a ser validado
 * @param {string} nome - O nome do campo para mensagem de erro
 * @throws {Error} Se o valor for ausente ou vazio
 */
function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

/**
 * Valida os dados de um serviço antes de criar ou atualizar
 * @param {Object} dados - Os dados do serviço
 * @param {boolean} isInclusiveBarbeariaId - Se deve validar o campo barbearia_id
 * @returns {Object} Os dados validados
 */
function validarDadosServico(dados, isInclusiveBarbeariaId = true) {
  obrigatorio(dados.nome, "nome");
  
  // descricao é opcional — string vazia é aceita
  
  if (dados.valor !== undefined && dados.valor !== null && dados.valor !== "") {
    const valorNum = Number(dados.valor);
    if (isNaN(valorNum) || valorNum < 0) {
      throw new Error("O valor deve ser um número positivo");
    }
  }
  
  if (dados.duracao !== undefined && dados.duracao !== null && dados.duracao !== "") {
    const duracaoNum = Number(dados.duracao);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      throw new Error("A duração deve ser um número positivo (em minutos)");
    }
  }

  if (isInclusiveBarbeariaId) {
    obrigatorio(dados.barbearia_id, "barbearia_id");
  }

  // Valida status se presente
  if (dados.status !== undefined) {
    const statusValidos = ["ativo", "inativo"];
    if (!statusValidos.includes(dados.status)) {
      throw new Error(`Status inválido. Use: ${statusValidos.join(", ")}`);
    }
  }

  return {
    nome: String(dados.nome).trim(),
    descricao: dados.descricao ? String(dados.descricao).trim() : "",
    valor: dados.valor ? String(dados.valor).trim() : "",
    duracao: dados.duracao ? String(dados.duracao).trim() : "",
    status: dados.status || "ativo",
    barbearia_id: isInclusiveBarbeariaId ? String(dados.barbearia_id).trim() : undefined,
  };
}

/**
 * Lista todos os serviços de uma barbearia
 * @param {string} barbeariaId - O ID da barbearia
 * @param {Array<string>} queries - Queries adicionais do Appwrite (opcional)
 * @returns {Promise<Array<Object>>} Lista de serviços
 */
export async function listarServicos(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    // Tenta query direta primeiro
    const queriesComFiltro = [
      Query.equal("barbearia_id", barbeariaId),
      ...queries,
    ];
    const resposta = await listCollection("servicos", queriesComFiltro);
    const docs = resposta?.documents ?? [];
    if (docs.length > 0) return docs;
  } catch { /* ignora — Relationship pode falhar com Query.equal */ }

  // Fallback: busca tudo e filtra no cliente (Relationship)
  try {
    const all = await listCollection("servicos", [Query.limit(100), ...queries]);
    return (all?.documents ?? []).filter(
      (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
    );
  } catch (err) {
    console.error("Erro ao listar serviços:", err);
    return [];
  }
}

/**
 * Busca um serviço pelo ID
 * @param {string} servicoId - O ID do serviço
 * @returns {Promise<Object|null>} O serviço encontrado ou null
 */
export async function buscarServicoPorId(servicoId) {
  obrigatorio(servicoId, "servicoId");

  try {
    const resp = await getDocument("servicos", servicoId);
    return resp ?? null;
  } catch (erro) {
    console.error("Erro ao buscar serviço:", erro);
    throw new Error("Falha ao buscar serviço. Tente novamente.");
  }
}

/**
 * Cria um novo serviço
 * @param {Object} dados - Os dados do serviço
 * @returns {Promise<Object>} O serviço criado
 */
export async function criarServico(dados) {
  const dadosValidados = validarDadosServico(dados);

  try {
    const payload = {
      ...dadosValidados,
      criado_em: new Date().toISOString(),
    };
    const criado = await createDocument("servicos", ID.unique(), payload);
    return criado;
  } catch (erro) {
    // 409 = documento já existe (onboarding reexecutado) — ignora silenciosamente
    if (erro?.code === 409) return null;
    console.error("Erro ao criar serviço:", erro);
    throw new Error("Falha ao criar serviço. Verifique os dados e tente novamente.");
  }
}

/**
 * Atualiza um serviço existente
 * @param {string} servicoId - O ID do serviço
 * @param {Object} dados - Os dados atualizados do serviço
 * @returns {Promise<Object>} O serviço atualizado
 */
export async function atualizarServico(servicoId, dados) {
  obrigatorio(servicoId, "servicoId");

  // Para atualização, não validamos barbearia_id pois não deve ser alterado
  const dadosValidados = validarDadosServico(dados, false);

  try {
    const atualizado = await updateDocument(
      "servicos",
      servicoId,
      dadosValidados
    );
    return atualizado;
  } catch (erro) {
    console.error("Erro ao atualizar serviço:", erro);
    throw new Error("Falha ao atualizar serviço. Verifique os dados e tente novamente.");
  }
}

/**
 * Remove um serviço
 * @param {string} servicoId - O ID do serviço
 * @returns {Promise<void>}
 */
export async function removerServico(servicoId) {
  obrigatorio(servicoId, "servicoId");

  try {
    await deleteDocument("servicos", servicoId);
  } catch (erro) {
    console.error("Erro ao remover serviço:", erro);
    throw new Error("Falha ao remover serviço. Tente novamente.");
  }
}

/**
 * Ativa ou desativa um serviço
 * @param {string} servicoId - O ID do serviço
 * @param {boolean} ativo - Se deve ativar (true) ou desativar (false)
 * @returns {Promise<Object>} O serviço atualizado
 */
export async function alternarStatusServico(servicoId, ativo) {
  obrigatorio(servicoId, "servicoId");

  try {
    const novoStatus = ativo ? "ativo" : "inativo";
    const atualizado = await updateDocument(
      "servicos",
      servicoId,
      { status: novoStatus }
    );
    return atualizado;
  } catch (erro) {
    console.error("Erro ao alternar status do serviço:", erro);
    throw new Error("Falha ao alternar status do serviço. Tente novamente.");
  }
}