import { api } from '../lib/api';
export { buscarClientePorBarbeariaTelefone } from './clientesService';

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === '')
    throw new Error(`Campo obrigatório ausente: ${nome}`);
}

export async function buscarBarbeariaPorSlug(slug) {
  obrigatorio(slug, 'slug');
  return api.get(`/barbearias/index.php?slug=${slug}`);
}

export async function buscarServicosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, 'barbeariaId');
  return api.get(`/servicos/index.php?barbearia_id=${barbeariaId}`);
}

export async function buscarHorariosDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, 'barbeariaId');
  return api.get(`/horarios/index.php?barbearia_id=${barbeariaId}`);
}

export async function buscarConfiguracoesDaBarbearia(barbeariaId) {
  obrigatorio(barbeariaId, 'barbeariaId');
  try {
    return await api.get(`/configuracoes/index.php?barbearia_id=${barbeariaId}`);
  } catch {
    return null;
  }
}

export async function buscarHorariosOcupados(barbeariaId, data) {
  obrigatorio(barbeariaId, 'barbeariaId');
  obrigatorio(data, 'data');
  try {
    const agendamentos = await api.get(
      `/agendamentos/index.php?barbearia_id=${barbeariaId}&data=${data}`
    );
    return (agendamentos ?? []).map((a) => a.horario);
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
  });
}
