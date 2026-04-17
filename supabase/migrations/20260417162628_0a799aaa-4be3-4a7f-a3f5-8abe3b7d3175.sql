-- ============================================
-- MÓDULO CAMPANHAS + PLANO 90 DIAS
-- ============================================

CREATE TYPE public.cargo_eleitoral AS ENUM (
  'vereador','prefeito','vice_prefeito','deputado_estadual','deputado_federal','senador','governador','presidente'
);

CREATE TYPE public.fase_campanha AS ENUM (
  'pre_campanha','lancamento','consolidacao','reta_final'
);

CREATE TYPE public.status_tarefa AS ENUM (
  'pendente','em_andamento','concluida','atrasada','cancelada'
);

CREATE TYPE public.area_campanha AS ENUM (
  'organizacao','campo','digital','financeiro','juridico','comunicacao','logistica','dados'
);

-- Campanha (header)
CREATE TABLE public.campanhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  candidato_pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  cargo cargo_eleitoral NOT NULL,
  numero_urna text,
  partido_sigla text,
  coligacao text,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  data_inicio_plano date NOT NULL DEFAULT CURRENT_DATE,
  data_eleicao date NOT NULL,
  meta_votos integer,
  orcamento_total numeric DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fases (4 fases automáticas: pré, lançamento, consolidação, reta final)
CREATE TABLE public.campanha_fases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  fase fase_campanha NOT NULL,
  nome text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  foco text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, fase)
);

-- Tarefas do cronograma 90 dias
CREATE TABLE public.campanha_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  fase_id uuid REFERENCES public.campanha_fases(id) ON DELETE SET NULL,
  dia integer NOT NULL,
  data_prevista date NOT NULL,
  semana integer NOT NULL,
  area area_campanha NOT NULL,
  titulo text NOT NULL,
  descricao text,
  responsavel_id uuid,
  status status_tarefa NOT NULL DEFAULT 'pendente',
  prioridade prioridade_demanda NOT NULL DEFAULT 'media',
  data_conclusao timestamptz,
  observacoes text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tarefas_campanha_dia ON public.campanha_tarefas(campanha_id, dia);
CREATE INDEX idx_tarefas_status ON public.campanha_tarefas(status);

-- Metas por fase + área
CREATE TABLE public.campanha_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  fase fase_campanha NOT NULL,
  area area_campanha NOT NULL,
  meta text NOT NULL,
  indicador text NOT NULL,
  valor_meta numeric NOT NULL DEFAULT 0,
  valor_realizado numeric NOT NULL DEFAULT 0,
  observacoes text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Plano semana-a-semana (resumo de cada uma das ~13 semanas)
CREATE TABLE public.campanha_semanas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  numero_semana integer NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  fase fase_campanha NOT NULL,
  foco_principal text,
  meta_campo text,
  meta_digital text,
  meta_financeiro text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, numero_semana)
);

-- Cobertura por bairro (snapshot calculado pela view)
-- Mapa estratégico real-time

-- Adicionar campos faltantes em pessoas (meta de votos, responsável_por_area)
ALTER TABLE public.pessoas
  ADD COLUMN IF NOT EXISTS meta_votos integer,
  ADD COLUMN IF NOT EXISTS responsavel_area text,
  ADD COLUMN IF NOT EXISTS proxima_acao date;

-- Triggers updated_at
CREATE TRIGGER trg_campanhas_updated BEFORE UPDATE ON public.campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tarefas_updated BEFORE UPDATE ON public.campanha_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_metas_updated BEFORE UPDATE ON public.campanha_metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_semanas ENABLE ROW LEVEL SECURITY;

-- Padrão idêntico aos outros módulos: auth lê, manage role escreve
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['campanhas','campanha_fases','campanha_tarefas','campanha_metas','campanha_semanas']) LOOP
    EXECUTE format('CREATE POLICY "Auth view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Manage insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Manage update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Manage delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (has_manage_role(auth.uid()))', t);
  END LOOP;
END$$;

