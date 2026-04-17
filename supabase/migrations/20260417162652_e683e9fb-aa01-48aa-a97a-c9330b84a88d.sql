DROP VIEW IF EXISTS public.mapa_estrategico_bairros;

CREATE VIEW public.mapa_estrategico_bairros
WITH (security_invoker = on) AS
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