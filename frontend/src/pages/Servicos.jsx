import { useCallback, useEffect, useState } from "react";
import { useSessaoBarbearia } from "../contextos/SessaoBarbeariaContexto";
import {
  listarServicos,
  criarServico,
  atualizarServico,
  removerServico,
  alternarStatusServico,
} from "../services/servicosService";
import FormServico from "../components/FormServico";
import ListaServicos from "../components/ListaServicos";

/**
 * Página de gerenciamento de serviços
 * CRUD completo de serviços usando Appwrite Database
 */
export default function Servicos() {
  const { barbearia } = useSessaoBarbearia();

  // Estados
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Carrega serviços da barbearia
  const carregarServicos = useCallback(async () => {
    if (!!barbearia?.id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const barbeariaId = barbearia.id;
      const lista = await listarServicos(barbeariaId);
      setServicos(lista);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      setErro("Falha ao carregar serviços. Tente novamente.");
      setServicos([]);
    } finally {
      setCarregando(false);
    }
  }, [barbearia]);

  useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  // Limpa mensagem após alguns segundos
  useEffect(() => {
    if (mensagem) {
      const timer = setTimeout(() => setMensagem(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensagem]);

  // Limpa erro após alguns segundos
  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => setErro(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

  // Handler: Criar novo serviço
  const handleCriar = useCallback(async (dados) => {
    setSalvando(true);
    setErro(null);

    try {
      const novoServico = await criarServico(dados);
      setServicos((prev) => [...prev, novoServico]);
      setMostrarFormulario(false);
      setMensagem("Serviço criado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar serviço:", err);
      setErro(err.message || "Falha ao criar serviço.");
    } finally {
      setSalvando(false);
    }
  }, []);

  // Handler: Editar serviço
  const handleEditar = useCallback(async (dados) => {
    if (!servicoEditando) return;

    setSalvando(true);
    setErro(null);

    try {
      const servicoId = servicoEditando.id;
      const servicoAtualizado = await atualizarServico(servicoId, dados);
      setServicos((prev) =>
        prev.map((s) => {
          const id = s.id;
          const editId = servicoId;
          return id === editId ? servicoAtualizado : s;
        })
      );
      setServicoEditando(null);
      setMostrarFormulario(false);
      setMensagem("Serviço atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao editar serviço:", err);
      setErro(err.message || "Falha ao editar serviço.");
    } finally {
      setSalvando(false);
    }
  }, [servicoEditando]);

  // Handler: Remover serviço
  const handleRemover = useCallback(async (servicoId) => {
    setSalvando(true);
    setErro(null);

    try {
      await removerServico(servicoId);
      setServicos((prev) =>
        prev.filter((s) => (s.id) !== servicoId)
      );
      setMensagem("Serviço removido com sucesso!");
    } catch (err) {
      console.error("Erro ao remover serviço:", err);
      setErro(err.message || "Falha ao remover serviço.");
    } finally {
      setSalvando(false);
    }
  }, []);

  // Handler: Alternar status do serviço
  const handleAlternarStatus = useCallback(async (servicoId, novoStatus) => {
    setSalvando(true);
    setErro(null);

    try {
      const servicoAtualizado = await alternarStatusServico(servicoId, novoStatus);
      setServicos((prev) =>
        prev.map((s) => {
          const id = s.id;
          return id === servicoId ? servicoAtualizado : s;
        })
      );
      setMensagem(
        `Serviço ${novoStatus ? "ativado" : "desativado"} com sucesso!`
      );
    } catch (err) {
      console.error("Erro ao alternar status:", err);
      setErro(err.message || "Falha ao alternar status do serviço.");
    } finally {
      setSalvando(false);
    }
  }, []);

  // Handler: Selecionar serviço para edição
  const handleSelecionarEdicao = useCallback((servico) => {
    setServicoEditando(servico);
    setMostrarFormulario(true);
    setErro(null);
  }, []);

  // Handler: Cancelar formulário
  const handleCancelarFormulario = useCallback(() => {
    setServicoEditando(null);
    setMostrarFormulario(false);
    setErro(null);
  }, []);

  // Handler: Mostrar formulário de criação
  const handleNovoServico = useCallback(() => {
    setServicoEditando(null);
    setMostrarFormulario(true);
    setErro(null);
  }, []);

  // Verifica se tem barbearia
  const barbeariaId = barbearia?.id;

  if (!barbeariaId) {
    return (
      <div style={styles.container}>
        <div style={styles.alertContainer}>
          <div style={styles.alertWarning}>
            <span style={styles.alertIcon}>⚠️</span>
            <div>
              <strong style={styles.alertTitle}>Barbearia não configurada</strong>
              <p style={styles.alertText}>
                Você precisa configurar sua barbearia antes de gerenciar serviços.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.pageTitle}>Gerenciar Serviços</h1>
            <p style={styles.pageSubtitle}>
              Cadastre e gerencie os serviços da sua barbearia
            </p>
          </div>
          {!mostrarFormulario && (
            <button
              onClick={handleNovoServico}
              disabled={salvando}
              style={styles.buttonNovo}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Serviço
            </button>
          )}
        </div>
      </div>

      {/* Mensagens de feedback */}
      {mensagem && (
        <div style={styles.messageContainer}>
          <div style={styles.messageSuccess}>
            <span style={styles.messageIcon}>✓</span>
            {mensagem}
          </div>
        </div>
      )}

      {erro && (
        <div style={styles.messageContainer}>
          <div style={styles.messageError}>
            <span style={styles.messageIconError}>!</span>
            {erro}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div style={styles.content}>
        {mostrarFormulario ? (
          <FormServico
            servico={servicoEditando}
            barbeariaId={barbeariaId}
            onSalvar={servicoEditando ? handleEditar : handleCriar}
            onCancelar={handleCancelarFormulario}
            carregando={salvando}
          />
        ) : (
          <ListaServicos
            servicos={servicos}
            onEditar={handleSelecionarEdicao}
            onRemover={handleRemover}
            onAlternarStatus={handleAlternarStatus}
            carregando={carregando}
          />
        )}
      </div>
    </div>
  );
}

// Estilos
const styles = {
  container: {
    minHeight: "100vh",
    padding: 24,
    background: "radial-gradient(900px circle at 10% 10%, rgba(253,54,110,0.08), transparent 40%), radial-gradient(700px circle at 90% 0%, rgba(253,166,60,0.05), transparent 45%), rgba(0,0,0,0.25)",
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 1000,
    color: "white",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    fontWeight: 600,
    margin: "4px 0 0 0",
  },
  buttonNovo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 24px",
    borderRadius: 14,
    border: "none",
    background: "#FD366E",
    color: "white",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    boxShadow: "0 4px 15px rgba(253,54,110,0.3)",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  messageContainer: {
    maxWidth: 1200,
    margin: "0 auto 16px auto",
  },
  messageSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 18px",
    borderRadius: 14,
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#4ade80",
    fontSize: 14,
    fontWeight: 800,
    animation: "slideIn 0.3s ease-out",
  },
  messageError: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 18px",
    borderRadius: 14,
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171",
    fontSize: 14,
    fontWeight: 800,
    animation: "slideIn 0.3s ease-out",
  },
  messageIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(34,197,94,0.2)",
    fontSize: 13,
    fontWeight: 900,
  },
  messageIconError: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(239,68,68,0.2)",
    fontSize: 13,
    fontWeight: 900,
  },
  alertContainer: {
    maxWidth: 600,
    margin: "0 auto",
    paddingTop: 80,
  },
  alertWarning: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    padding: 24,
    borderRadius: 18,
    background: "rgba(253,166,60,0.1)",
    border: "1px solid rgba(253,166,60,0.25)",
  },
  alertIcon: {
    fontSize: 32,
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "white",
    display: "block",
    marginBottom: 6,
  },
  alertText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.5,
  },
};

// Adiciona animações
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);