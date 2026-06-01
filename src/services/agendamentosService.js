import { Query, ID } from "appwrite";
import {
  listCollection,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../lib/appwrite";

import { criarPayloadAgendamento } from "./agendamentosHelper";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

/**
 * Lista todos os agendamentos de uma barbearia
 * @param {string} barbeariaId
 * @param {Array} queries
 */
export async function listarAgendamentos(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    const queriesComFiltro = [Query.equal("barbearia_id", barbeariaId), ...queries];
    const resp = await listCollection("agendamentos", queriesComFiltro);
    const docs = resp?.documents ?? [];
    if (docs.length > 0) return docs;
  } catch { /* Relationship pode falhar com Query.equal */ }

  // Fallback: busca tudo e filtra no cliente
  try {
    const all = await listCollection("agendamentos", [Query.limit(100), ...queries]);
    return (all?.documents ?? []).filter(
      (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
    );
  } catch (err) {
    console.error("Erro ao listar agendamentos:", err);
    return [];
  }
}

/**
 * Busca um agendamento pelo ID
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
 * Payload do schema (multi-tenant) com relacionamentos por $id.
 */
export async function criarAgendamento({
  barbearia_id,
  cliente_id,
  servico_id,
  data_agendamento,
  horario,
  observacoes,
  status = "pendente",
}) {
  obrigatorio(barbearia_id, "barbearia_id");
  obrigatorio(data_agendamento, "data_agendamento");
  obrigatorio(horario, "horario");

  try {
    const payload = {
      ...criarPayloadAgendamento({
        barbearia: { $id: barbearia_id },
        cliente: cliente_id ? { $id: cliente_id } : null,
        servico: servico_id ? { $id: servico_id } : null,
        data_agendamento,
        horario,
        observacoes,
        status,
      }),
      criado_em: new Date().toISOString(),
    };

    // Ajuste: nosso helper retorna apenas campos do schema que importam.
    // Aqui persistimos na collection.
    const created = await createDocument("agendamentos", ID.unique(), payload);
    return created;
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    throw new Error("Falha ao criar agendamento. Verifique os dados e tente novamente.");
  }
}

/**
 * Atualiza um agendamento existente
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

