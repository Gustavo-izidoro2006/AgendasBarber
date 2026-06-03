export function criarPayloadAgendamento({
  barbearia,
  cliente,
  servico,
  data_agendamento,
  horario,
  observacoes,
  status = "pendente",
}) {
  if (!barbearia?.$id && !barbearia?.id) throw new Error("barbearia.$id (ou id) é obrigatório");
  if (!data_agendamento) throw new Error("data_agendamento é obrigatório");
  if (!horario) throw new Error("horario é obrigatório");

  const barbeariaId = barbearia.$id ?? barbearia.id;
  const clienteId = cliente?.$id ?? cliente?.id ?? null;
  const servicoId = servico?.$id ?? servico?.id ?? null;

  return {
    barbearia_id: String(barbeariaId),
    cliente_id: clienteId ? String(clienteId) : null,
    servico_id: servicoId ? String(servicoId) : null,
    data_agendamento,
    horario,
    status,
    observacoes: observacoes ?? null,
  };
}
