import { api } from '../lib/api';

function obrigatorio(valor, nome) {
  if (valor === undefined || valor === null || valor === '')
    throw new Error(`Campo obrigatório ausente: ${nome}`);
}

export async function listarClientes(barbeariaId) {
  obrigatorio(barbeariaId, 'barbeariaId');
  return api.get(`/clientes/index.php?barbearia_id=${barbeariaId}`);
}

export async function buscarClientePorId(clienteId) {
  obrigatorio(clienteId, 'clienteId');
  return api.get(`/clientes/index.php?id=${clienteId}`);
}

export async function buscarClientePorBarbeariaTelefone({ barbeariaId, telefone }) {
  obrigatorio(barbeariaId, 'barbeariaId');
  obrigatorio(telefone, 'telefone');
  try {
    return await api.get(
      `/clientes/buscar.php?barbearia_id=${barbeariaId}&telefone=${encodeURIComponent(telefone)}`
    );
  } catch {
    return null;
  }
}

export async function criarCliente({ barbearia_id, nome, telefone, email, observacoes }) {
  obrigatorio(barbearia_id, 'barbearia_id');
  obrigatorio(nome, 'nome');
  return api.post('/clientes/criar.php', {
    barbearia_id,
    nome: String(nome).trim(),
    telefone: telefone ? String(telefone).trim() : null,
    email: email ? String(email).trim() : null,
    observacoes: observacoes ?? null,
  });
}

export async function atualizarCliente(clienteId, { nome, telefone, email, observacoes }) {
  obrigatorio(clienteId, 'clienteId');
  return api.put('/clientes/atualizar.php', {
    id: clienteId,
    ...(nome !== undefined && { nome: String(nome).trim() }),
    ...(telefone !== undefined && { telefone: telefone ? String(telefone).trim() : null }),
    ...(email !== undefined && { email: email ? String(email).trim() : null }),
    ...(observacoes !== undefined && { observacoes }),
  });
}

export async function removerCliente(clienteId) {
  obrigatorio(clienteId, 'clienteId');
  return api.delete(`/clientes/deletar.php?id=${clienteId}`);
}
