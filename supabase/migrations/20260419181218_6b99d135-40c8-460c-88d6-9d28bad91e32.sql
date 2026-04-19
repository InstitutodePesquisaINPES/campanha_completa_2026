-- ============== ENUMS ==============
CREATE TYPE public.ai_provedor_tipo AS ENUM ('openai','anthropic','google','groq','mistral','openrouter','azure_openai','cohere','perplexity','xai','deepseek','custom');
CREATE TYPE public.ai_provedor_status AS ENUM ('ativo','inativo','erro','testando');
CREATE TYPE public.ai_copilot_categoria AS ENUM ('estrategista','analista','comunicador','juridico','financeiro','territorial','geral');
CREATE TYPE public.pesquisa_tipo AS ENUM ('eleitoral','opiniao','tracking','qualitativa','interna');
CREATE TYPE public.pesquisa_status AS ENUM ('planejada','em_campo','concluida','divulgada','cancelada');
CREATE TYPE public.captacao_status AS ENUM ('prospect','contatado','negociando','confirmado','recebido','recusado');

-- ============== AI PROVEDORES ==============
CREATE TABLE public.ai_provedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo public.ai_provedor_tipo NOT NULL,
  descricao text,
  base_url text NOT NULL,
  secret_name text NOT NULL,
  organization_id text,
  status public.ai_provedor_status NOT NULL DEFAULT 'inativo',
  prioridade integer NOT NULL DEFAULT 100,
  rate_limit_rpm integer,
  headers_extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_teste_em timestamptz,
  ultimo_teste_ok boolean,
  ultimo_teste_erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_ai_provedores_tipo ON public.ai_provedores(tipo);
CREATE INDEX idx_ai_provedores_status ON public.ai_provedores(status);

-- ============== AI MODELOS ==============
CREATE TABLE public.ai_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provedor_id uuid NOT NULL REFERENCES public.ai_provedores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  modelo_id text NOT NULL,
  descricao text,
  contexto_tokens integer NOT NULL DEFAULT 8192,
  max_output_tokens integer NOT NULL DEFAULT 4096,
  custo_input_por_1m numeric(10,4) NOT NULL DEFAULT 0,
  custo_output_por_1m numeric(10,4) NOT NULL DEFAULT 0,
  suporta_vision boolean NOT NULL DEFAULT false,
  suporta_tools boolean NOT NULL DEFAULT false,
  suporta_reasoning boolean NOT NULL DEFAULT false,
  suporta_streaming boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provedor_id, modelo_id)
);
CREATE INDEX idx_ai_modelos_provedor ON public.ai_modelos(provedor_id);

-- ============== AI COPILOTS ==============
CREATE TABLE public.ai_copilots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria public.ai_copilot_categoria NOT NULL DEFAULT 'geral',
  descricao text,
  icone text DEFAULT 'sparkles',
  cor text DEFAULT '#3B82F6',
  prompt_sistema text NOT NULL,
  modelo_id uuid REFERENCES public.ai_modelos(id) ON DELETE SET NULL,
  temperatura numeric(3,2) NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 2048,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_ai_copilots_categoria ON public.ai_copilots(categoria);

-- ============== AI CONVERSAS ==============
CREATE TABLE public.ai_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  copilot_id uuid REFERENCES public.ai_copilots(id) ON DELETE SET NULL,
  titulo text NOT NULL DEFAULT 'Nova conversa',
  ultima_mensagem_em timestamptz NOT NULL DEFAULT now(),
  total_mensagens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  custo_estimado numeric(10,4) NOT NULL DEFAULT 0,
  arquivada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_conversas_user ON public.ai_conversas(user_id, ultima_mensagem_em DESC);

-- ============== AI MENSAGENS ==============
CREATE TABLE public.ai_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.ai_conversas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  modelo_usado text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_mensagens_conversa ON public.ai_mensagens(conversa_id, created_at);

-- ============== AI USO LOG ==============
CREATE TABLE public.ai_uso_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provedor_id uuid REFERENCES public.ai_provedores(id) ON DELETE SET NULL,
  modelo_id uuid REFERENCES public.ai_modelos(id) ON DELETE SET NULL,
  copilot_id uuid REFERENCES public.ai_copilots(id) ON DELETE SET NULL,
  conversa_id uuid REFERENCES public.ai_conversas(id) ON DELETE SET NULL,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  custo_estimado numeric(10,4) NOT NULL DEFAULT 0,
  latencia_ms integer,
  sucesso boolean NOT NULL DEFAULT true,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_uso_log_data ON public.ai_uso_log(created_at DESC);
