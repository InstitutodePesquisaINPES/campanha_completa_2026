-- Views consolidadas para Dashboard Eleitoral TSE 360°

-- 1. Resumo por município/ano
CREATE OR REPLACE VIEW public.v_tse_municipio_resumo AS
WITH e AS (
  SELECT ano, uf, municipio,
    SUM(quantidade_eleitores)::bigint AS total_eleitores
  FROM public.tse_eleitorado_perfil
  GROUP BY ano, uf, municipio
),
c AS (
  SELECT c.ano, c.uf, c.cod_municipio_tse,
    COALESCE(m.nome, c.cod_municipio_tse) AS municipio_nome,
    m.id AS municipio_id,
    COUNT(*)::int AS total_candidatos,
    COUNT(*) FILTER (WHERE c.eleito)::int AS total_eleitos,
    SUM(c.votos_recebidos)::bigint AS total_votos_nominais
  FROM public.tse_candidatos c
  LEFT JOIN public.municipios m ON m.geocodigo_ibge::text LIKE c.cod_municipio_tse || '%'
  GROUP BY c.ano, c.uf, c.cod_municipio_tse, m.nome, m.id
)
SELECT
  COALESCE(e.ano, c.ano) AS ano,
  COALESCE(e.uf, c.uf) AS uf,
  c.cod_municipio_tse,
  COALESCE(e.municipio, c.municipio_nome) AS municipio,
  c.municipio_id,
  COALESCE(e.total_eleitores, 0) AS total_eleitores,
  COALESCE(c.total_candidatos, 0) AS total_candidatos,
  COALESCE(c.total_eleitos, 0) AS total_eleitos,
  COALESCE(c.total_votos_nominais, 0) AS total_votos_nominais
FROM e
FULL OUTER JOIN c
  ON c.ano = e.ano AND c.uf = e.uf
  AND public.unaccent(lower(c.municipio_nome)) = public.unaccent(lower(e.municipio));

-- 2. Match pessoa CRM ↔ candidato TSE
CREATE OR REPLACE VIEW public.v_pessoa_match_tse AS
SELECT
  p.id AS pessoa_id,
  p.full_name AS pessoa_nome,
  c.id AS candidato_id,
  c.ano, c.uf, c.cargo, c.partido_sigla, c.numero_urna,
  c.nome_completo, c.nome_urna, c.votos_recebidos, c.eleito,
  c.cod_municipio_tse
FROM public.pessoas p
JOIN public.tse_candidatos c
  ON public.unaccent(lower(p.full_name)) = public.unaccent(lower(c.nome_completo))
  OR (p.cpf IS NOT NULL AND c.cpf IS NOT NULL AND p.cpf = c.cpf);

-- 3. Histórico 360° de candidato
CREATE OR REPLACE VIEW public.v_tse_candidato_historico AS
SELECT
  c.id, c.nome_completo, c.cpf,
  c.ano, c.uf, c.cargo, c.cod_municipio_tse,
  c.partido_sigla, c.numero_urna, c.nome_urna,
  c.votos_recebidos, c.eleito, c.situacao_eleicao,
  c.data_nascimento, c.genero, c.ocupacao,
  m.nome AS municipio_nome,
  m.id AS municipio_id
FROM public.tse_candidatos c
LEFT JOIN public.municipios m
  ON m.geocodigo_ibge::text LIKE c.cod_municipio_tse || '%';

-- 4. Pivot eleitorado para comparação entre anos
CREATE OR REPLACE VIEW public.v_tse_eleitorado_comparativo AS
SELECT
  uf, municipio, ano,
  genero, faixa_etaria, grau_instrucao, cor_raca, estado_civil,
  SUM(quantidade_eleitores)::bigint AS total
FROM public.tse_eleitorado_perfil
GROUP BY uf, municipio, ano, genero, faixa_etaria, grau_instrucao, cor_raca, estado_civil;

-- 5. RPC: votos por seção
CREATE OR REPLACE FUNCTION public.tse_votos_por_secao(
  _ano integer,
  _uf text,
  _cod_municipio_tse text,
  _cargo text DEFAULT NULL,
  _numero_votavel text DEFAULT NULL
)
RETURNS TABLE(
  zona integer, secao integer, cargo text, numero_votavel text,
  partido_sigla text, votos bigint,
  local_nome text, bairro text, endereco text,
  latitude double precision, longitude double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.zona, r.secao, r.cargo, r.numero_votavel, r.partido_sigla,
    SUM(r.votos)::bigint AS votos,
    l.nome_local, l.bairro, l.endereco, l.latitude, l.longitude
  FROM public.tse_resultados_secao r
  LEFT JOIN public.tse_locais_votacao l
    ON l.ano = r.ano AND l.uf = r.uf
    AND l.cod_municipio_tse = r.cod_municipio_tse AND l.zona = r.zona
  WHERE r.ano = _ano AND r.uf = _uf AND r.cod_municipio_tse = _cod_municipio_tse
    AND (_cargo IS NULL OR lower(r.cargo) = lower(_cargo))
    AND (_numero_votavel IS NULL OR r.numero_votavel = _numero_votavel)
  GROUP BY r.zona, r.secao, r.cargo, r.numero_votavel, r.partido_sigla,
           l.nome_local, l.bairro, l.endereco, l.latitude, l.longitude
  ORDER BY r.zona, r.secao;
$$;

-- 6. RPC: KPIs gerais
CREATE OR REPLACE FUNCTION public.tse_dashboard_kpis(_uf text DEFAULT 'BA', _ano integer DEFAULT 2024)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_eleitores', COALESCE((SELECT SUM(quantidade_eleitores) FROM public.tse_eleitorado_perfil WHERE uf = _uf AND ano = _ano), 0),
    'total_municipios', (SELECT COUNT(DISTINCT municipio) FROM public.tse_eleitorado_perfil WHERE uf = _uf AND ano = _ano),
    'total_candidatos', (SELECT COUNT(*) FROM public.tse_candidatos WHERE uf = _uf AND ano = _ano),
    'total_eleitos', (SELECT COUNT(*) FROM public.tse_candidatos WHERE uf = _uf AND ano = _ano AND eleito),
    'total_votos_nominais', COALESCE((SELECT SUM(votos_recebidos) FROM public.tse_candidatos WHERE uf = _uf AND ano = _ano), 0),
    'total_locais_votacao', (SELECT COUNT(*) FROM public.tse_locais_votacao WHERE uf = _uf AND ano = _ano),
    'pessoas_crm_candidatas', (SELECT COUNT(DISTINCT pessoa_id) FROM public.v_pessoa_match_tse WHERE uf = _uf AND ano = _ano)
  );
$$;

GRANT SELECT ON public.v_tse_municipio_resumo TO authenticated, anon;
GRANT SELECT ON public.v_pessoa_match_tse TO authenticated;
GRANT SELECT ON public.v_tse_candidato_historico TO authenticated, anon;
GRANT SELECT ON public.v_tse_eleitorado_comparativo TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.tse_votos_por_secao(integer,text,text,text,text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.tse_dashboard_kpis(text,integer) TO authenticated, anon;