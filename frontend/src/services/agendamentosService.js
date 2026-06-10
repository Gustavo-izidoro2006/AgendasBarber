import { api } from '../lib/api';

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === '')
    throw new Error(`Campo obrigatório ausente: ${nome}`);
}

export async function listarAgendamentos(barbeariaId, filtros = {}) {
  obrigatorio(barbeariaId, 'barbeariaId');
  let url = `/agendamentos/index.php?barbearia_id=${barbeariaId}`;
  if (filtros.data) url += `&data=${filtros.data}`;
  return api.get(url);
}

export async function buscarAgendamentoPorId(agendamentoId) {
  obrigatorio(agendamentoId, 'agendamentoId');
  return api.get(`/agendamentos/index.php?id=${agendamentoId}`);
}

export async function criarAgendamento({
  barbearia_id,
  cliente_id,
  servico_id,
  data_agendamento,
  horario,
  observacoes,
  status = 'ativo',
}) {
  obrigatorio(barbearia_id, 'barbearia_id');
  obrigatorio(data_agendamento, 'data_agendamento');
  obrigatorio(horario, 'horario');
  return api.post('/agendamentos/criar.php', {
    barbearia_id,
    cliente_id: cliente_id ?? null,
    servico_id: servico_id ?? null,
    data_agendamento,
    horario,
    observacoes: observacoes ?? null,
    status,
  });
}

export async function atualizarAgendamento(agendamentoId, updates) {
  obrigatorio(agendamentoId, 'agendamentoId');
  return api.put('/agendamentos/atualizar.php', { id: agendamentoId, ...updates });
}

export async function removerAgendamento(agendamentoId) {
  obrigatorio(agendamentoId, 'agendamentoId');
  return atualizarAgendamento(agendamentoId, { status: 'cancelado' });
}
