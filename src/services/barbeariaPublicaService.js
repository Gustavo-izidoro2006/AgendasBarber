import { Query, ID } from "appwrite";
import { listCollection, createDocument, getDocument, databases, DB_ID, COLLECTIONS } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

export async function buscarBarbeariaPorSlug(slug) {
  obrigatorio(slug, "slug");
  const docs = await listCollection("barbearias", [
    Query.equal("slug", slug),
    Query.limit(1),
  ]);
  return docs?.documents?.[0] ?? null;
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");
  const all = await listCollection("servicos", [Query.limit(100)]);
  return (all?.documents ?? []).filter(s => {
    const id = typeof s.barbearia_id === "string" ? s.barbearia_id : s.barbearia_id?.$id;
    return id === barbeariaId && s.status === "ativo";
  });
}

export async function buscarHorariosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");
  const all = await listCollection("horarios", [Query.limit(200)]);
  return (all?.documents ?? []).filter(h => {
    const id = typeof h.barbearia_id === "string" ? h.barbearia_id : h.barbearia_id?.$id;
    return id === barbeariaId && (h.ativo === "true" || h.ativo === true);
  });
}

export async function buscarConfiguracoesDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");
  try {
    return await getDocument("configuracoes", barbeariaId);
  } catch (e) {
    if (e?.code === 404) return null;
    throw e;
  }
}

export async function buscarHorariosOcupados(barbeariaId, data) {
  obrigatorio(barbeariaId, "barbeariaId");
  obrigatorio(data, "data");
  try {
    const all = await listCollection("agendamentos", [
      Query.equal("data_agendamento", data),
      Query.limit(200),
    ]);
    return (all?.documents ?? [])
      .filter(a => {
        const id = typeof a.barbearia_id === "string" ? a.barbearia_id : a.barbearia_id?.$id;
        return id === barbeariaId && a.status === "ativo";
      })
      .map(a => a.horario);
  } catch {
    return [];
  }
}

export async function criarAgendamento({ barbearia_id, cliente_id, servico_id, data_agendamento, horario, observacoes }) {
  obrigatorio(barbearia_id, "barbearia_id");
  obrigatorio(data_agendamento, "data_agendamento");
  obrigatorio(horario, "horario");

  return createDocument("agendamentos", ID.unique(), {
    barbearia_id: String(barbearia_id),
    cliente_id: cliente_id ? String(cliente_id) : null,
    servico_id: servico_id ? String(servico_id) : null,
    data_agendamento,
    horario,
    observacoes: observacoes ?? null,
    status: "ativo",
    criado_em: new Date().toISOString(),
  });
}
