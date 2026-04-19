CREATE OR REPLACE VIEW public.v_lacunas_territoriais
WITH (security_invoker = true) AS
SELECT
  b.id AS bairro_id,
  b.nome AS bairro_nome,
  b.municipio_id,
  m.nome AS municipio_nome,
  b.classificacao,
  b.latitude,
  b.longitude,
  COALESCE((SELECT COUNT(*) FROM public.pessoas_enderecos pe WHERE pe.bairro_id = b.id), 0) AS total_pessoas,
  COALESCE((SELECT COUNT(*) FROM public.agenda a WHERE a.bairro_id = b.id), 0) AS total_eventos,
  COALESCE((SELECT COUNT(*) FROM public.demandas d WHERE d.bairro_id = b.id AND d.status NOT IN ('resolvida','arquivada')), 0) AS demandas_abertas,
  (
    LEAST(COALESCE((SELECT COUNT(*) FROM public.demandas d WHERE d.bairro_id = b.id AND d.status NOT IN ('resolvida','arquivada')), 0) * 10, 50)
    + GREATEST(20 - COALESCE((SELECT COUNT(*) FROM public.pessoas_enderecos pe WHERE pe.bairro_id = b.id), 0), 0)
    + GREATEST(15 - COALESCE((SELECT COUNT(*) FROM public.agenda a WHERE a.bairro_id = b.id), 0) * 3, 0)
    + CASE WHEN b.classificacao IN ('expansao','disputa','baixa_presenca') THEN 15 ELSE 0 END
  )::int AS score_prioridade
FROM public.bairros b
LEFT JOIN public.municipios m ON m.id = b.municipio_id;