CREATE INDEX idx_ai_uso_log_user ON public.ai_uso_log(user_id, created_at DESC);

-- ============== PESQUISAS ==============
CREATE TABLE public.pesquisas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo public.pesquisa_tipo NOT NULL DEFAULT 'eleitoral',
  status public.pesquisa_status NOT NULL DEFAULT 'planejada',
  instituto text,
  registro_tse text,
  data_inicio_campo date,
  data_fim_campo date,
  data_divulgacao date,
  amostra integer,
  margem_erro numeric(4,2),
  nivel_confianca numeric(4,2) DEFAULT 95,
  metodologia text,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  custo numeric(12,2),
  observacoes text,
  arquivo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_pesquisas_campanha ON public.pesquisas(campanha_id);

-- ============== PESQUISA RESULTADOS ==============
CREATE TABLE public.pesquisa_resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id uuid NOT NULL REFERENCES public.pesquisas(id) ON DELETE CASCADE,
  cenario text NOT NULL DEFAULT 'estimulada',
  candidato text NOT NULL,
  partido text,
  percentual numeric(5,2) NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pesquisa_resultados_pesquisa ON public.pesquisa_resultados(pesquisa_id);

-- ============== CAPTACAO DOADORES ==============
CREATE TABLE public.captacao_doadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  nome text NOT NULL,
  documento text,
  email text,
  telefone text,
  status public.captacao_status NOT NULL DEFAULT 'prospect',
  valor_estimado numeric(12,2) DEFAULT 0,
  valor_confirmado numeric(12,2) DEFAULT 0,
  valor_recebido numeric(12,2) DEFAULT 0,
  data_contato date,
  data_confirmacao date,
  data_recebimento date,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_captacao_doadores_campanha ON public.captacao_doadores(campanha_id);
CREATE INDEX idx_captacao_doadores_status ON public.captacao_doadores(status);

-- ============== TRIGGERS updated_at ==============
CREATE TRIGGER trg_ai_provedores_updated BEFORE UPDATE ON public.ai_provedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_modelos_updated BEFORE UPDATE ON public.ai_modelos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_copilots_updated BEFORE UPDATE ON public.ai_copilots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pesquisas_updated BEFORE UPDATE ON public.pesquisas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_captacao_doadores_updated BEFORE UPDATE ON public.captacao_doadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== RLS ==============
ALTER TABLE public.ai_provedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_copilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_uso_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisa_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captacao_doadores ENABLE ROW LEVEL SECURITY;

-- Provedores: somente admin
CREATE POLICY "Admins gerenciam provedores" ON public.ai_provedores FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Autenticados leem provedores ativos" ON public.ai_provedores FOR SELECT TO authenticated USING (status = 'ativo' OR public.has_role(auth.uid(),'admin'));

-- Modelos: admin gerencia, todos leem ativos
CREATE POLICY "Admins gerenciam modelos" ON public.ai_modelos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Autenticados leem modelos ativos" ON public.ai_modelos FOR SELECT TO authenticated USING (ativo OR public.has_role(auth.uid(),'admin'));

-- Copilots: gestores gerenciam, todos leem
CREATE POLICY "Gestores gerenciam copilots" ON public.ai_copilots FOR ALL TO authenticated USING (public.has_manage_role(auth.uid())) WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Autenticados leem copilots ativos" ON public.ai_copilots FOR SELECT TO authenticated USING (ativo OR public.has_manage_role(auth.uid()));

-- Conversas: usuário só vê as suas (admin vê tudo)
CREATE POLICY "Usuário gerencia próprias conversas" ON public.ai_conversas FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

-- Mensagens: via conversa do usuário
CREATE POLICY "Usuário lê mensagens de suas conversas" ON public.ai_mensagens FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_conversas c WHERE c.id = conversa_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Usuário insere mensagens em suas conversas" ON public.ai_mensagens FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversas c WHERE c.id = conversa_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário deleta mensagens de suas conversas" ON public.ai_mensagens FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_conversas c WHERE c.id = conversa_id AND c.user_id = auth.uid()));

-- Uso log: usuário vê o seu, admin vê tudo
CREATE POLICY "Usuário lê próprio uso" ON public.ai_uso_log FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Sistema insere uso" ON public.ai_uso_log FOR INSERT TO authenticated WITH CHECK (true);

-- Pesquisas: gestores gerenciam, todos autenticados leem
CREATE POLICY "Gestores gerenciam pesquisas" ON public.pesquisas FOR ALL TO authenticated USING (public.has_manage_role(auth.uid())) WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Autenticados leem pesquisas" ON public.pesquisas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores gerenciam resultados" ON public.pesquisa_resultados FOR ALL TO authenticated USING (public.has_manage_role(auth.uid())) WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Autenticados leem resultados" ON public.pesquisa_resultados FOR SELECT TO authenticated USING (true);

