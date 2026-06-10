-- ============================================================
-- AgendasBarber — Schema MySQL
-- Banco: barbeariaextensao
-- ============================================================

CREATE DATABASE IF NOT EXISTS barbeariaextensao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE barbeariaextensao;

-- Usuários (donos das barbearias)
CREATE TABLE IF NOT EXISTS usuarios (
  id         VARCHAR(36)  PRIMARY KEY,
  nome       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- Barbearias (uma por usuário)
CREATE TABLE IF NOT EXISTS barbearias (
  id        VARCHAR(36)  PRIMARY KEY,
  user_id   VARCHAR(36)  NOT NULL,
  nome      VARCHAR(255) NOT NULL,
  slug      VARCHAR(255) NOT NULL UNIQUE,
  email     VARCHAR(255),
  telefone  VARCHAR(30),
  endereco  TEXT,
  descricao TEXT,
  imagem    TEXT,
  instagram VARCHAR(255),
  whatsapp  VARCHAR(30),
  status    VARCHAR(20)  DEFAULT 'ativo',
  criado_em DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_user (user_id)
);

-- Configurações (1-para-1 com barbearia)
CREATE TABLE IF NOT EXISTS configuracoes_barbearia (
  id                    VARCHAR(36) PRIMARY KEY,
  barbearia_id          VARCHAR(36) NOT NULL UNIQUE,
  onboarding_completo   TINYINT(1)  DEFAULT 0,
  intervalo_agendamento INT         DEFAULT 30,
  antecedencia_minima   INT         DEFAULT 1,
  criado_em             DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barbearia_id) REFERENCES barbearias(id) ON DELETE CASCADE
);

-- Horários de atendimento
CREATE TABLE IF NOT EXISTS horarios_atendimento (
  id           VARCHAR(36) PRIMARY KEY,
  barbearia_id VARCHAR(36) NOT NULL,
  dia_semana   TINYINT     NOT NULL COMMENT '0=Dom,1=Seg,...,6=Sab',
  abertura     VARCHAR(8)  NOT NULL COMMENT 'HH:MM',
  fechamento   VARCHAR(8)  NOT NULL COMMENT 'HH:MM',
  ativo        TINYINT(1)  DEFAULT 1,
  UNIQUE KEY uq_barbearia_dia (barbearia_id, dia_semana),
  FOREIGN KEY (barbearia_id) REFERENCES barbearias(id) ON DELETE CASCADE
);

-- Serviços
CREATE TABLE IF NOT EXISTS servicos (
  id           VARCHAR(36)    PRIMARY KEY,
  barbearia_id VARCHAR(36)    NOT NULL,
  nome         VARCHAR(255)   NOT NULL,
  descricao    TEXT,
  valor        DECIMAL(10,2)  DEFAULT 0.00,
  duracao      INT            DEFAULT 30 COMMENT 'em minutos',
  status       VARCHAR(20)    DEFAULT 'ativo',
  criado_em    DATETIME       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barbearia_id) REFERENCES barbearias(id) ON DELETE CASCADE,
  INDEX idx_barbearia (barbearia_id)
);

-- Clientes da barbearia
CREATE TABLE IF NOT EXISTS clientes_barbearia (
  id           VARCHAR(36)  PRIMARY KEY,
  barbearia_id VARCHAR(36)  NOT NULL,
  nome         VARCHAR(255) NOT NULL,
  telefone     VARCHAR(30),
  email        VARCHAR(255),
  observacoes  TEXT,
  criado_em    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barbearia_id) REFERENCES barbearias(id) ON DELETE CASCADE,
  INDEX idx_barbearia (barbearia_id),
  INDEX idx_telefone (telefone)
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id               VARCHAR(36) PRIMARY KEY,
  barbearia_id     VARCHAR(36) NOT NULL,
  cliente_id       VARCHAR(36),
  servico_id       VARCHAR(36),
  data_agendamento DATE        NOT NULL,
  horario          VARCHAR(8)  NOT NULL COMMENT 'HH:MM',
  status           VARCHAR(20) DEFAULT 'ativo',
  observacoes      TEXT,
  criado_em        DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barbearia_id) REFERENCES barbearias(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id)   REFERENCES clientes_barbearia(id) ON DELETE SET NULL,
  FOREIGN KEY (servico_id)   REFERENCES servicos(id) ON DELETE SET NULL,
  INDEX idx_barbearia_data (barbearia_id, data_agendamento)
);

-- Sessões (substituindo Appwrite Auth)
CREATE TABLE IF NOT EXISTS sessoes (
  token     VARCHAR(64) PRIMARY KEY,
  user_id   VARCHAR(36) NOT NULL,
  expira_em DATETIME    NOT NULL,
  criado_em DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
