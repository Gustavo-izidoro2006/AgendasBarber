import { Query } from "appwrite";
import { listCollection, getDocument, createDocument, updateDocument, deleteDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

/**
 * Lista todos os agendamentos de uma barbearia
 * @param {string} barbeariaId - O ID da barbearia
 * @param {Array} queries - Queries adicionais do Appwrite (opcional)
 * @returns {Promise<Array<Object>>} Lista de agendamentos
 */
export async function listarAgendamentos(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");
  const queriesComFiltro = [
    Query.equal("barbearia_id", barbeariaId),
    ...queries,
  ];
  const resp = await listCollection("agendamentos", queriesComFiltro);
  return resp?.documents ?? [];
}

/**
 * Busca um agendamento pelo ID
 * @param {string} agendamentoId - O ID do agendamento
 * @returns {Promise<Object|null>} O agendamento encontrado ou null
 */
export async function buscarAgendamentoPorId(agendamentoId) {
  obrigatorio(agendamentoId, "agendamentoId");
  try {
    const resp = await getDocument("agendamentos", agendamentoId);
    return resp ?? null;
  } catch (err) {
    console.error("Erro ao buscar agendamento:", err);
    throw new Error("Falha ao buscar agendamento. Tente novamente.");
  }
}

/**
 * Cria um novo agendamento
 * @param {Object} params - Os dados do agendamento
 * @returns {Promise<Object>} O agendamento criado
 */
export async function criarAgendamento({ 
  barbearia_id, 
  cliente_id, 
  servico_id, 
  data_agendamento, 
  horario, 
  observacoes,
  cliente_nome,
  servico_nome,
  servico_valor 
}) {
  obrigatorio(barbearia_id, "barbearia_id");
  obrigatorio(data_agendamento, "data_agendamento");
  obrigatorio(horario, "horario");

  try {
    const payload = {
      barbearia_id: String(barbearia_id),
      cliente_id: cliente_id ? String(cliente_id) : null,
      servico_id: servico_id ? String(servico_id) : null,
      cliente_nome: cliente_nome || null,
      servico_nome: servico_nome || null,
      servico_valor: servico_valor || null,
      data_agendamento,
      horario,
      observacoes: observacoes ?? null,
      status: "ativo",
      criado_em: new Date().toISOString(),
    };

    const created = await createDocument("agendamentos", "unique()", payload);
    return created;
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    throw new Error("Falha ao criar agendamento. Verifique os dados e tente novamente.");
  }
}

/**
 * Atualiza um agendamento existente
 * @param {string} agendamentoId - O ID do agendamento
 * @param {Object} updates - Os dados atualizados do agendamento
 * @returns {Promise<Object>} O agendamento atualizado
 */
export async function atualizarAgendamento(agendamentoId, updates) {
  obrigatorio(agendamentoId, "agendamentoId");
  try {
    const updated = await updateDocument("agendamentos", agendamentoId, updates);
    return updated;
  } catch (err) {
    console.error("Erro ao atualizar agendamento:", err);
    throw new Error("Falha ao atualizar agendamento. Tente novamente.");
  }
}

/**
 * Remove um agendamento
 * @param {string} agendamentoId - O ID do agendamento
 * @returns {Promise<void>}
 */
export async function removerAgendamento(agendamentoId) {
  obrigatorio(agendamentoId, "agendamentoId");
  try {
    await deleteDocument("agendamentos", agendamentoId);
  } catch (err) {
    console.error("Erro ao remover agendamento:", err);
    throw new Error("Falha ao remover agendamento. Tente novamente.");
  }
}