import { listCollection, getDocument, createCollectionDocument, updateCollectionDocument, deleteCollectionDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

export async function listarAgendamentos(barbeariaId, queries = []) {
  obrigatorio(barbeariaId, "barbeariaId");
  const queriesComFiltro = [
    `equal(barbearia_id,"${barbeariaId}")`,
    ...queries,
  ];
  const resp = await listCollection("agendamentos", queriesComFiltro);
  return resp?.documents ?? [];
}

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

export async function criarAgendamento({ barbearia_id, cliente_id, servico_id, data_agendamento, horario, observacoes }) {
  obrigatorio(barbearia_id, "barbearia_id");
  obrigatorio(data_agendamento, "data_agendamento");
  obrigatorio(horario, "horario");

  try {
    const payload = {
      barbearia_id: String(barbearia_id),
      cliente_id: cliente_id ? String(cliente_id) : null,
      servico_id: servico_id ? String(servico_id) : null,
      data_agendamento,
      horario,
      observacoes: observacoes ?? null,
      status: "ativo",
      criado_em: new Date().toISOString(),
    };

    const created = await createCollectionDocument("agendamentos", payload);
    return created;
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    throw new Error("Falha ao criar agendamento. Verifique os dados e tente novamente.");
  }
}

export async function atualizarAgendamento(agendamentoId, updates) {
  obrigatorio(agendamentoId, "agendamentoId");
  try {
    const updated = await updateCollectionDocument("agendamentos", agendamentoId, updates);
    return updated;
  } catch (err) {
    console.error("Erro ao atualizar agendamento:", err);
    throw new Error("Falha ao atualizar agendamento. Tente novamente.");
  }
}

export async function removerAgendamento(agendamentoId) {
  obrigatorio(agendamentoId, "agendamentoId");
  try {
    await deleteCollectionDocument("agendamentos", agendamentoId);
  } catch (err) {
    console.error("Erro ao remover agendamento:", err);
    throw new Error("Falha ao remover agendamento. Tente novamente.");
  }
}