-- ============================================
-- VIEW: Mapa Estratégico de Votos por Bairro
-- ============================================
CREATE OR REPLACE VIEW public.mapa_estrategico_bairros AS
SELECT
  b.id AS bairro_id,
  b.nome AS bairro_nome,
  b.classificacao,
  m.id AS municipio_id,
  m.nome AS municipio_nome,
  COUNT(DISTINCT pe.pessoa_id) FILTER (WHERE pe.bairro_id = b.id) AS eleitores_cadastrados,
  COUNT(DISTINCT pp.pessoa_id) FILTER (WHERE pp.papel IN ('apoiador','lideranca','coordenador_bairro') AND pp.ativo) AS apoiadores,
  COALESCE(SUM(p.meta_votos) FILTER (WHERE pe.bairro_id = b.id), 0) AS meta_votos_total,
  COUNT(DISTINCT d.id) FILTER (WHERE d.bairro_id = b.id AND d.status NOT IN ('resolvida','arquivada')) AS demandas_abertas,
  COUNT(DISTINCT d.id) FILTER (WHERE d.bairro_id = b.id AND d.status = 'resolvida') AS demandas_resolvidas
FROM public.bairros b
JOIN public.municipios m ON m.id = b.municipio_id
LEFT JOIN public.pessoas_enderecos pe ON pe.bairro_id = b.id
LEFT JOIN public.pessoas p ON p.id = pe.pessoa_id
LEFT JOIN public.pessoas_papeis pp ON pp.pessoa_id = p.id
LEFT JOIN public.demandas d ON d.bairro_id = b.id
GROUP BY b.id, b.nome, b.classificacao, m.id, m.nome;

