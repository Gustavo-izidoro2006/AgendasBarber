import { Query, ID } from "appwrite";
import { listCollection, createDocument, databases, DB_ID, COLLECTIONS } from "../lib/appwrite";
export { buscarClientePorBarbeariaTelefone } from "../services/clientesService";

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
    const resp = await listCollection("servicos", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("status", "ativo"),
    ]);
    if (resp?.documents?.length > 0) return resp.documents;
  } catch { /* Relationship pode falhar */ }

  // Fallback: busca tudo e filtra no cliente
  try {
    const todos = await listCollection("servicos", [Query.limit(100)]);
    return (todos?.documents ?? []).filter(
      (s) =>
        (s.barbearia_id === barbeariaId || s.barbearia_id?.$id === barbeariaId) &&
        s.status === "ativo"
    );
  } catch (err) {
    console.error("Erro ao buscar serviços:", err);
    return [];
  }
}

export async function buscarHorariosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");

  try {
    const resp = await listCollection("horarios", [
      Query.equal("barbearia_id", barbeariaId),
    ]);
    if (resp?.documents?.length > 0) return resp.documents;
  } catch { /* Relationship pode falhar */ }

  // Fallback
  try {
    const todos = await listCollection("horarios", [Query.limit(100)]);
    return (todos?.documents ?? []).filter(
      (h) => h.barbearia_id === barbeariaId || h.barbearia_id?.$id === barbeariaId
    );
  } catch {
    return [];
  }
}

export async function buscarConfiguracoesDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");
  try {
    const resp = await listCollection("configuracoes", [Query.limit(25)]);
    const doc = (resp?.documents ?? []).find(
      (d) => d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId
    );
    return doc ?? null;
  } catch {
    return null;
  }
}

export async function buscarHorariosOcupados(barbeariaId, data) {
  obrigatorio(barbeariaId, "barbeariaId");
  obrigatorio(data, "data");

  try {
    const resp = await listCollection("agendamentos", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("data_agendamento", data),
      Query.notEqual("status", "cancelado"),
    ]);
    const docs = resp?.documents ?? [];
    if (docs.length > 0) return docs.map((a) => a.horario);
  } catch { /* Relationship pode falhar */ }

  // Fallback
  try {
    const all = await listCollection("agendamentos", [Query.limit(200)]);
    return (all?.documents ?? [])
      .filter(
        (a) =>
          (a.barbearia_id === barbeariaId || a.barbearia_id?.$id === barbeariaId) &&
          a.data_agendamento &&
          a.data_agendamento.substring(0, 10) === data &&
          a.status !== "cancelado"
      )
      .map((a) => a.horario);
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
    status: "pendente",
    criado_em: new Date().toISOString(),
  };

  const created = await createDocument("agendamentos", ID.unique(), payload);
  return created;
}
