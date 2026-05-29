-- =====================================================
-- GestorCoop - Schema do Banco de Dados
-- Migração de Bubble.io para Supabase
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS (Option Sets do Bubble)
-- =====================================================

-- Permissões de módulos
CREATE TYPE permissao_modulo AS ENUM (
  'dashboard',
  'financeiro',
  'assembleias',
  'gestao_de_rh',
  'gestao_geral',
  'gestao_de_escalas',
  'educacao_continuada'
);

-- Sexo
CREATE TYPE sexo AS ENUM (
  'masculino',
  'feminino',
  'prefiro_nao_dizer'
);

-- Meses
CREATE TYPE mes AS ENUM (
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
);

-- Turno
CREATE TYPE turno AS ENUM (
  'manha',
  'tarde',
  'noite'
);

-- Status de Escala
CREATE TYPE status_escala AS ENUM (
  'vago',
  'preenchida',
  'aguardando_aprovacao'
);

-- Tipo de Assembleia
CREATE TYPE tipo_assembleia AS ENUM (
  'age_oficial',
  'ago_oficial',
  'assembleia_teste',
  'ago_e_age_oficiais',
  'age_especial_oficial'
);

-- Status de Integralização
CREATE TYPE status_integralizacao AS ENUM (
  'paga',
  'pendente',
  'atrasada'
);

-- Profissões
CREATE TYPE profissao AS ENUM (
  'medico',
  'biomedico',
  'enfermeiro',
  'fisioterapeuta',
  'fonoaudiologo',
  'nutricionista',
  'odontologo',
  'psicologo',
  'veterinario'
);

-- Outros ENUMs conforme necessário
CREATE TYPE entrada_saida AS ENUM ('entrada', 'saida');
CREATE TYPE voto_opcao AS ENUM ('voto_sim', 'voto_nao', 'abstencao');

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Cooperativas
CREATE TABLE cooperativas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  slug TEXT UNIQUE,
  logo_url TEXT,
  cor_hex TEXT,
  
  configuracoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT true
);

-- Bancos (Master List)
CREATE TABLE bancos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  codigo TEXT,
  logo_url TEXT
);

-- Cooperados
CREATE TABLE cooperados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  
  nome TEXT NOT NULL,
  sobrenome TEXT,
  cpf TEXT UNIQUE,
  rg TEXT,
  orgao_emissor TEXT,
  data_nascimento DATE,
  sexo sexo,
  profissao profissao,
  cargo TEXT,
  
  email TEXT,
  whatsapp TEXT,
  foto_url TEXT,
  
  -- Controle
  status TEXT DEFAULT 'ativo', -- 'pendente', 'ativo', 'inativo'
  primeiro_acesso BOOLEAN DEFAULT true,
  admin_coop BOOLEAN DEFAULT false,
  colaborador_interno BOOLEAN DEFAULT false
);

-- Contas Bancárias (Unificadas)
CREATE TABLE contas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id) ON DELETE CASCADE,
  banco_id UUID REFERENCES bancos(id),
  
  agencia TEXT,
  conta TEXT,
  pix TEXT,
  
  tipo TEXT, -- 'pessoal', 'cooperativa'
  principal BOOLEAN DEFAULT false
);

-- Times Internos
CREATE TABLE times_internos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  permissoes permissao_modulo[] DEFAULT '{}'
);

-- Setores
CREATE TABLE setores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  unidade TEXT
);

-- =====================================================
-- MÓDULO: ESCALAS
-- =====================================================

CREATE TABLE escalas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id) ON DELETE SET NULL,
  setor_id UUID REFERENCES setores(id),
  
  data_data DATE NOT NULL,
  local TEXT,
  status status_escala DEFAULT 'vago',
  
  -- Campos de controle real e geolocalização
  inicio_real TIMESTAMPTZ,
  fim_real TIMESTAMPTZ,
  lat_inicio NUMERIC,
  lng_inicio NUMERIC,
  distancia_inicio NUMERIC,
  atraso_minutos INTEGER
);

CREATE TABLE escalas_dias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  data_data DATE NOT NULL,
  unidade TEXT,
  vagas INTEGER DEFAULT 0,
  vagas_preenchidas INTEGER DEFAULT 0
);

-- =====================================================
-- MÓDULO: ASSEMBLEIAS
-- =====================================================

