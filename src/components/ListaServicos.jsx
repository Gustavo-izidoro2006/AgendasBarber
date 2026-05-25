import { useState } from "react";

/**
 * Componente de listagem de serviços
 * @param {Object} props - Propriedades do componente
 * @param {Array<Object>} props.servicos - Lista de serviços
 * @param {Function} props.onEditar - Callback chamado ao editar
 * @param {Function} props.onRemover - Callback chamado ao remover
 * @param {Function} props.onAlternarStatus - Callback chamado ao alternar status
 * @param {boolean} props.carregando - Estado de carregamento
 */
export default function ListaServicos({
  servicos = [],
  onEditar,
  onRemover,
  onAlternarStatus,
  carregando = false,
}) {
  const [confirmacaoId, setConfirmacaoId] = useState(null);

  const handleConfirmarRemocao = (servicoId) => {
    setConfirmacaoId(servicoId);
  };

  const handleCancelarRemocao = () => {
    setConfirmacaoId(null);
  };

  const handleRemover = (servicoId) => {
    onRemover(servicoId);
    setConfirmacaoId(null);
  };

  const formatarMoeda = (valor) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  if (carregando && servicos.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Serviços</h2>
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.spinnerLarge}></div>
          <p style={styles.loadingText}>Carregando serviços...</p>
        </div>
      </div>
    );
  }

  if (servicos.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Serviços</h2>
        </div>
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>✂️</div>
          <h3 style={styles.emptyTitle}>Nenhum serviço cadastrado</h3>
          <p style={styles.emptyText}>
            Comece adicionando seu primeiro serviço para sua barbearia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          Serviços ({servicos.length})
        </h2>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Descrição</th>
              <th style={styles.th}>Valor</th>
              <th style={styles.th}>Duração</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((servico) => (
              <tr key={servico.$id || servico.id} style={styles.tr}>
                <td style={styles.td}>
                  <strong style={styles.servicoNome}>{servico.nome}</strong>
                </td>
                <td style={styles.td}>
                  <span style={styles.descricao}>
                    {servico.descricao?.length > 50
                      ? `${servico.descricao.substring(0, 50)}...`
                      : servico.descricao}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.valor}>{formatarMoeda(servico.valor)}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.duracao}>{servico.duracao} min</span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(servico.status === "ativo"
                        ? styles.statusAtivo
                        : styles.statusInativo),
                    }}
                  >
                    {servico.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    {confirmacaoId === (servico.$id || servico.id) ? (
                      <>
                        <button
                          onClick={() => handleRemover(servico.$id || servico.id)}
                          style={styles.buttonConfirm}
                          disabled={carregando}
                          title="Confirmar exclusão"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelarRemocao}
                          style={styles.buttonCancel}
                          disabled={carregando}
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditar(servico)}
                          style={styles.buttonEdit}
                          disabled={carregando}
                          title="Editar"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            onAlternarStatus(
                              servico.$id || servico.id,
                              servico.status === "inativo"
                            )
                          }
                          style={
                            servico.status === "ativo"
                              ? styles.buttonInactivate
                              : styles.buttonActivate
                          }
                          disabled={carregando}
                          title={
                            servico.status === "ativo"
                              ? "Desativar"
                              : "Ativar"
                          }
                        >
                          {servico.status === "ativo" ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="16 12 12 16 8 12" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleConfirmarRemocao(servico.$id || servico.id)
                          }
                          style={styles.buttonDelete}
                          disabled={carregando}
                          title="Excluir"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos
const styles = {
  container: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 20,
    color: "white",
    boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    margin: 0,
    color: "white",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.60)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tr: {
    transition: "background 0.2s",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: 14,
    verticalAlign: "middle",
  },
  servicoNome: {
    fontWeight: 800,
    color: "white",
  },
  descricao: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
  },
  valor: {
    fontWeight: 800,
    color: "#F2B705",
    fontSize: 15,
  },
  duracao: {
    color: "rgba(255,255,255,0.80)",
    fontWeight: 700,
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  statusAtivo: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.3)",
  },
  statusInativo: {
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.50)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  actions: {
    display: "flex",
    gap: 6,
    justifyContent: "flex-start",
  },
  buttonEdit: {
    padding: "8px",
    borderRadius: 10,
    border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(59,130,246,0.1)",
    color: "#60a5fa",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  buttonActivate: {
    padding: "8px",
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.3)",
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  buttonInactivate: {
    padding: "8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  buttonDelete: {
    padding: "8px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.3)",
    background: "rgba(239,68,68,0.1)",
    color: "#f87171",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  buttonConfirm: {
    padding: "8px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 14,
    transition: "all 0.2s",
  },
  buttonCancel: {
    padding: "8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 14,
    transition: "all 0.2s",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    gap: 16,
  },
  spinnerLarge: {
    width: 40,
    height: 40,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #FD366E",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: 700,
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "white",
    margin: 0,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 600,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 1.5,
  },
};