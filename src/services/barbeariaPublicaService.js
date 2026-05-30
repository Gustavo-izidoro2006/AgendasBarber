import { Query, ID } from "appwrite";
import { listCollection, createDocument, databases, DB_ID, COLLECTIONS } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

export async function buscarBarbeariaPorSlug(slug) {
  obrigatorio(slug, "slug");

  const docs = await listCollection("barbearias", [
    Query.equal("slug", slug),
    Query.equal("status", "ativo"),
  ]);

  return docs?.documents?.[0] ?? null;
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    // Tenta com Query.equal (funciona se barbearia_id for string)
    const resp = await listCollection("servicos", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("status", "ativo"),
    ]);
    if (resp?.documents?.length > 0) return resp.documents;
  } catch { /* continua para fallback */ }

  // Fallback: busca todos e filtra no cliente (cobre caso Relationship)
  const todos = await listCollection("servicos", [Query.limit(100)]);
  return (todos?.documents ?? []).filter(
    (s) =>
      (s.barbearia_id === barbeariaId || s.barbearia_id?.$id === barbeariaId) &&
      s.status === "ativo"
  );
}

export async function buscarHorariosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    const resp = await listCollection("horarios", [
      Query.equal("barbearia_id", barbeariaId),
    ]);
    if (resp?.documents?.length > 0) return resp.documents;
  } catch { /* continua para fallback */ }

  // Fallback com filtro no cliente
  const todos = await listCollection("horarios", [Query.limit(100)]);
  return (todos?.documents ?? []).filter(
    (h) => h.barbearia_id === barbeariaId || h.barbearia_id?.$id === barbeariaId
  );
}

export async function buscarHorariosOcupados(barbeariaId, data) {
  obrigatorio(barbeariaId, "barbeariaId");
  obrigatorio(data, "data");

  try {
    const resp = await listCollection("agendamentos", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("data_agendamento", data),
      Query.equal("status", "ativo"),
    ]);
    return (resp?.documents ?? []).map((a) => a.horario);
  } catch {
    return [];
  }
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

  const created = await createDocument("agendamentos", ID.unique(), payload);
  return created;
}
