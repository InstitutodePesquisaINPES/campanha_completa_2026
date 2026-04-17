-- =====================================================================
-- TABELA: campanha_parametros (configuração editável do gerador 90 dias)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.campanha_parametros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID NOT NULL UNIQUE REFERENCES public.campanhas(id) ON DELETE CASCADE,

  -- Escalas por cargo (multiplicadores de volume)
  escala_vereador          NUMERIC NOT NULL DEFAULT 1.0,
  escala_prefeito          NUMERIC NOT NULL DEFAULT 2.0,
  escala_vice_prefeito     NUMERIC NOT NULL DEFAULT 1.5,
  escala_deputado_estadual NUMERIC NOT NULL DEFAULT 3.0,
  escala_deputado_federal  NUMERIC NOT NULL DEFAULT 4.0,
  escala_senador           NUMERIC NOT NULL DEFAULT 5.0,
  escala_governador        NUMERIC NOT NULL DEFAULT 6.0,
  escala_vice_governador   NUMERIC NOT NULL DEFAULT 4.0,
  escala_presidente        NUMERIC NOT NULL DEFAULT 10.0,

  -- Percentuais de cálculo (0 a 1)
  pct_cadastro_sobre_votos NUMERIC NOT NULL DEFAULT 0.30,
  pct_visitas_sobre_votos  NUMERIC NOT NULL DEFAULT 0.50,
  votos_por_fiscal         INTEGER NOT NULL DEFAULT 250,
  custo_por_voto_reais     NUMERIC NOT NULL DEFAULT 4.0,

  -- Mínimos (piso)
  min_cadastro             INTEGER NOT NULL DEFAULT 50,
  min_visitas              INTEGER NOT NULL DEFAULT 100,
  min_visitas_semana       INTEGER NOT NULL DEFAULT 20,
  min_fiscais              INTEGER NOT NULL DEFAULT 5,
  min_orcamento_reais      NUMERIC NOT NULL DEFAULT 10000,

  -- Marcos legais TSE — dias antes da eleição (D-x) e flag de ativação
  tse_registro_dias        INTEGER NOT NULL DEFAULT 50,  tse_registro_ativo        BOOLEAN NOT NULL DEFAULT true,
  tse_propaganda_dias      INTEGER NOT NULL DEFAULT 45,  tse_propaganda_ativo      BOOLEAN NOT NULL DEFAULT true,
  tse_hgpe_dias            INTEGER NOT NULL DEFAULT 35,  tse_hgpe_ativo            BOOLEAN NOT NULL DEFAULT true,
  tse_prestacao_dias       INTEGER NOT NULL DEFAULT 30,  tse_prestacao_ativo       BOOLEAN NOT NULL DEFAULT true,
  tse_debates_dias         INTEGER NOT NULL DEFAULT 20,  tse_debates_ativo         BOOLEAN NOT NULL DEFAULT true,

  -- Tarefas extras por tipo de cargo (JSON editável)
  -- formato: [{ "dia": 5, "semana": 1, "area": "organizacao", "titulo": "...", "prioridade": "alta" }]
  tarefas_executivo  JSONB NOT NULL DEFAULT '[
    {"dia":5,"semana":1,"area":"organizacao","titulo":"Montar equipe de programa de governo","prioridade":"alta"},
    {"dia":10,"semana":2,"area":"comunicacao","titulo":"Definir 5 eixos do programa de governo","prioridade":"alta"},
    {"dia":15,"semana":3,"area":"organizacao","titulo":"Comitês temáticos por área (saúde, educação, segurança)","prioridade":"alta"}
  ]'::jsonb,
  tarefas_legislativo JSONB NOT NULL DEFAULT '[
    {"dia":3,"semana":1,"area":"organizacao","titulo":"Definir base eleitoral por região","prioridade":"alta"},
    {"dia":10,"semana":2,"area":"organizacao","titulo":"Articular apoios em municípios chave","prioridade":"alta"},
    {"dia":20,"semana":3,"area":"comunicacao","titulo":"Pautas legislativas prioritárias","prioridade":"alta"}
  ]'::jsonb,

  -- Template de tarefas por município de foco (JSON, usa {municipio} como placeholder)
  tarefas_municipio_foco JSONB NOT NULL DEFAULT '[
    {"dia":25,"semana":4,"area":"campo","titulo":"Lançamento regional em {municipio}","prioridade":"alta","fase":"lancamento"},
    {"dia":55,"semana":8,"area":"campo","titulo":"Visita estratégica em {municipio}","prioridade":"alta","fase":"consolidacao"}
  ]'::jsonb,

  preservar_concluidas BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campanha_parametros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view campanha_parametros" ON public.campanha_parametros
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert campanha_parametros" ON public.campanha_parametros
  FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update campanha_parametros" ON public.campanha_parametros
  FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete campanha_parametros" ON public.campanha_parametros
  FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER update_campanha_parametros_updated_at
  BEFORE UPDATE ON public.campanha_parametros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cria parâmetros default para campanhas já existentes