-- Captação: gestores
CREATE POLICY "Gestores gerenciam captação" ON public.captacao_doadores FOR ALL TO authenticated USING (public.has_manage_role(auth.uid())) WITH CHECK (public.has_manage_role(auth.uid()));

-- ============== SEED PROVEDORES PADRÃO ==============
INSERT INTO public.ai_provedores (nome, tipo, descricao, base_url, secret_name, status, prioridade) VALUES
  ('OpenAI', 'openai', 'Modelos GPT da OpenAI (GPT-4o, GPT-4 Turbo, etc.)', 'https://api.openai.com/v1', 'OPENAI_API_KEY', 'inativo', 10),
  ('Anthropic', 'anthropic', 'Modelos Claude da Anthropic (Sonnet, Opus, Haiku)', 'https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY', 'inativo', 20),
  ('Google AI', 'google', 'Modelos Gemini do Google', 'https://generativelanguage.googleapis.com/v1beta', 'GOOGLE_AI_API_KEY', 'inativo', 30),
  ('Groq', 'groq', 'Inferência ultra-rápida (Llama, Mixtral)', 'https://api.groq.com/openai/v1', 'GROQ_API_KEY', 'inativo', 40),
  ('Mistral AI', 'mistral', 'Modelos Mistral (Large, Medium, Small)', 'https://api.mistral.ai/v1', 'MISTRAL_API_KEY', 'inativo', 50),
  ('OpenRouter', 'openrouter', 'Acesso unificado a 100+ modelos', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY', 'inativo', 60),
  ('DeepSeek', 'deepseek', 'Modelos DeepSeek (V3, R1)', 'https://api.deepseek.com/v1', 'DEEPSEEK_API_KEY', 'inativo', 70),
  ('xAI Grok', 'xai', 'Modelos Grok da xAI', 'https://api.x.ai/v1', 'XAI_API_KEY', 'inativo', 80),
  ('Perplexity', 'perplexity', 'Modelos Sonar com pesquisa web', 'https://api.perplexity.ai', 'PERPLEXITY_API_KEY', 'inativo', 90);

-- ============== SEED MODELOS POPULARES ==============
INSERT INTO public.ai_modelos (provedor_id, nome, modelo_id, contexto_tokens, max_output_tokens, custo_input_por_1m, custo_output_por_1m, suporta_vision, suporta_tools, suporta_reasoning)
SELECT id, 'GPT-4o', 'gpt-4o', 128000, 16384, 2.50, 10.00, true, true, false FROM public.ai_provedores WHERE tipo='openai'
UNION ALL SELECT id, 'GPT-4o Mini', 'gpt-4o-mini', 128000, 16384, 0.15, 0.60, true, true, false FROM public.ai_provedores WHERE tipo='openai'
UNION ALL SELECT id, 'GPT-4 Turbo', 'gpt-4-turbo', 128000, 4096, 10.00, 30.00, true, true, false FROM public.ai_provedores WHERE tipo='openai'
UNION ALL SELECT id, 'o1-preview', 'o1-preview', 128000, 32768, 15.00, 60.00, false, false, true FROM public.ai_provedores WHERE tipo='openai'
UNION ALL SELECT id, 'o1-mini', 'o1-mini', 128000, 65536, 3.00, 12.00, false, false, true FROM public.ai_provedores WHERE tipo='openai'
UNION ALL SELECT id, 'Claude Sonnet 4.5', 'claude-sonnet-4-5-20250929', 200000, 64000, 3.00, 15.00, true, true, false FROM public.ai_provedores WHERE tipo='anthropic'
UNION ALL SELECT id, 'Claude Opus 4', 'claude-opus-4-20250514', 200000, 32000, 15.00, 75.00, true, true, false FROM public.ai_provedores WHERE tipo='anthropic'
UNION ALL SELECT id, 'Claude Haiku 3.5', 'claude-3-5-haiku-20241022', 200000, 8192, 0.80, 4.00, true, true, false FROM public.ai_provedores WHERE tipo='anthropic'
UNION ALL SELECT id, 'Gemini 2.0 Flash', 'gemini-2.0-flash-exp', 1000000, 8192, 0.10, 0.40, true, true, false FROM public.ai_provedores WHERE tipo='google'
UNION ALL SELECT id, 'Gemini 1.5 Pro', 'gemini-1.5-pro', 2000000, 8192, 1.25, 5.00, true, true, false FROM public.ai_provedores WHERE tipo='google'
UNION ALL SELECT id, 'Gemini 1.5 Flash', 'gemini-1.5-flash', 1000000, 8192, 0.075, 0.30, true, true, false FROM public.ai_provedores WHERE tipo='google'
UNION ALL SELECT id, 'Llama 3.3 70B', 'llama-3.3-70b-versatile', 128000, 32768, 0.59, 0.79, false, true, false FROM public.ai_provedores WHERE tipo='groq'
UNION ALL SELECT id, 'Llama 3.1 8B Instant', 'llama-3.1-8b-instant', 128000, 8192, 0.05, 0.08, false, true, false FROM public.ai_provedores WHERE tipo='groq'
UNION ALL SELECT id, 'Mixtral 8x7B', 'mixtral-8x7b-32768', 32768, 32768, 0.24, 0.24, false, true, false FROM public.ai_provedores WHERE tipo='groq'
UNION ALL SELECT id, 'Mistral Large', 'mistral-large-latest', 128000, 8192, 2.00, 6.00, false, true, false FROM public.ai_provedores WHERE tipo='mistral'
UNION ALL SELECT id, 'Mistral Small', 'mistral-small-latest', 32000, 8192, 0.20, 0.60, false, true, false FROM public.ai_provedores WHERE tipo='mistral'
UNION ALL SELECT id, 'DeepSeek V3', 'deepseek-chat', 64000, 8192, 0.27, 1.10, false, true, false FROM public.ai_provedores WHERE tipo='deepseek'
UNION ALL SELECT id, 'DeepSeek R1', 'deepseek-reasoner', 64000, 8192, 0.55, 2.19, false, false, true FROM public.ai_provedores WHERE tipo='deepseek'
UNION ALL SELECT id, 'Grok 2', 'grok-2-latest', 131072, 8192, 2.00, 10.00, false, true, false FROM public.ai_provedores WHERE tipo='xai'
UNION ALL SELECT id, 'Grok 2 Vision', 'grok-2-vision-latest', 32768, 8192, 2.00, 10.00, true, true, false FROM public.ai_provedores WHERE tipo='xai'
UNION ALL SELECT id, 'Sonar Large', 'llama-3.1-sonar-large-128k-online', 127072, 8192, 1.00, 1.00, false, false, false FROM public.ai_provedores WHERE tipo='perplexity'
UNION ALL SELECT id, 'Sonar Small', 'llama-3.1-sonar-small-128k-online', 127072, 8192, 0.20, 0.20, false, false, false FROM public.ai_provedores WHERE tipo='perplexity';

-- ============== SEED COPILOTS ==============
INSERT INTO public.ai_copilots (nome, categoria, descricao, icone, cor, prompt_sistema, temperatura, ordem) VALUES
  ('Estrategista de Campanha','estrategista','Análise estratégica, plano de 90 dias, decisões de campo','target','#EF4444','Você é um estrategista político sênior com 20+ anos de experiência em campanhas eleitorais brasileiras. Analise dados, sugira ações táticas e priorize esforços com base no plano de 90 dias. Use linguagem direta e objetiva.', 0.5, 1),
  ('Analista Territorial','analista','Análise de bairros, lacunas de cobertura, dados TSE','map','#3B82F6','Você é um analista territorial especializado em geografia eleitoral brasileira. Cruze dados do TSE, IBGE e CRM para identificar oportunidades de campo, redutos eleitorais e lacunas de cobertura.', 0.3, 2),
  ('Comunicador','comunicador','Criação de pautas, posts, peças e respostas em crises','message-square','#10B981','Você é um redator publicitário e estrategista de comunicação política. Crie textos persuasivos, pautas editoriais e respostas para o war room. Adapte o tom ao canal (WhatsApp, Instagram, rádio, TV).', 0.8, 3),
  ('Consultor Jurídico','juridico','Consultas sobre TSE, prazos, propaganda, prestação de contas','scale','#8B5CF6','Você é um advogado eleitoralista especialista na Lei 9.504/97 e nas resoluções do TSE. Responda dúvidas sobre prazos, propaganda eleitoral, prestação de contas e compliance. Sempre cite a base legal.', 0.2, 4),
  ('Analista Financeiro','financeiro','Orçamento, captação, fluxo de caixa, prestação','dollar-sign','#F59E0B','Você é um controller financeiro especializado em campanhas eleitorais. Analise orçamentos, identifique riscos de fluxo de caixa, otimize alocação por centro de custo e oriente a prestação de contas TSE.', 0.3, 5);