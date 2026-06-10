import { api } from '../lib/api';

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === '')
    throw new Error(`Campo obrigatório ausente: ${nome}`);
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, 'barbeariaId');
  return api.get(`/servicos/index.php?barbearia_id=${barbeariaId}`);
}

export async function listarServicos(barbeariaId) {
  return buscarServicosDaBarbearia(barbeariaId);
}

export async function buscarServicoPorId(servicoId) {
  obrigatorio(servicoId, 'servicoId');
  return api.get(`/servicos/index.php?id=${servicoId}`);
}

export async function criarServico(dados) {
  obrigatorio(dados.barbearia_id, 'barbearia_id');
  obrigatorio(dados.nome, 'nome');
  return api.post('/servicos/criar.php', dados);
}

export async function atualizarServico(servicoId, dados) {
  obrigatorio(servicoId, 'servicoId');
  return api.put('/servicos/atualizar.php', { id: servicoId, ...dados });
}

export async function alternarStatusServico(servicoId, novoStatus) {
  obrigatorio(servicoId, 'servicoId');
  const status = novoStatus ? 'ativo' : 'inativo';
  return atualizarServico(servicoId, { status });
}

export async function deletarServico(servicoId) {
  obrigatorio(servicoId, 'servicoId');
  return api.delete(`/servicos/deletar.php?id=${servicoId}`);
}

export { deletarServico as removerServico };
