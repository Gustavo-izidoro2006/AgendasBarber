import { useEffect, useState } from "react";

/**
 * Componente de formulário para criar/editar serviços
 * @param {Object} props - Propriedades do componente
 * @param {Object|null} props.servico - Serviço sendo editado (null para criação)
 * @param {string} props.barbeariaId - ID da barbearia
 * @param {Function} props.onSalvar - Callback chamado ao salvar
 * @param {Function} props.onCancelar - Callback chamado ao cancelar
 * @param {boolean} props.carregando - Estado de carregamento
 */
export default function FormServico({
  servico,
  barbeariaId,
  onSalvar,
  onCancelar,
  carregando = false,
}) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor: "",
    duracao: "",
    status: "ativo",
  });

  const [erros, setErros] = useState({});

  // Preenche o formulário quando estiver editando
  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome || "",
        descricao: servico.descricao || "",
        valor: String(servico.valor || ""),
        duracao: String(servico.duracao || ""),
        status: servico.status || "ativo",
      });
    } else {
      // Reseta para criação
      setFormData({
        nome: "",
        descricao: "",
        valor: "",
        duracao: "",
        status: "ativo",
      });
    }
    setErros({});
  }, [servico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpa erro do campo ao digitar
    if (erros[name]) {
      setErros((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }

    if (!formData.descricao.trim()) {
      novosErros.descricao = "Descrição é obrigatória";
    }

    if (!formData.valor || Number(formData.valor) < 0) {
      novosErros.valor = "Valor não pode ser vazio";
    }

    if (!formData.duracao || Number(formData.duracao) <= 0) {
      novosErros.duracao = "Duração deve ser maior que zero";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const dadosParaSalvar = {
      ...formData,
      barbearia_id: barbeariaId,
      // Mantém como string já que o banco armazena como text
    };

    onSalvar(dadosParaSalvar);
  };

  const isEditing = !!servico;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {isEditing ? "Editar Serviço" : "Novo Serviço"}
        </h2>
      </div>

      <div style={styles.grid}>
        {/* Nome */}
        <div style={styles.field}>
          <label style={styles.label} htmlFor="nome">
            Nome *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={carregando}
            placeholder="Ex: Corte de Cabelo"
            style={{
              ...styles.input,
              ...(erros.nome ? styles.inputError : {}),
            }}
          />
          {erros.nome && <span style={styles.errorText}>{erros.nome}</span>}
        </div>

        {/* Descrição */}
        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label} htmlFor="descricao">
            Descrição *
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            disabled={carregando}
            placeholder="Descreva o serviço..."
            rows={3}
            style={{
              ...styles.input,
              ...styles.textarea,
              ...(erros.descricao ? styles.inputError : {}),
            }}
          />
          {erros.descricao && (
            <span style={styles.errorText}>{erros.descricao}</span>
          )}
        </div>

        {/* Valor */}
        <div style={styles.field}>
          <label style={styles.label} htmlFor="valor">
            Valor (R$) *
          </label>
          <input
            type="number"
            id="valor"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            disabled={carregando}
            placeholder="0.00"
            step="0.01"
            min="0"
            style={{
              ...styles.input,
              ...(erros.valor ? styles.inputError : {}),
            }}
          />
          {erros.valor && <span style={styles.errorText}>{erros.valor}</span>}
        </div>

        {/* Duração */}
        <div style={styles.field}>
          <label style={styles.label} htmlFor="duracao">
            Duração (minutos) *
          </label>
          <input
            type="number"
            id="duracao"
            name="duracao"
            value={formData.duracao}
            onChange={handleChange}
            disabled={carregando}
            placeholder="30"
            min="1"
            style={{
              ...styles.input,
              ...(erros.duracao ? styles.inputError : {}),
            }}
          />
          {erros.duracao && (
            <span style={styles.errorText}>{erros.duracao}</span>
          )}
        </div>

        {/* Status */}
        <div style={styles.field}>
          <label style={styles.label} htmlFor="status">
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={carregando}
            style={styles.input}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Ações */}
      <div style={styles.actions}>
        <button
          type="button"
          onClick={onCancelar}
          disabled={carregando}
          style={styles.buttonSecondary}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={carregando}
          style={{
            ...styles.buttonPrimary,
            ...(carregando ? styles.buttonDisabled : {}),
          }}
        >
          {carregando ? (
            <span style={styles.loading}>
              <span style={styles.spinner}></span>
              Salvando...
            </span>
          ) : isEditing ? (
            "Atualizar"
          ) : (
            "Criar"
          )}
        </button>
      </div>
    </form>
  );
}

// Estilos
const styles = {
  form: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 20,
    color: "white",
    boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    margin: 0,
    color: "white",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    resize: "vertical",
    minHeight: 60,
  },
  inputError: {
    borderColor: "#FD366E",
    boxShadow: "0 0 0 2px rgba(253,54,110,0.2)",
  },
  errorText: {
    fontSize: 12,
    color: "#FD366E",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  buttonPrimary: {
    padding: "12px 24px",
    borderRadius: 14,
    border: "none",
    background: "#FD366E",
    color: "white",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  buttonSecondary: {
    padding: "12px 24px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

// Adiciona keyframes para o spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);