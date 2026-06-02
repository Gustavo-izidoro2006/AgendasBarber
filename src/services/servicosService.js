import { Query, ID } from "appwrite";
import { listCollection, getDocument, updateDocument, deleteDocument, upsertById, DB_ID, COLLECTIONS, databases } from "../lib/appwrite";

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === "") {
    throw new Error(`Campo obrigatório ausente: ${nome}`);
  }
}

function validarDadosServico(dados, incluirBarbeariaId = true) {
  const requerNome = incluirBarbeariaId || dados.nome !== undefined;
  if (requerNome) obrigatorio(dados.nome, "nome");
  if (incluirBarbeariaId) obrigatorio(dados.barbearia_id, "barbearia_id");

  const validados = {};
  if (dados.nome !== undefined) validados.nome = String(dados.nome).trim();
  if (incluirBarbeariaId) validados.barbearia_id = String(dados.barbearia_id);

  if (dados.descricao != null && dados.descricao !== "") {
    validados.descricao = String(dados.descricao);
  } else if (incluirBarbeariaId) {
    validados.descricao = " ";
  }

  if (dados.valor != null && dados.valor !== "") {
    const n = Number(dados.valor);
    if (!isNaN(n) && n >= 0) validados.valor = String(n);
  }

  if (dados.duracao != null && dados.duracao !== "") {
    validados.duracao = String(dados.duracao);
  }

  if (dados.status) validados.status = dados.status;
  if (dados.criado_em) validados.criado_em = dados.criado_em;

  return validados;
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, "barbeariaId");

  // Tenta query direta primeiro
  try {
    const resp = await listCollection("servicos", [
      Query.equal("barbearia_id", barbeariaId),
      Query.equal("status", "ativo"),
      Query.limit(50),
    ]);
    if (resp?.documents?.length > 0) return resp.documents;
  } catch { /* continua para fallback */ }

  // Fallback: busca todos e filtra no cliente (Relationship limitation)
  const all = await listCollection("servicos", [Query.limit(100)]);
  return (all?.documents ?? []).filter(
    d => (d.barbearia_id === barbeariaId || d.barbearia_id?.$id === barbeariaId) && d.status === "ativo"
  );
}

export async function listarServicos(barbeariaId) {
  return buscarServicosDaBarbearia(barbeariaId);
}

export async function buscarServicoPorId(servicoId) {
  obrigatorio(servicoId, "servicoId");
  return getDocument("servicos", servicoId);
}

export async function criarServico(dados) {
  const validados = validarDadosServico(dados);
  const payload = { ...validados, criado_em: new Date().toISOString() };

  // Usa upsertById com ID fornecido (determinístico) ou cria novo
  if (dados._id) {
    return upsertById("servicos", dados._id, payload);
  }

  // Fallback: cria com ID único
  return databases.createDocument(DB_ID, COLLECTIONS.servicos, ID.unique(), payload);
}

export async function atualizarServico(servicoId, dados) {
  obrigatorio(servicoId, "servicoId");
  const validados = validarDadosServico(dados, false);
  return updateDocument("servicos", servicoId, validados);
}

export async function alternarStatusServico(servicoId, novoStatus) {
  obrigatorio(servicoId, "servicoId");
  const statusValor = novoStatus ? "ativo" : "inativo";
  return atualizarServico(servicoId, { status: statusValor });
}

export async function deletarServico(servicoId) {
  obrigatorio(servicoId, "servicoId");
  return deleteDocument("servicos", servicoId);
}

export { deletarServico as removerServico };