-- ============================================
-- FUNÇÃO: Gera plano completo 90 dias
-- ============================================
CREATE OR REPLACE FUNCTION public.gerar_plano_90_dias(_campanha_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio date;
  v_fase_pre uuid;
  v_fase_lanc uuid;
  v_fase_cons uuid;
  v_fase_reta uuid;
BEGIN
  SELECT data_inicio_plano INTO v_inicio FROM public.campanhas WHERE id = _campanha_id;
  IF v_inicio IS NULL THEN RAISE EXCEPTION 'Campanha não encontrada'; END IF;

  -- Limpa
  DELETE FROM public.campanha_tarefas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_metas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_semanas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_fases WHERE campanha_id = _campanha_id;

  -- 4 fases (dias 1-21 / 22-45 / 46-75 / 76-90)
  INSERT INTO public.campanha_fases (campanha_id, fase, nome, data_inicio, data_fim, foco, ordem)
  VALUES
    (_campanha_id, 'pre_campanha', 'Pré-campanha', v_inicio, v_inicio + 20, 'Estruturação, equipe, identidade visual e cadastro de base', 1),
    (_campanha_id, 'lancamento', 'Lançamento', v_inicio + 21, v_inicio + 44, 'Apresentação pública e mobilização inicial', 2),
    (_campanha_id, 'consolidacao', 'Consolidação', v_inicio + 45, v_inicio + 74, 'Expansão por bairros, eventos e propostas', 3),
    (_campanha_id, 'reta_final', 'Reta Final', v_inicio + 75, v_inicio + 89, 'Conversão, mobilização total e dia da eleição', 4)
  RETURNING id INTO v_fase_pre;

  SELECT id INTO v_fase_pre FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'pre_campanha';
  SELECT id INTO v_fase_lanc FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'lancamento';
  SELECT id INTO v_fase_cons FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'consolidacao';
  SELECT id INTO v_fase_reta FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'reta_final';

  -- Semanas 1-13
  INSERT INTO public.campanha_semanas (campanha_id, numero_semana, data_inicio, data_fim, fase, foco_principal, meta_campo, meta_digital, meta_financeiro)
  VALUES
    (_campanha_id, 1,  v_inicio,      v_inicio + 6,  'pre_campanha',  'Estruturação e registro legal',         'Mapear bairros e recrutar equipe',           'Criar perfis + primeiros 5 posts',     'Abrir conta e definir orçamento'),
    (_campanha_id, 2,  v_inicio + 7,  v_inicio + 13, 'pre_campanha',  'Cadastro inicial e identidade visual',  'Iniciar cadastro de eleitores no SIGT',      'Publicar apresentação pessoal diária', 'Contratar gráfica'),
    (_campanha_id, 3,  v_inicio + 14, v_inicio + 20, 'pre_campanha',  'Treinamento de equipe e plano de bairro','Treinar 20 cabos eleitorais',               'Stories diários + 1 reels/semana',     'Primeira prestação interna'),
    (_campanha_id, 4,  v_inicio + 21, v_inicio + 27, 'lancamento',    'Lançamento oficial e visitas',          'Lançamento público + 50 visitas',            'Live de lançamento + cobertura',       'Primeira remessa de material'),
    (_campanha_id, 5,  v_inicio + 28, v_inicio + 34, 'lancamento',    'Mobilização nos bairros redutos',       '300 visitas e 100 apoiadores',               '3 posts/dia + grupos WhatsApp',        'Controle semanal de gastos'),
    (_campanha_id, 6,  v_inicio + 35, v_inicio + 41, 'lancamento',    'Plano de demandas ativas',              'Resolver 20 demandas prioritárias',          'Vídeos de entregas',                   'Negociar fornecedores'),
    (_campanha_id, 7,  v_inicio + 42, v_inicio + 48, 'consolidacao',  'Eventos e propostas',                   '2 eventos por bairro reduto',                'Programa de governo digital',          'Doações da rede'),
    (_campanha_id, 8,  v_inicio + 49, v_inicio + 55, 'consolidacao',  'Expansão para bairros de disputa',      '500 novos eleitores cadastrados',            'Anúncios pagos segmentados',           'Análise meio de campanha'),
    (_campanha_id, 9,  v_inicio + 56, v_inicio + 62, 'consolidacao',  'Carreatas e caminhadas',                '4 carreatas + 8 caminhadas',                 'Cobertura ao vivo',                    'Reforço de material'),
    (_campanha_id, 10, v_inicio + 63, v_inicio + 69, 'consolidacao',  'Pesquisa e ajuste de rota',             'Pesquisa qualitativa em 10 bairros',         'Reposicionamento se necessário',       'Reservar caixa final'),
    (_campanha_id, 11, v_inicio + 70, v_inicio + 76, 'reta_final',    'Mobilização total',                     '1000 visitas + comícios',                    'Bombardeio de conteúdo',               'Última remessa de material'),
    (_campanha_id, 12, v_inicio + 77, v_inicio + 83, 'reta_final',    'Boca de urna e fiscais',                'Treinar 1 fiscal por seção',                 'Mobilização do voto',                  'Pagar fornecedores'),
    (_campanha_id, 13, v_inicio + 84, v_inicio + 89, 'reta_final',    'Dia D e apuração',                      'Estrutura no dia da eleição',                'Cobertura ao vivo da apuração',        'Encerrar contas');

  -- Metas por fase
  INSERT INTO public.campanha_metas (campanha_id, fase, area, meta, indicador, valor_meta, ordem) VALUES
    (_campanha_id, 'pre_campanha',  'organizacao', 'Montar equipe completa',              'Pessoas na equipe',           5,    1),
    (_campanha_id, 'pre_campanha',  'campo',       'Cadastrar eleitores base',            'Eleitores no SIGT',           500,  2),
    (_campanha_id, 'pre_campanha',  'digital',     'Estruturar redes',                    'Perfis + primeiros seguidores',1000, 3),
    (_campanha_id, 'pre_campanha',  'financeiro',  'Definir orçamento',                   'Orçamento aprovado (R$)',     50000,4),
    (_campanha_id, 'lancamento',    'campo',       'Visitar bairros redutos',             'Visitas realizadas',          500,  5),
    (_campanha_id, 'lancamento',    'digital',     'Crescer base digital',                'Seguidores total',            5000, 6),
    (_campanha_id, 'consolidacao',  'campo',       'Expandir cobertura',                  'Bairros visitados',           30,   7),
    (_campanha_id, 'consolidacao',  'campo',       'Apoiadores ativos',                   'Apoiadores cadastrados',      300,  8),
    (_campanha_id, 'consolidacao',  'digital',     'Engajamento alto',                    'Interações/semana',           10000,9),
    (_campanha_id, 'reta_final',    'campo',       'Fiscais por seção',                   'Fiscais treinados',           100,  10),
    (_campanha_id, 'reta_final',    'campo',       'Meta de votos',                       'Votos recebidos',             3000, 11);

  -- Tarefas (90 dias) - geradas a partir de templates por fase
  -- PRÉ-CAMPANHA (dias 1-21)
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem) VALUES
    (_campanha_id, v_fase_pre, 1,  v_inicio,      1, 'organizacao', 'Definir coordenador geral de campanha', 'urgente', 1),
    (_campanha_id, v_fase_pre, 1,  v_inicio,      1, 'organizacao', 'Criar grupo de WhatsApp da equipe',     'alta',    2),
    (_campanha_id, v_fase_pre, 2,  v_inicio + 1,  1, 'juridico',    'Verificar elegibilidade e documentos',  'urgente', 3),
    (_campanha_id, v_fase_pre, 3,  v_inicio + 2,  1, 'organizacao', 'Mapear bairros prioritários da cidade', 'alta',    4),
    (_campanha_id, v_fase_pre, 4,  v_inicio + 3,  1, 'campo',       'Recrutar 5 lideranças por bairro reduto','alta',   5),
    (_campanha_id, v_fase_pre, 5,  v_inicio + 4,  1, 'digital',     'Criar perfis Instagram e Facebook',     'alta',    6),
    (_campanha_id, v_fase_pre, 6,  v_inicio + 5,  1, 'comunicacao', 'Definir slogan e bordões da campanha',  'alta',    7),
    (_campanha_id, v_fase_pre, 7,  v_inicio + 6,  1, 'financeiro',  'Abrir conta bancária de campanha',      'urgente', 8),
    (_campanha_id, v_fase_pre, 8,  v_inicio + 7,  2, 'dados',       'Importar base de eleitores no SIGT',    'alta',    9),
    (_campanha_id, v_fase_pre, 9,  v_inicio + 8,  2, 'comunicacao', 'Produzir identidade visual (logo/cores)','alta',  10),
    (_campanha_id, v_fase_pre, 10, v_inicio + 9,  2, 'digital',     'Publicar post de apresentação pessoal', 'media',  11),
    (_campanha_id, v_fase_pre, 11, v_inicio + 10, 2, 'campo',       'Primeira reunião com lideranças',       'alta',   12),
    (_campanha_id, v_fase_pre, 12, v_inicio + 11, 2, 'organizacao', 'Cronograma de visitas semana 3',        'media',  13),
    (_campanha_id, v_fase_pre, 13, v_inicio + 12, 2, 'logistica',   'Cotar fornecedores de gráfica',         'alta',   14),
    (_campanha_id, v_fase_pre, 14, v_inicio + 13, 2, 'financeiro',  'Aprovar orçamento da fase de lançamento','alta',  15),
    (_campanha_id, v_fase_pre, 15, v_inicio + 14, 3, 'campo',       'Treinamento de cabos eleitorais',       'alta',   16),
    (_campanha_id, v_fase_pre, 16, v_inicio + 15, 3, 'digital',     'Plano editorial das redes (1 mês)',     'media',  17),
    (_campanha_id, v_fase_pre, 17, v_inicio + 16, 3, 'comunicacao', 'Gravar vídeo de apresentação',          'alta',   18),
    (_campanha_id, v_fase_pre, 18, v_inicio + 17, 3, 'campo',       'Roteirizar 1ª caminhada',               'media',  19),
    (_campanha_id, v_fase_pre, 19, v_inicio + 18, 3, 'logistica',   'Receber primeira remessa de material',  'alta',   20),
    (_campanha_id, v_fase_pre, 20, v_inicio + 19, 3, 'organizacao', 'Reunião geral de alinhamento',          'alta',   21),
    (_campanha_id, v_fase_pre, 21, v_inicio + 20, 3, 'organizacao', 'Revisão pré-lançamento',                'urgente',22);

  -- LANÇAMENTO (22-45)
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem) VALUES
    (_campanha_id, v_fase_lanc, 22, v_inicio + 21, 4, 'comunicacao', 'EVENTO: Lançamento oficial',           'urgente', 23),
    (_campanha_id, v_fase_lanc, 23, v_inicio + 22, 4, 'digital',     'Live de lançamento nas redes',         'alta',    24),
    (_campanha_id, v_fase_lanc, 24, v_inicio + 23, 4, 'campo',       'Primeiro porta-a-porta (50 visitas)',  'alta',    25),
    (_campanha_id, v_fase_lanc, 26, v_inicio + 25, 4, 'campo',       'Visitas em bairros redutos',           'alta',    26),
    (_campanha_id, v_fase_lanc, 28, v_inicio + 27, 4, 'comunicacao', 'Distribuir santinhos em pontos chave', 'media',   27),
    (_campanha_id, v_fase_lanc, 30, v_inicio + 29, 5, 'campo',       'Carreata no bairro reduto principal',  'alta',    28),
    (_campanha_id, v_fase_lanc, 32, v_inicio + 31, 5, 'digital',     'Campanha de anúncios pagos #1',        'alta',    29),
    (_campanha_id, v_fase_lanc, 35, v_inicio + 34, 5, 'organizacao', 'Reunião de avaliação semanal',         'media',   30),
    (_campanha_id, v_fase_lanc, 37, v_inicio + 36, 6, 'campo',       'Atender demandas urgentes registradas','alta',    31),
    (_campanha_id, v_fase_lanc, 40, v_inicio + 39, 6, 'comunicacao', 'Vídeo: entregas e demandas resolvidas','media',   32),
    (_campanha_id, v_fase_lanc, 42, v_inicio + 41, 6, 'financeiro',  'Fechamento financeiro do mês',         'alta',    33),
    (_campanha_id, v_fase_lanc, 45, v_inicio + 44, 6, 'organizacao', 'Revisão estratégica (45 dias)',        'urgente', 34);

  -- CONSOLIDAÇÃO (46-75)
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem) VALUES
    (_campanha_id, v_fase_cons, 46, v_inicio + 45, 7, 'comunicacao', 'Lançar programa de governo',           'urgente', 35),
    (_campanha_id, v_fase_cons, 48, v_inicio + 47, 7, 'campo',       'Eventos em 2 bairros novos',           'alta',    36),
    (_campanha_id, v_fase_cons, 50, v_inicio + 49, 8, 'campo',       'Cadastrar 500 novos eleitores',        'alta',    37),
    (_campanha_id, v_fase_cons, 52, v_inicio + 51, 8, 'digital',     'Anúncios segmentados por bairro',      'alta',    38),
    (_campanha_id, v_fase_cons, 55, v_inicio + 54, 8, 'campo',       'Reunião com lideranças religiosas',    'alta',    39),
    (_campanha_id, v_fase_cons, 58, v_inicio + 57, 9, 'campo',       'Carreata #2 (bairros disputa)',        'alta',    40),
    (_campanha_id, v_fase_cons, 60, v_inicio + 59, 9, 'comunicacao', 'Debate público (preparação)',          'urgente', 41),
    (_campanha_id, v_fase_cons, 62, v_inicio + 61, 9, 'campo',       'Caminhada bairro central',             'alta',    42),
    (_campanha_id, v_fase_cons, 65, v_inicio + 64, 10,'dados',       'Pesquisa qualitativa em 10 bairros',   'alta',    43),
    (_campanha_id, v_fase_cons, 68, v_inicio + 67, 10,'organizacao', 'Ajuste de rota com base em pesquisa',  'urgente', 44),
    (_campanha_id, v_fase_cons, 70, v_inicio + 69, 10,'financeiro',  'Reservar caixa para reta final',       'alta',    45),
    (_campanha_id, v_fase_cons, 73, v_inicio + 72, 10,'comunicacao', 'Material de TV/rádio (HGPE)',          'alta',    46),
    (_campanha_id, v_fase_cons, 75, v_inicio + 74, 10,'organizacao', 'Reunião pré-reta final',               'urgente', 47);

  -- RETA FINAL (76-90)
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem) VALUES
    (_campanha_id, v_fase_reta, 76, v_inicio + 75, 11,'campo',       'Mobilização total nos bairros',        'urgente', 48),
    (_campanha_id, v_fase_reta, 78, v_inicio + 77, 11,'comunicacao', 'Comício principal',                    'urgente', 49),
    (_campanha_id, v_fase_reta, 80, v_inicio + 79, 11,'digital',     'Bombardeio de conteúdo (3x/dia)',      'urgente', 50),
    (_campanha_id, v_fase_reta, 82, v_inicio + 81, 12,'organizacao', 'Treinar 1 fiscal por seção eleitoral', 'urgente', 51),
    (_campanha_id, v_fase_reta, 84, v_inicio + 83, 12,'campo',       'Mobilização para o voto (porta-a-porta)','urgente',52),
    (_campanha_id, v_fase_reta, 86, v_inicio + 85, 12,'logistica',   'Logística do dia da eleição',          'urgente', 53),
    (_campanha_id, v_fase_reta, 88, v_inicio + 87, 13,'comunicacao', 'Mensagem final aos eleitores',         'urgente', 54),
    (_campanha_id, v_fase_reta, 89, v_inicio + 88, 13,'organizacao', 'Briefing dos fiscais',                 'urgente', 55),
    (_campanha_id, v_fase_reta, 90, v_inicio + 89, 13,'organizacao', 'DIA DA ELEIÇÃO - operação completa',   'urgente', 56);
END $$;