CREATE TABLE assembleias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  
  nome TEXT NOT NULL,
  data_inicio TIMESTAMPTZ,
  tipo tipo_assembleia,
  
  iniciou BOOLEAN DEFAULT false,
  finalizou BOOLEAN DEFAULT false,
  hash_reuniao TEXT,
  chamada_atual INTEGER DEFAULT 0 -- 0=Não iniciada, 1, 2, 3
);

CREATE TABLE pautas_reuniao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assembleia_id UUID REFERENCES assembleias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  modo TEXT, -- 'eleicao', 'proposta'
  liberada BOOLEAN DEFAULT false,
  finalizada BOOLEAN DEFAULT false
);

CREATE TABLE perguntas_assembleia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pauta_id UUID REFERENCES pautas_reuniao(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL
);

CREATE TABLE alternativas_assembleias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta_id UUID REFERENCES perguntas_assembleia(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  foto_url TEXT
);

CREATE TABLE votos_assembleia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pauta_id UUID REFERENCES pautas_reuniao(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id) ON DELETE CASCADE,
  voto_opcao voto_opcao,
  voto_valor TEXT, -- Para casos de eleição de nomes
  hash_voto TEXT,
  UNIQUE(pauta_id, cooperado_id)
);

-- =====================================================
-- MÓDULO: FINANCEIRO
-- =====================================================

-- Serviços Financeiros (Sync com e_serviços)
CREATE TABLE servicos_financeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id),
  
  data_referencia DATE,
  valor_bruto NUMERIC(12, 2) DEFAULT 0,
  valor_liquido NUMERIC(12, 2) DEFAULT 0,
  unidade TEXT,
  mes_referencia mes
);

CREATE TABLE fechamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id),
  mes mes,
  ano TEXT,
  valor_total NUMERIC(12, 2) DEFAULT 0
);

CREATE TABLE integralizacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id),
  valor_total NUMERIC(12, 2) DEFAULT 0,
  qtd_parcelas INTEGER,
  status status_integralizacao DEFAULT 'pendente'
);

CREATE TABLE integralizacao_parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integralizacao_id UUID REFERENCES integralizacao(id) ON DELETE CASCADE,
  numero_parcela INTEGER,
  valor NUMERIC(12, 2) DEFAULT 0,
  data_vencimento DATE,
  data_pagamento DATE,
  paga BOOLEAN DEFAULT false
);

-- =====================================================
-- OUTRAS TABELAS
-- =====================================================

CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_vencimento DATE,
  concluida BOOLEAN DEFAULT false
);

CREATE TABLE chamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assembleia_id UUID REFERENCES assembleias(id) ON DELETE CASCADE,
  numero_chamada INTEGER,
  data_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL
);

CREATE TABLE objetivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  meta NUMERIC(12, 2),
  valor_atual NUMERIC(12, 2) DEFAULT 0
);

CREATE TABLE historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usuario_id UUID REFERENCES cooperados(id),
  acao TEXT NOT NULL,
  detalhes TEXT
);

CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  remetente_id UUID REFERENCES cooperados(id),
  conversa_id UUID, -- Placeholder para agrupamento
  texto TEXT NOT NULL
);

CREATE TABLE presenca_cooperativa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_referencia DATE DEFAULT CURRENT_DATE,
  cooperado_id UUID REFERENCES cooperados(id) ON DELETE CASCADE,
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE
);

CREATE TABLE presenca_assembleia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assembleia_id UUID REFERENCES assembleias(id) ON DELETE CASCADE,
  cooperado_id UUID REFERENCES cooperados(id) ON DELETE CASCADE,
  tipo_chamada INTEGER, -- 1, 2 ou 3
  UNIQUE(assembleia_id, cooperado_id)
);

CREATE TABLE nao_conformidade_interna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT
);

-- =====================================================
-- TRIGGERS E RLS
-- =====================================================

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cooperativas_updated_at BEFORE UPDATE ON cooperativas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cooperados_updated_at BEFORE UPDATE ON cooperados FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE cooperativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperados ENABLE ROW LEVEL SECURITY;
-- ... habilitar para as demais conforme necessidade política

CREATE POLICY "Cooperados podem ver sua cooperativa" ON cooperativas
FOR SELECT USING (id IN (SELECT cooperativa_id FROM cooperados WHERE user_id = auth.uid()));

CREATE POLICY "Cooperados podem ver seus próprios dados" ON cooperados
FOR SELECT USING (user_id = auth.uid());
