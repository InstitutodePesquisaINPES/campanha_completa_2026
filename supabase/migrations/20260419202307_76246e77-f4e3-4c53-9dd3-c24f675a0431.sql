CREATE OR REPLACE FUNCTION public.gerar_plano_90_dias(_campanha_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inicio date; v_eleicao date; v_cargo cargo_eleitoral;
  v_meta_votos integer; v_municipios_foco uuid[];
  v_mun_id uuid; v_mun_nome text;
  v_meta_cadastro integer; v_meta_visitas integer; v_visitas_semana integer;
  v_fiscais_estimados integer; v_orcamento_min numeric; v_escala numeric;
  v_concluidas_titulos text[]; p RECORD; t JSONB;
  v_fase_alvo uuid; v_dia_marco int;
  v_duracao int; v_num_fases int; v_num_semanas int;
  v_fim_pre int; v_fim_lanc int; v_fim_cons int;
  v_fase_pre uuid; v_fase_lanc uuid; v_fase_cons uuid; v_fase_reta uuid;
  i int; v_semana_inicio int; v_semana_fim int;
  v_codigo_fase_semana fase_campanha;
BEGIN
  SELECT data_inicio_plano, data_eleicao, cargo, COALESCE(meta_votos, 3000), COALESCE(municipios_foco_ids, '{}')
    INTO v_inicio, v_eleicao, v_cargo, v_meta_votos, v_municipios_foco
  FROM public.campanhas WHERE id = _campanha_id;

  IF v_inicio IS NULL THEN RAISE EXCEPTION 'Campanha não encontrada'; END IF;

  PERFORM public.inicializar_parametros_campanha(_campanha_id);
  SELECT * INTO p FROM public.campanha_parametros WHERE campanha_id = _campanha_id;

  v_duracao := GREATEST(30, COALESCE(p.duracao_dias, 90));
  v_num_fases := GREATEST(3, LEAST(8, COALESCE(p.num_fases, 4)));
  v_num_semanas := CEIL(v_duracao::numeric / 7)::int;

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
  v_visitas_semana    := GREATEST(p.min_visitas_semana, (v_meta_visitas / GREATEST(1,v_num_semanas))::int);
  v_fiscais_estimados := GREATEST(p.min_fiscais, (v_meta_votos / NULLIF(p.votos_por_fiscal,0))::int);
  v_orcamento_min     := GREATEST(p.min_orcamento_reais, v_meta_votos * p.custo_por_voto_reais * v_escala);

  IF p.preservar_concluidas THEN
    SELECT COALESCE(array_agg(titulo), '{}') INTO v_concluidas_titulos
    FROM public.campanha_tarefas WHERE campanha_id = _campanha_id AND status = 'concluida';
    DELETE FROM public.campanha_tarefas WHERE campanha_id = _campanha_id AND status <> 'concluida';
  ELSE
    v_concluidas_titulos := '{}';
    DELETE FROM public.campanha_tarefas WHERE campanha_id = _campanha_id;
  END IF;

  DELETE FROM public.campanha_metas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_semanas WHERE campanha_id = _campanha_id;
  DELETE FROM public.campanha_fases WHERE campanha_id = _campanha_id;

  v_fim_pre  := (v_duracao * 0.23)::int;
  v_fim_lanc := (v_duracao * 0.50)::int;
  v_fim_cons := (v_duracao * 0.83)::int;

  -- 4 FASES (sem RETURNING para evitar erro multi-row)
  INSERT INTO public.campanha_fases (campanha_id, fase, nome, data_inicio, data_fim, foco, ordem) VALUES
    (_campanha_id, 'pre_campanha', 'Pré-campanha · Estruturação', v_inicio,                   v_inicio + v_fim_pre,  'Diagnóstico, equipe, identidade visual, base de eleitores e mapeamento territorial', 1),
    (_campanha_id, 'lancamento',   'Lançamento · Mobilização',    v_inicio + v_fim_pre + 1,   v_inicio + v_fim_lanc, 'Apresentação pública, ativação de redutos e expansão inicial', 2),
    (_campanha_id, 'consolidacao','Consolidação · Expansão',     v_inicio + v_fim_lanc + 1,  v_inicio + v_fim_cons, 'Programa de governo, eventos, debates, anúncios segmentados', 3),
    (_campanha_id, 'reta_final',   'Reta Final · Conversão',      v_inicio + v_fim_cons + 1,  v_inicio + v_duracao - 1, 'Mobilização total, fiscais, boca de urna e dia D', 4);

  SELECT id INTO v_fase_pre  FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'pre_campanha';
  SELECT id INTO v_fase_lanc FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'lancamento';
  SELECT id INTO v_fase_cons FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'consolidacao';
  SELECT id INTO v_fase_reta FROM public.campanha_fases WHERE campanha_id = _campanha_id AND fase = 'reta_final';

  -- SEMANAS DINÂMICAS
  FOR i IN 1..v_num_semanas LOOP
    v_semana_inicio := (i-1)*7 + 1;
    v_semana_fim := LEAST(i*7, v_duracao);
    v_codigo_fase_semana := CASE
      WHEN v_semana_inicio <= v_fim_pre THEN 'pre_campanha'::fase_campanha
      WHEN v_semana_inicio <= v_fim_lanc THEN 'lancamento'::fase_campanha
      WHEN v_semana_inicio <= v_fim_cons THEN 'consolidacao'::fase_campanha
      ELSE 'reta_final'::fase_campanha
    END;

    INSERT INTO public.campanha_semanas (campanha_id, numero_semana, data_inicio, data_fim, fase, foco_principal, meta_campo, meta_digital, meta_financeiro)
    VALUES (
      _campanha_id, i,
      v_inicio + (v_semana_inicio - 1),
      v_inicio + (v_semana_fim - 1),
      v_codigo_fase_semana,
      CASE v_codigo_fase_semana
        WHEN 'pre_campanha' THEN format('Semana %s · Estruturação e diagnóstico', i)
        WHEN 'lancamento'   THEN format('Semana %s · Mobilização e visitas', i)
        WHEN 'consolidacao' THEN format('Semana %s · Expansão e propostas', i)
        ELSE                     format('Semana %s · Reta final e conversão', i)
      END,
      format('%s visitas + %s cadastros', v_visitas_semana, (v_meta_cadastro / GREATEST(1,v_num_semanas))::int),
      CASE v_codigo_fase_semana
        WHEN 'pre_campanha' THEN '3 posts/semana + estruturação de redes'
        WHEN 'lancamento'   THEN '1 post/dia + 2 reels/semana + lives'
        WHEN 'consolidacao' THEN 'Anúncios segmentados + cobertura de eventos'
        ELSE                     'Bombardeio diário + mobilização do voto'
      END,
      CASE v_codigo_fase_semana
        WHEN 'pre_campanha' THEN format('R$ %s/semana', to_char(v_orcamento_min/v_num_semanas, 'FM999G999G999D00'))
        WHEN 'reta_final'   THEN 'Pagamento de fornecedores e fechamento'
        ELSE 'Controle semanal de gastos'
      END
    );
  END LOOP;

  -- METAS POR FASE
  INSERT INTO public.campanha_metas (campanha_id, fase, area, meta, indicador, valor_meta, ordem) VALUES
    (_campanha_id, 'pre_campanha', 'organizacao','Montar equipe completa',    'Pessoas na equipe',       GREATEST(5,(v_escala*5)::int),       1),
    (_campanha_id, 'pre_campanha', 'campo',      'Cadastrar eleitores base',  'Eleitores no SIGT',       (v_meta_cadastro/3)::int,            2),
    (_campanha_id, 'pre_campanha', 'digital',    'Estruturar redes sociais',  'Seguidores iniciais',     GREATEST(500,(v_escala*1000)::int),  3),
    (_campanha_id, 'pre_campanha', 'financeiro', 'Definir orçamento total',   'Orçamento aprovado (R$)', v_orcamento_min,                     4),
    (_campanha_id, 'lancamento',   'campo',      'Visitar bairros redutos',   'Visitas realizadas',      v_visitas_semana * 4,                5),
    (_campanha_id, 'lancamento',   'digital',    'Crescer base digital',      'Seguidores total',        GREATEST(2500,(v_escala*5000)::int), 6),
    (_campanha_id, 'consolidacao', 'campo',      'Expandir cobertura',        'Bairros visitados',       GREATEST(15,(v_escala*15)::int),     7),
    (_campanha_id, 'consolidacao', 'campo',      'Apoiadores ativos',         'Apoiadores cadastrados',  v_meta_cadastro,                     8),
    (_campanha_id, 'consolidacao', 'digital',    'Engajamento alto',          'Interações/semana',       GREATEST(5000,(v_escala*10000)::int),9),
    (_campanha_id, 'reta_final',   'campo',      'Fiscais por seção',         'Fiscais treinados',       v_fiscais_estimados,                 10),
    (_campanha_id, 'reta_final',   'campo',      'Meta de votos',             'Votos recebidos',         v_meta_votos,                        11);

  -- TAREFAS PRÉ
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, descricao, prioridade, ordem)
  SELECT _campanha_id, v_fase_pre,
         GREATEST(1, (pct * v_duracao)::int),
         v_inicio + GREATEST(1, (pct * v_duracao)::int) - 1,
         GREATEST(1, CEIL((pct * v_duracao)/7)::int),
         area::area_campanha, titulo, descricao, prioridade::prioridade_demanda, ord
  FROM (VALUES
    (0.005,'organizacao','Definir coordenador geral de campanha','Liderança máxima da operação. Define cadeia de comando.','urgente',1),
    (0.010,'organizacao','Criar grupo de WhatsApp da equipe núcleo','Comunicação interna direta com núcleo estratégico.','alta',2),
    (0.015,'juridico','Verificar elegibilidade e documentos','Certidões, ficha limpa, filiação partidária.','urgente',3),
    (0.020,'organizacao','Mapear bairros prioritários (redutos)','Lista oficial de bairros A/B/C com base em histórico.','alta',4),
    (0.030,'campo','Recrutar lideranças por bairro reduto','Mínimo 1 referência por bairro classificado A.','alta',5),
    (0.035,'digital','Criar perfis Instagram, Facebook, TikTok','Identidade unificada, bio, links e foto profissional.','alta',6),
    (0.045,'comunicacao','Definir slogan, bordões e narrativa','Mensagem central que guiará toda comunicação.','alta',7),
    (0.055,'financeiro','Abrir conta bancária de campanha','CNPJ eleitoral + conta específica.','urgente',8),
    (0.070,'dados','Importar base de eleitores no SIGT','TSE + base própria + indicações.','alta',9),
    (0.085,'comunicacao','Produzir identidade visual (logo, paleta)','Manual de marca para todos os materiais.','alta',10),
    (0.100,'digital','Publicar post de apresentação pessoal','Primeiro contato público. História pessoal.','media',11),
    (0.115,'campo','Primeira reunião com lideranças','Alinhamento de expectativas e papéis.','alta',12),
    (0.130,'organizacao','Cronograma detalhado de visitas','Roteiro semanal por bairro/responsável.','media',13),
    (0.145,'logistica','Cotar fornecedores (gráfica, brindes)','Mínimo 3 cotações por categoria.','alta',14),
    (0.160,'financeiro','Aprovar orçamento da fase de lançamento','Limite por área e fluxo de caixa.','alta',15),
    (0.175,'campo','Treinamento de cabos eleitorais','Discurso, abordagem, registro no app.','alta',16),
    (0.185,'digital','Plano editorial das redes (1 mês)','Calendário de posts, temas e formatos.','media',17),
    (0.195,'comunicacao','Gravar vídeo de apresentação oficial','Peça âncora para lançamento.','alta',18),
    (0.205,'campo','Roteirizar 1ª caminhada/evento','Local, horário, lideranças, mídia.','media',19),
    (0.215,'logistica','Receber primeira remessa de material','Santinhos, adesivos, camisetas iniciais.','alta',20),
    (0.220,'organizacao','Reunião geral pré-lançamento','Toda equipe alinhada para fase 2.','urgente',21)
  ) AS x(pct, area, titulo, descricao, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  -- TAREFAS LANÇAMENTO
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, descricao, prioridade, ordem)
  SELECT _campanha_id, v_fase_lanc,
         GREATEST(1, (pct * v_duracao)::int),
         v_inicio + GREATEST(1, (pct * v_duracao)::int) - 1,
         GREATEST(1, CEIL((pct * v_duracao)/7)::int),
         area::area_campanha, titulo, descricao, prioridade::prioridade_demanda, ord
  FROM (VALUES
    (0.235,'comunicacao','EVENTO: Lançamento oficial da candidatura','Ato público com lideranças, mídia e base.','urgente',23),
    (0.245,'digital','Live de lançamento nas redes sociais','Cobertura ao vivo do evento.','alta',24),
    (0.260,'campo','Primeiro porta-a-porta em bairro reduto','Marca início oficial do trabalho de campo.','alta',25),
    (0.290,'campo','Visitas intensivas em bairros redutos','Cobertura de 100% dos bairros A.','alta',26),
    (0.315,'comunicacao','Distribuir santinhos em pontos chave','Praças, feiras, igrejas, escolas.','media',27),
    (0.340,'campo','Carreata no bairro reduto principal','Mobilização visual e sonora.','alta',28),
    (0.370,'digital','Campanha de anúncios pagos #1','Geo-segmentada por bairro reduto.','alta',29),
    (0.395,'organizacao','Reunião de avaliação semanal','Indicadores, ajustes e replanejamento.','media',30),
    (0.420,'campo','Atender demandas urgentes registradas','Resposta rápida fortalece imagem.','alta',31),
    (0.450,'comunicacao','Vídeo: entregas e demandas resolvidas','Prova social de trabalho.','media',32),
    (0.480,'financeiro','Fechamento financeiro do mês','Conferência de gastos.','alta',33),
    (0.495,'organizacao','Revisão estratégica de meio de campanha','Ponto de inflexão. Ajuste de rota.','urgente',34)
  ) AS x(pct, area, titulo, descricao, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  -- TAREFAS CONSOLIDAÇÃO
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, descricao, prioridade, ordem)
  SELECT _campanha_id, v_fase_cons,
         GREATEST(1, (pct * v_duracao)::int),
         v_inicio + GREATEST(1, (pct * v_duracao)::int) - 1,
         GREATEST(1, CEIL((pct * v_duracao)/7)::int),
         area::area_campanha, titulo, descricao, prioridade::prioridade_demanda, ord
  FROM (VALUES
    (0.510,'comunicacao','Lançar programa de governo completo','Documento oficial com propostas detalhadas.','urgente',35),
    (0.535,'campo','Eventos em 2 bairros novos (expansão)','Conquista de bairros em disputa.','alta',36),
    (0.560,'campo','Cadastrar novos eleitores em massa','Mutirão porta-a-porta.','alta',37),
    (0.590,'digital','Anúncios segmentados por bairro/perfil','Mensagens específicas por território.','alta',38),
    (0.615,'campo','Reunião com lideranças religiosas','Pastores, padres, terreiros.','alta',39),
    (0.640,'campo','Carreata #2 (bairros de disputa)','Show de força em zonas competitivas.','alta',40),
    (0.665,'comunicacao','Preparação para debates públicos','Briefing, simulações, blocos de resposta.','urgente',41),
    (0.695,'campo','Caminhada bairro central/comercial','Comerciantes e classe média.','alta',42),
    (0.720,'dados','Pesquisa qualitativa em 10 bairros','Percepção, intenção, rejeição.','alta',43),
    (0.750,'organizacao','Ajuste de rota com base em pesquisa','Reposicionamento se necessário.','urgente',44),
    (0.775,'financeiro','Reservar caixa para reta final','Mínimo 30% do orçamento total.','alta',45),
    (0.800,'comunicacao','Material de TV/rádio (HGPE) finalizado','Peças aprovadas e prontas.','alta',46),
    (0.825,'organizacao','Reunião pré-reta final com toda equipe','Mobilização emocional e operacional.','urgente',47)
  ) AS x(pct, area, titulo, descricao, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  -- TAREFAS RETA FINAL
  INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, descricao, prioridade, ordem)
  SELECT _campanha_id, v_fase_reta,
         LEAST(v_duracao, GREATEST(1, (pct * v_duracao)::int)),
         v_inicio + LEAST(v_duracao, GREATEST(1, (pct * v_duracao)::int)) - 1,
         GREATEST(1, CEIL((pct * v_duracao)/7)::int),
         area::area_campanha, titulo, descricao, prioridade::prioridade_demanda, ord
  FROM (VALUES
    (0.840,'campo','Mobilização total nos bairros','Todas as equipes em campo simultaneamente.','urgente',48),
    (0.870,'comunicacao','Comício principal de encerramento','Grande ato público de massa.','urgente',49),
    (0.890,'digital','Bombardeio de conteúdo (3x/dia)','Saturação positiva nas redes.','urgente',50),
    (0.915,'organizacao','Treinar fiscais por seção eleitoral','1 fiscal por seção mínimo.','urgente',51),
    (0.945,'campo','Mobilização porta-a-porta final','Último contato pessoal com indecisos.','urgente',52),
    (0.965,'logistica','Logística completa do dia da eleição','Transporte, alimentação, fiscais.','urgente',53),
    (0.985,'comunicacao','Mensagem final aos eleitores','Vídeo emocional de fechamento.','urgente',54),
    (0.995,'organizacao','Briefing final dos fiscais','Última orientação antes do dia D.','urgente',55),
    (1.000,'organizacao','DIA DA ELEIÇÃO · Operação completa','Boca de urna, fiscalização, mobilização.','urgente',56)
  ) AS x(pct, area, titulo, descricao, prioridade, ord)
  WHERE titulo <> ALL(v_concluidas_titulos);

  -- TAREFAS POR CARGO
  IF v_cargo IN ('prefeito','vice_prefeito','governador','vice_governador','presidente') THEN
    FOR t IN SELECT * FROM jsonb_array_elements(p.tarefas_executivo) LOOP
      INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
      SELECT _campanha_id, v_fase_pre,
             LEAST(v_duracao,(t->>'dia')::int), v_inicio + LEAST(v_duracao,(t->>'dia')::int) - 1,
             COALESCE((t->>'semana')::int, 1),
             (t->>'area')::area_campanha, (t->>'titulo'),
             COALESCE((t->>'prioridade'), 'alta')::prioridade_demanda, 100
      WHERE (t->>'titulo') <> ALL(v_concluidas_titulos);
    END LOOP;
  END IF;

  IF v_cargo IN ('deputado_estadual','deputado_federal','senador') THEN
    FOR t IN SELECT * FROM jsonb_array_elements(p.tarefas_legislativo) LOOP
      INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
      SELECT _campanha_id, v_fase_pre,
             LEAST(v_duracao,(t->>'dia')::int), v_inicio + LEAST(v_duracao,(t->>'dia')::int) - 1,
             COALESCE((t->>'semana')::int, 1),
             (t->>'area')::area_campanha, (t->>'titulo'),
             COALESCE((t->>'prioridade'), 'alta')::prioridade_demanda, 110
      WHERE (t->>'titulo') <> ALL(v_concluidas_titulos);
    END LOOP;
  END IF;

  -- TAREFAS POR MUNICÍPIO DE FOCO
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
                 LEAST(v_duracao,(t->>'dia')::int), v_inicio + LEAST(v_duracao,(t->>'dia')::int) - 1,
                 COALESCE((t->>'semana')::int, 1),
                 (t->>'area')::area_campanha,
                 replace((t->>'titulo'), '{municipio}', v_mun_nome),
                 COALESCE((t->>'prioridade'),'alta')::prioridade_demanda, 200
          WHERE replace((t->>'titulo'), '{municipio}', v_mun_nome) <> ALL(v_concluidas_titulos);
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- MARCOS LEGAIS TSE
  IF p.tse_registro_ativo AND v_eleicao - p.tse_registro_dias BETWEEN v_inicio AND v_inicio + v_duracao - 1 THEN
    v_dia_marco := (v_eleicao - p.tse_registro_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= v_fim_pre THEN v_fase_pre WHEN v_dia_marco <= v_fim_lanc THEN v_fase_lanc WHEN v_dia_marco <= v_fim_cons THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_registro_dias,
           GREATEST(1,LEAST(v_num_semanas,((v_dia_marco-1)/7+1)::int)),
           'juridico'::area_campanha, format('TSE: Registro de candidatura (D-%s)', p.tse_registro_dias),
           'urgente'::prioridade_demanda, 300
    WHERE format('TSE: Registro de candidatura (D-%s)', p.tse_registro_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_propaganda_ativo AND v_eleicao - p.tse_propaganda_dias BETWEEN v_inicio AND v_inicio + v_duracao - 1 THEN
    v_dia_marco := (v_eleicao - p.tse_propaganda_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= v_fim_pre THEN v_fase_pre WHEN v_dia_marco <= v_fim_lanc THEN v_fase_lanc WHEN v_dia_marco <= v_fim_cons THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_propaganda_dias,
           GREATEST(1,LEAST(v_num_semanas,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Início da propaganda eleitoral (D-%s)', p.tse_propaganda_dias),
           'urgente'::prioridade_demanda, 301
    WHERE format('TSE: Início da propaganda eleitoral (D-%s)', p.tse_propaganda_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_hgpe_ativo AND v_eleicao - p.tse_hgpe_dias BETWEEN v_inicio AND v_inicio + v_duracao - 1
     AND v_cargo IN ('prefeito','vice_prefeito','governador','vice_governador','senador','deputado_estadual','deputado_federal','presidente') THEN
    v_dia_marco := (v_eleicao - p.tse_hgpe_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= v_fim_pre THEN v_fase_pre WHEN v_dia_marco <= v_fim_lanc THEN v_fase_lanc WHEN v_dia_marco <= v_fim_cons THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_hgpe_dias,
           GREATEST(1,LEAST(v_num_semanas,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Início HGPE rádio e TV (D-%s)', p.tse_hgpe_dias),
           'urgente'::prioridade_demanda, 302
    WHERE format('TSE: Início HGPE rádio e TV (D-%s)', p.tse_hgpe_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_prestacao_ativo AND v_eleicao - p.tse_prestacao_dias BETWEEN v_inicio AND v_inicio + v_duracao - 1 THEN
    v_dia_marco := (v_eleicao - p.tse_prestacao_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= v_fim_pre THEN v_fase_pre WHEN v_dia_marco <= v_fim_lanc THEN v_fase_lanc WHEN v_dia_marco <= v_fim_cons THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_prestacao_dias,
           GREATEST(1,LEAST(v_num_semanas,((v_dia_marco-1)/7+1)::int)),
           'financeiro'::area_campanha, format('TSE: Prestação de contas parcial (D-%s)', p.tse_prestacao_dias),
           'urgente'::prioridade_demanda, 303
    WHERE format('TSE: Prestação de contas parcial (D-%s)', p.tse_prestacao_dias) <> ALL(v_concluidas_titulos);
  END IF;

  IF p.tse_debates_ativo AND v_eleicao - p.tse_debates_dias BETWEEN v_inicio AND v_inicio + v_duracao - 1
     AND v_cargo IN ('prefeito','governador','senador','presidente','deputado_estadual','deputado_federal') THEN
    v_dia_marco := (v_eleicao - p.tse_debates_dias) - v_inicio + 1;
    v_fase_alvo := CASE WHEN v_dia_marco <= v_fim_pre THEN v_fase_pre WHEN v_dia_marco <= v_fim_lanc THEN v_fase_lanc WHEN v_dia_marco <= v_fim_cons THEN v_fase_cons ELSE v_fase_reta END;
    INSERT INTO public.campanha_tarefas (campanha_id, fase_id, dia, data_prevista, semana, area, titulo, prioridade, ordem)
    SELECT _campanha_id, v_fase_alvo, v_dia_marco, v_eleicao - p.tse_debates_dias,
           GREATEST(1,LEAST(v_num_semanas,((v_dia_marco-1)/7+1)::int)),
           'comunicacao'::area_campanha, format('TSE: Período de debates oficiais (D-%s)', p.tse_debates_dias),
           'alta'::prioridade_demanda, 304
    WHERE format('TSE: Período de debates oficiais (D-%s)', p.tse_debates_dias) <> ALL(v_concluidas_titulos);
  END IF;

END;
$function$;

CREATE OR REPLACE FUNCTION public.gerar_plano_campanha(_campanha_id uuid)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.gerar_plano_90_dias(_campanha_id); $$;

-- ============ CAMPANHA KIRIBAMBA · 150 DIAS ============
DO $$
DECLARE
  v_municipio_id uuid;
  v_campanha_id uuid;
  v_data_eleicao date := '2026-10-04';
  v_data_inicio date := '2026-10-04'::date - 149;
BEGIN
  SELECT id INTO v_municipio_id FROM public.municipios
  WHERE public.unaccent(lower(nome)) = public.unaccent(lower('Vitória da Conquista')) LIMIT 1;

  SELECT id INTO v_campanha_id FROM public.campanhas
  WHERE lower(nome) LIKE '%kiribamba%' LIMIT 1;

  IF v_campanha_id IS NULL THEN
    INSERT INTO public.campanhas (
      nome, cargo, data_eleicao, data_inicio_plano, ativa,
      municipio_id, municipios_foco_ids, meta_votos, partido_sigla,
      orcamento_total, observacoes
    ) VALUES (
      'Kiribamba 2026 · Deputado Estadual', 'deputado_estadual',
      v_data_eleicao, v_data_inicio, true,
      v_municipio_id,
      CASE WHEN v_municipio_id IS NOT NULL THEN ARRAY[v_municipio_id] ELSE '{}'::uuid[] END,
      45000, 'AVANTE', 750000,
      'Cliente piloto SIGT · Plano estratégico 150 dias com inteligência política integrada.'
    ) RETURNING id INTO v_campanha_id;
  END IF;

  PERFORM public.inicializar_parametros_campanha(v_campanha_id);

  UPDATE public.campanha_parametros SET
    duracao_dias = 150, num_fases = 4,
    etapas_sobrepostas = true, preservar_concluidas = true,
    min_cadastro = 8000, min_visitas = 12000, min_visitas_semana = 600,
    min_fiscais = 200, min_orcamento_reais = 500000,
    pct_cadastro_sobre_votos = 0.20, pct_visitas_sobre_votos = 0.30,
    votos_por_fiscal = 200, custo_por_voto_reais = 12,
    tse_registro_ativo = true, tse_registro_dias = 60,
    tse_propaganda_ativo = true, tse_propaganda_dias = 90,
    tse_hgpe_ativo = true, tse_hgpe_dias = 35,
    tse_prestacao_ativo = true, tse_prestacao_dias = 30,
    tse_debates_ativo = true, tse_debates_dias = 45
  WHERE campanha_id = v_campanha_id;

  PERFORM public.gerar_plano_90_dias(v_campanha_id);
END $$;