INSERT INTO public.campanha_parametros (campanha_id)
SELECT id FROM public.campanhas
WHERE id NOT IN (SELECT campanha_id FROM public.campanha_parametros)
ON CONFLICT DO NOTHING;

-- Função utilitária: garante linha de parâmetros existente
CREATE OR REPLACE FUNCTION public.inicializar_parametros_campanha(_campanha_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.campanha_parametros (campanha_id)
  VALUES (_campanha_id)
  ON CONFLICT (campanha_id) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.campanha_parametros WHERE campanha_id = _campanha_id;
  END IF;
  RETURN v_id;
END;
$$;

-- =====================================================================
-- gerar_plano_90_dias v3: lê parâmetros editáveis
-- =====================================================================
CREATE OR REPLACE FUNCTION public.gerar_plano_90_dias(_campanha_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio date;
  v_eleicao date;
  v_cargo cargo_eleitoral;
  v_meta_votos integer;
  v_municipios_foco uuid[];
  v_fase_pre uuid; v_fase_lanc uuid; v_fase_cons uuid; v_fase_reta uuid;
  v_mun_id uuid; v_mun_nome text;
  v_meta_cadastro integer;
  v_meta_visitas integer;
  v_visitas_semana integer;
  v_fiscais_estimados integer;
  v_orcamento_min numeric;
  v_escala numeric;
  v_concluidas_titulos text[];
  p RECORD;
  t JSONB;
  v_fase_alvo uuid;
  v_dia_marco int;
BEGIN
  SELECT data_inicio_plano, data_eleicao, cargo, COALESCE(meta_votos, 3000), COALESCE(municipios_foco_ids, '{}')
    INTO v_inicio, v_eleicao, v_cargo, v_meta_votos, v_municipios_foco
  FROM public.campanhas WHERE id = _campanha_id;

  IF v_inicio IS NULL THEN RAISE EXCEPTION 'Campanha não encontrada'; END IF;

  -- Garante linha de parâmetros e carrega
  PERFORM public.inicializar_parametros_campanha(_campanha_id);
  SELECT * INTO p FROM public.campanha_parametros WHERE campanha_id = _campanha_id;

  -- Escala por cargo (vinda dos parâmetros)
  v_escala := CASE v_cargo
    WHEN 'vereador' THEN p.escala_vereador
    WHEN 'prefeito' THEN p.escala_prefeito
    WHEN 'vice_prefeito' THEN p.escala_vice_prefeito
    WHEN 'deputado_estadual' THEN p.escala_deputado_estadual
    WHEN 'deputado_federal' THEN p.escala_deputado_federal
    WHEN 'senador' THEN p.escala_senador
    WHEN 'governador' THEN p.escala_governador
    WHEN 'vice_governador' THEN p.escala_vice_governador
    WHEN 'presidente' THEN p.escala_presidente
    ELSE 1.0
  END;

  v_meta_cadastro     := GREATEST(p.min_cadastro, (v_meta_votos * p.pct_cadastro_sobre_votos)::int);
  v_meta_visitas      := GREATEST(p.min_visitas, (v_meta_votos * p.pct_visitas_sobre_votos)::int);
  v_visitas_semana    := GREATEST(p.min_visitas_semana, (v_meta_visitas / 13)::int);
  v_fiscais_estimados := GREATEST(p.min_fiscais, (v_meta_votos / NULLIF(p.votos_por_fiscal,0))::int);
  v_orcamento_min     := GREATEST(p.min_orcamento_reais, v_meta_votos * p.custo_por_voto_reais * v_escala);

  -- Preservação configurável
  IF p.preservar_concluidas THEN
    SELECT COALESCE(array_agg(titulo), '{}') INTO v_concluidas_titulos
    FROM public.campanha_tarefas
    WHERE campanha_id = _campanha_id AND status = 'concluida';
    DELETE FROM public.campanha_tarefas WHERE campanha_id = _campanha_id AND status <> 'concluida';
  ELSE
    v_concluidas_titulos := '{}';
    DELETE FROM public.campanha_tarefas WHERE campanha_id = _campanha_id;
  END IF;

  DELETE FROM public.campanha_metas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_semanas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_fases WHERE campanha_id = _campanha_id;

  -- 4 FASES
  INSERT INTO public.campanha_fases (campanha_id, fase, nome, data_inicio, data_fim, foco, ordem) VALUES
    (_campanha_id, 'pre_campanha', 'Pré-campanha', v_inicio,        v_inicio + 20, 'Estruturação, equipe, identidade visual e cadastro de base', 1),
    (_campanha_id, 'lancamento',   'Lançamento',   v_inicio + 21,   v_inicio + 44, 'Apresentação pública e mobilização inicial', 2),
    (_campanha_id, 'consolidacao', 'Consolidação', v_inicio + 45,   v_inicio + 74, 'Expansão por bairros, eventos e propostas', 3),
    (_campanha_id, 'reta_final',   'Reta Final',   v_inicio + 75,   v_inicio + 89, 'Conversão, mobilização total e dia da eleição', 4);

  SELECT id INTO v_fase_pre  FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'pre_campanha';
  SELECT id INTO v_fase_lanc FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'lancamento';
  SELECT id INTO v_fase_cons FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'consolidacao';
  SELECT id INTO v_fase_reta FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'reta_final';

  -- 13 SEMANAS
  INSERT INTO public.campanha_semanas (campanha_id, numero_semana, data_inicio, data_fim, fase, foco_principal, meta_campo, meta_digital, meta_financeiro) VALUES
    (_campanha_id, 1,  v_inicio,      v_inicio + 6,  'pre_campanha', 'Estruturação e registro legal',          format('Mapear bairros e recrutar %s pessoas', GREATEST(5,(v_escala*5)::int)),    'Criar perfis + 5 posts iniciais',       format('Definir orçamento mínimo R$ %s', to_char(v_orcamento_min, 'FM999G999G999'))),
    (_campanha_id, 2,  v_inicio + 7,  v_inicio + 13, 'pre_campanha', 'Cadastro inicial e identidade visual',   format('Cadastrar %s eleitores no SIGT', v_meta_cadastro / 6),                     'Apresentação pessoal diária',           'Contratar gráfica e fornecedores'),
    (_campanha_id, 3,  v_inicio + 14, v_inicio + 20, 'pre_campanha', 'Treinamento e plano de bairro',          format('Treinar %s cabos eleitorais', GREATEST(10,(v_escala*10)::int)),           'Stories diários + 1 reels/semana',      'Primeira prestação interna'),
    (_campanha_id, 4,  v_inicio + 21, v_inicio + 27, 'lancamento',   'Lançamento oficial e visitas',           format('Lançamento + %s visitas', v_visitas_semana),                               'Live de lançamento + cobertura',        'Primeira remessa de material'),
    (_campanha_id, 5,  v_inicio + 28, v_inicio + 34, 'lancamento',   'Mobilização nos bairros redutos',        format('%s visitas e %s apoiadores', v_visitas_semana, (v_meta_cadastro/4)::int), '3 posts/dia + grupos WhatsApp',         'Controle semanal de gastos'),
    (_campanha_id, 6,  v_inicio + 35, v_inicio + 41, 'lancamento',   'Plano de demandas ativas',               'Resolver 20 demandas prioritárias',                                              'Vídeos de entregas e propostas',        'Negociar com fornecedores'),
    (_campanha_id, 7,  v_inicio + 42, v_inicio + 48, 'consolidacao', 'Eventos e propostas',                    format('2 eventos + %s visitas', v_visitas_semana),                                'Programa de governo digital',           'Doações da rede de apoio'),
    (_campanha_id, 8,  v_inicio + 49, v_inicio + 55, 'consolidacao', 'Expansão para bairros de disputa',       format('%s novos cadastros', (v_meta_cadastro/3)::int),                            'Anúncios segmentados por bairro',       'Análise meio de campanha'),
    (_campanha_id, 9,  v_inicio + 56, v_inicio + 62, 'consolidacao', 'Carreatas e caminhadas',                 '4 carreatas + 8 caminhadas',                                                     'Cobertura ao vivo das ações',           'Reforço de material'),
    (_campanha_id, 10, v_inicio + 63, v_inicio + 69, 'consolidacao', 'Pesquisa e ajuste de rota',              'Pesquisa qualitativa em 10 bairros',                                             'Reposicionamento se necessário',        'Reservar caixa final'),
    (_campanha_id, 11, v_inicio + 70, v_inicio + 76, 'reta_final',   'Mobilização total',                      format('%s visitas + comícios', v_visitas_semana * 2),                             'Bombardeio de conteúdo',                'Última remessa de material'),
    (_campanha_id, 12, v_inicio + 77, v_inicio + 83, 'reta_final',   'Boca de urna e fiscais',                 format('Treinar %s fiscais', v_fiscais_estimados),                                 'Mobilização do voto',                   'Pagar fornecedores'),
    (_campanha_id, 13, v_inicio + 84, v_inicio + 89, 'reta_final',   'Dia D e apuração',                       'Estrutura no dia da eleição',                                                    'Cobertura ao vivo da apuração',         'Encerrar contas');

  -- METAS
  INSERT INTO public.campanha_metas (campanha_id, fase, area, meta, indicador, valor_meta, ordem) VALUES
    (_campanha_id, 'pre_campanha', 'organizacao','Montar equipe completa',           'Pessoas na equipe',        GREATEST(5,(v_escala*5)::int),       1),
    (_campanha_id, 'pre_campanha', 'campo',      'Cadastrar eleitores base',         'Eleitores no SIGT',        (v_meta_cadastro/3)::int,            2),
    (_campanha_id, 'pre_campanha', 'digital',    'Estruturar redes',                 'Seguidores iniciais',      GREATEST(500,(v_escala*1000)::int),  3),
    (_campanha_id, 'pre_campanha', 'financeiro', 'Definir orçamento',                'Orçamento aprovado (R$)',  v_orcamento_min,                     4),
    (_campanha_id, 'lancamento',   'campo',      'Visitar bairros redutos',          'Visitas realizadas',       v_visitas_semana * 3,                5),
    (_campanha_id, 'lancamento',   'digital',    'Crescer base digital',             'Seguidores total',         GREATEST(2500,(v_escala*5000)::int), 6),
    (_campanha_id, 'consolidacao', 'campo',      'Expandir cobertura',               'Bairros visitados',        GREATEST(15,(v_escala*15)::int),     7),
    (_campanha_id, 'consolidacao', 'campo',      'Apoiadores ativos',                'Apoiadores cadastrados',   v_meta_cadastro,                     8),
    (_campanha_id, 'consolidacao', 'digital',    'Engajamento alto',                 'Interações/semana',        GREATEST(5000,(v_escala*10000)::int),9),
    (_campanha_id, 'reta_final',   'campo',      'Fiscais por seção',                'Fiscais treinados',        v_fiscais_estimados,                 10),
    (_campanha_id, 'reta_final',   'campo',      'Meta de votos',                    'Votos recebidos',          v_meta_votos,                        11);

  -- TAREFAS BASE (idênticas à v2)
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
  SELECT _campanha_id, v_fase_pre, dia, v_inicio + (dia - 1), semana, area::area_campanha, titulo, prioridade::prioridade_demanda, ord FROM (VALUES
    (1,  1, 'organizacao', 'Definir coordenador geral de campanha', 'urgente', 1),
    (1,  1, 'organizacao', 'Criar grupo de WhatsApp da equipe',     'alta',    2),
    (2,  1, 'juridico',    'Verificar elegibilidade e documentos',  'urgente', 3),
    (3,  1, 'organizacao', 'Mapear bairros prioritários da cidade', 'alta',    4),
    (4,  1, 'campo',       'Recrutar lideranças por bairro reduto', 'alta',    5),
    (5,  1, 'digital',     'Criar perfis Instagram e Facebook',     'alta',    6),
    (6,  1, 'comunicacao', 'Definir slogan e bordões da campanha',  'alta',    7),
    (7,  1, 'financeiro',  'Abrir conta bancária de campanha',      'urgente', 8),
    (8,  2, 'dados',       'Importar base de eleitores no SIGT',    'alta',    9),
    (9,  2, 'comunicacao', 'Produzir identidade visual (logo/cores)','alta',  10),
    (10, 2, 'digital',     'Publicar post de apresentação pessoal', 'media',  11),
    (11, 2, 'campo',       'Primeira reunião com lideranças',       'alta',   12),
    (12, 2, 'organizacao', 'Cronograma de visitas semana 3',        'media',  13),
    (13, 2, 'logistica',   'Cotar fornecedores de gráfica',         'alta',   14),
    (14, 2, 'financeiro',  'Aprovar orçamento da fase de lançamento','alta',  15),
    (15, 3, 'campo',       'Treinamento de cabos eleitorais',       'alta',   16),
    (16, 3, 'digital',     'Plano editorial das redes (1 mês)',     'media',  17),
    (17, 3, 'comunicacao', 'Gravar vídeo de apresentação',          'alta',   18),
    (18, 3, 'campo',       'Roteirizar 1ª caminhada',               'media',  19),
    (19, 3, 'logistica',   'Receber primeira remessa de material',  'alta',   20),
    (20, 3, 'organizacao', 'Reunião geral de alinhamento',          'alta',   21),
    (21, 3, 'organizacao', 'Revisão pré-lançamento',                'urgente',22)
  ) AS t(dia, semana, area, titulo, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
  SELECT _campanha_id, v_fase_lanc, dia, v_inicio + (dia - 1), semana, area::area_campanha, titulo, prioridade::prioridade_demanda, ord FROM (VALUES
    (22, 4, 'comunicacao', 'EVENTO: Lançamento oficial',           'urgente', 23),
    (23, 4, 'digital',     'Live de lançamento nas redes',         'alta',    24),
    (24, 4, 'campo',       'Primeiro porta-a-porta',               'alta',    25),
    (26, 4, 'campo',       'Visitas em bairros redutos',           'alta',    26),
    (28, 4, 'comunicacao', 'Distribuir santinhos em pontos chave', 'media',   27),
    (30, 5, 'campo',       'Carreata no bairro reduto principal',  'alta',    28),
    (32, 5, 'digital',     'Campanha de anúncios pagos #1',        'alta',    29),
    (35, 5, 'organizacao', 'Reunião de avaliação semanal',         'media',   30),
    (37, 6, 'campo',       'Atender demandas urgentes registradas','alta',    31),
    (40, 6, 'comunicacao', 'Vídeo: entregas e demandas resolvidas','media',   32),
    (42, 6, 'financeiro',  'Fechamento financeiro do mês',         'alta',    33),
    (45, 6, 'organizacao', 'Revisão estratégica (45 dias)',        'urgente', 34)
  ) AS t(dia, semana, area, titulo, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
  SELECT _campanha_id, v_fase_cons, dia, v_inicio + (dia - 1), semana, area::area_campanha, titulo, prioridade::prioridade_demanda, ord FROM (VALUES
    (46, 7, 'comunicacao', 'Lançar programa de governo',           'urgente', 35),
    (48, 7, 'campo',       'Eventos em 2 bairros novos',           'alta',    36),
    (50, 8, 'campo',       'Cadastrar novos eleitores em massa',   'alta',    37),
    (52, 8, 'digital',     'Anúncios segmentados por bairro',      'alta',    38),
    (55, 8, 'campo',       'Reunião com lideranças religiosas',    'alta',    39),
    (58, 9, 'campo',       'Carreata #2 (bairros disputa)',        'alta',    40),
    (60, 9, 'comunicacao', 'Debate público (preparação)',          'urgente', 41),
    (62, 9, 'campo',       'Caminhada bairro central',             'alta',    42),
    (65, 10,'dados',       'Pesquisa qualitativa em 10 bairros',   'alta',    43),
    (68, 10,'organizacao', 'Ajuste de rota com base em pesquisa',  'urgente', 44),
    (70, 10,'financeiro',  'Reservar caixa para reta final',       'alta',    45),
    (73, 10,'comunicacao', 'Material de TV/rádio (HGPE)',          'alta',    46),
    (75, 10,'organizacao', 'Reunião pré-reta final',               'urgente', 47)
  ) AS t(dia, semana, area, titulo, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
  SELECT _campanha_id, v_fase_reta, dia, v_inicio + (dia - 1), semana, area::area_campanha, titulo, prioridade::prioridade_demanda, ord FROM (VALUES
    (76, 11,'campo',       'Mobilização total nos bairros',        'urgente', 48),
    (78, 11,'comunicacao', 'Comício principal',                    'urgente', 49),
    (80, 11,'digital',     'Bombardeio de conteúdo (3x/dia)',      'urgente', 50),
    (82, 12,'organizacao', 'Treinar fiscais por seção eleitoral',  'urgente', 51),
    (84, 12,'campo',       'Mobilização porta-a-porta final',      'urgente', 52),
    (86, 12,'logistica',   'Logística do dia da eleição',          'urgente', 53),
    (88, 13,'comunicacao', 'Mensagem final aos eleitores',         'urgente', 54),
    (89, 13,'organizacao', 'Briefing dos fiscais',                 'urgente', 55),
    (90, 13,'organizacao', 'DIA DA ELEIÇÃO - operação completa',   'urgente', 56)
  ) AS t(dia, semana, area, titulo, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  -- TAREFAS EXTRAS POR CARGO (lendo JSON dos parâmetros)
  IF v_cargo IN ('prefeito','vice_prefeito','governador','vice_governador','presidente') THEN
    FOR t IN SELECT * FROM jsonb_array_elements(p.tarefas_executivo) LOOP
      INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
      SELECT _campanha_id, v_fase_pre,
             (t->>'dia')::int, v_inicio + ((t->>'dia')::int - 1),
             COALESCE((t->>'semana')::int, 1),
             (t->>'area')::area_campanha,
             (t->>'titulo'),
             COALESCE((t->>'prioridade'), 'alta')::prioridade_demanda, 100
      WHERE (t->>'titulo') <> ALL(v_concluidas_titulos);
    END LOOP;
  END IF;

  IF v_cargo IN ('deputado_estadual','deputado_federal','senador') THEN
    FOR t IN SELECT * FROM jsonb_array_elements(p.tarefas_legislativo) LOOP
      INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
      SELECT _campanha_id, v_fase_pre,
             (t->>'dia')::int, v_inicio + ((t->>'dia')::int - 1),
             COALESCE((t->>'semana')::int, 1),
             (t->>'area')::area_campanha,
             (t->>'titulo'),
             COALESCE((t->>'prioridade'), 'alta')::prioridade_demanda, 110
      WHERE (t->>'titulo') <> ALL(v_concluidas_titulos);
    END LOOP;
  END IF;

  -- TAREFAS POR MUNICÍPIO DE FOCO (template JSON com {municipio})
  IF v_municipios_foco IS NOT NULL AND array_length(v_municipios_foco, 1) > 0 THEN
    FOREACH v_mun_id IN ARRAY v_municipios_foco LOOP
      SELECT nome INTO v_mun_nome FROM public.municipios WHERE id = v_mun_id;
      IF v_mun_nome IS NOT NULL THEN
        FOR t IN SELECT * FROM jsonb_array_elements(p.tarefas_municipio_foco) LOOP
          v_fase_alvo := CASE COALESCE(t->>'fase','lancamento')
            WHEN 'pre_campanha' THEN v_fase_pre
            WHEN 'lancamento'   THEN v_fase_lanc
            WHEN 'consolidacao' THEN v_fase_cons
            WHEN 'reta_final'   THEN v_fase_reta
            ELSE v_fase_lanc END;
          INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
          SELECT _campanha_id, v_fase_alvo,
                 (t->>'dia')::int, v_inicio + ((t->>'dia')::int - 1),
                 COALESCE((t->>'semana')::int, 1),
                 (t->>'area')::area_campanha,
                 replace((t->>'titulo'), '{municipio}', v_mun_nome),
                 COALESCE((t->>'prioridade'),'alta')::prioridade_demanda, 200
          WHERE replace((t->>'titulo'), '{municipio}', v_mun_nome) <> ALL(v_concluidas_titulos);
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- MARCOS LEGAIS TSE (configuráveis e ligáveis)
  IF p.tse_registro_ativo AND v_eleicao - p.tse_registro_dias BETWEEN v_inicio AND v_inicio + 89 THEN
    v_dia_marco := (v_eleicao - p.tse_registro_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= 21 THEN v_fase_pre WHEN v_dia_marco <= 45 THEN v_fase_lanc WHEN v_dia_marco <= 75 THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_registro_dias,
           GREATEST(1,LEAST(13,((v_dia_marco-1)/7+1)::int)),
           'juridico'::area_campanha, format('TSE: Registro de candidatura (D-%s)', p.tse_registro_dias),
           'urgente'::prioridade_demanda, 300
    WHERE format('TSE: Registro de candidatura (D-%s)', p.tse_registro_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_propaganda_ativo AND v_eleicao - p.tse_propaganda_dias BETWEEN v_inicio AND v_inicio + 89 THEN
    v_dia_marco := (v_eleicao - p.tse_propaganda_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= 21 THEN v_fase_pre WHEN v_dia_marco <= 45 THEN v_fase_lanc WHEN v_dia_marco <= 75 THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_propaganda_dias,
           GREATEST(1,LEAST(13,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Início da propaganda eleitoral (D-%s)', p.tse_propaganda_dias),
           'urgente'::prioridade_demanda, 301
    WHERE format('TSE: Início da propaganda eleitoral (D-%s)', p.tse_propaganda_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_hgpe_ativo AND v_eleicao - p.tse_hgpe_dias BETWEEN v_inicio AND v_inicio + 89
     AND v_cargo IN ('prefeito','vice_prefeito','governador','vice_governador','senador','deputado_estadual','deputado_federal','presidente') THEN
    v_dia_marco := (v_eleicao - p.tse_hgpe_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= 21 THEN v_fase_pre WHEN v_dia_marco <= 45 THEN v_fase_lanc WHEN v_dia_marco <= 75 THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_hgpe_dias,
           GREATEST(1,LEAST(13,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Início HGPE rádio e TV (D-%s)', p.tse_hgpe_dias),
           'urgente'::prioridade_demanda, 302
    WHERE format('TSE: Início HGPE rádio e TV (D-%s)', p.tse_hgpe_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_prestacao_ativo AND v_eleicao - p.tse_prestacao_dias BETWEEN v_inicio AND v_inicio + 89 THEN
    v_dia_marco := (v_eleicao - p.tse_prestacao_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= 21 THEN v_fase_pre WHEN v_dia_marco <= 45 THEN v_fase_lanc WHEN v_dia_marco <= 75 THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_prestacao_dias,
           GREATEST(1,LEAST(13,((v_dia_marco-1)/7+1)::int)),
           'financeiro'::area_campanha, format('TSE: Prestação de contas parcial (D-%s)', p.tse_prestacao_dias),
           'urgente'::prioridade_demanda, 303
    WHERE format('TSE: Prestação de contas parcial (D-%s)', p.tse_prestacao_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_debates_ativo AND v_eleicao - p.tse_debates_dias BETWEEN v_inicio AND v_inicio + 89
     AND v_cargo IN ('prefeito','governador','senador','presidente','deputado_estadual','deputado_federal') THEN
    v_dia_marco := (v_eleicao - p.tse_debates_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= 21 THEN v_fase_pre WHEN v_dia_marco <= 45 THEN v_fase_lanc WHEN v_dia_marco <= 75 THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_debates_dias,
           GREATEST(1,LEAST(13,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Período de debates oficiais (D-%s)', p.tse_debates_dias),
           'alta'::prioridade_demanda, 304
    WHERE format('TSE: Período de debates oficiais (D-%s)', p.tse_debates_dias) <> ALL(v_concluidas_titulos);
  END IF;

END;
$$;