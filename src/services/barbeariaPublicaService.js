import { listCollection, createCollectionDocument } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

export async function buscarBarbeariaPorSlug(slug) {
  obrigatorio(slug, "slug");

  const docs = await listCollection("barbearias", [
    `equal(slug,"${slug}")`,
    `equal(status,"ativo")`,
  ]);

  return docs?.documents?.[0] ?? null;
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");

  const resp = await listCollection("servicos", [
    `equal(barbearia_id,"${barbeariaId}")`,
  ]);

  return resp?.documents ?? [];
}

export async function criarAgendamento({
  barbearia_id,
  cliente_id,
  servico_id,
  data_agendamento,
  horario,
  observacoes,
}) {
  obrigatorio(barbearia_id, "barbearia_id");
  // cliente_id e servico_id podem ser opcionais (reservas por nome)
  obrigatorio(data_agendamento, "data_agendamento");
  obrigatorio(horario, "horario");

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
}