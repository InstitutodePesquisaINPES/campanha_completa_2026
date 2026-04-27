CREATE OR REPLACE VIEW public.v_tse_municipio_resumo
WITH (security_invoker = on) AS
WITH eleitorado AS (
  SELECT
    ano,
    uf,
    municipio,
    public.unaccent(lower(municipio)) AS municipio_key,
    SUM(quantidade_eleitores)::bigint AS total_eleitores
  FROM public.tse_eleitorado_perfil
  GROUP BY ano, uf, municipio
),
candidatos_perfil AS (
  SELECT
    ano,
    uf,
    cod_municipio_tse,
    municipio,
    public.unaccent(lower(municipio)) AS municipio_key,
    COUNT(DISTINCT (cargo, numero_candidato))::integer AS total_candidatos,
    COUNT(DISTINCT (cargo, numero_candidato)) FILTER (
      WHERE situacao_totalizacao IS NOT NULL
        AND public.unaccent(lower(situacao_totalizacao)) LIKE '%eleito%'
        AND public.unaccent(lower(situacao_totalizacao)) NOT LIKE '%nao%'
    )::integer AS total_eleitos,
    COALESCE(SUM(votos_nominais), 0)::bigint AS total_votos_nominais
  FROM public.tse_votacao_candidato_perfil
  GROUP BY ano, uf, cod_municipio_tse, municipio
),
candidatos_cadastro AS (
  SELECT
    c.ano,
    c.uf,
    c.cod_municipio_tse,
    COALESCE(m.nome, c.cod_municipio_tse) AS municipio,
    public.unaccent(lower(COALESCE(m.nome, c.cod_municipio_tse))) AS municipio_key,
    COUNT(DISTINCT (c.cargo, c.numero_urna))::integer AS total_candidatos,
    COUNT(DISTINCT (c.cargo, c.numero_urna)) FILTER (WHERE c.eleito)::integer AS total_eleitos,
    COALESCE(SUM(c.votos_recebidos), 0)::bigint AS total_votos_nominais
  FROM public.tse_candidatos c
  LEFT JOIN public.municipios m
    ON m.geocodigo_ibge::text LIKE c.cod_municipio_tse || '%'
  GROUP BY c.ano, c.uf, c.cod_municipio_tse, COALESCE(m.nome, c.cod_municipio_tse)
),
candidatos AS (
  SELECT
    COALESCE(cp.ano, cc.ano) AS ano,
    COALESCE(cp.uf, cc.uf) AS uf,
    COALESCE(cp.cod_municipio_tse, cc.cod_municipio_tse) AS cod_municipio_tse,
    COALESCE(cp.municipio, cc.municipio) AS municipio,
    COALESCE(cp.municipio_key, cc.municipio_key) AS municipio_key,
    GREATEST(COALESCE(cp.total_candidatos, 0), COALESCE(cc.total_candidatos, 0))::integer AS total_candidatos,
    GREATEST(COALESCE(cp.total_eleitos, 0), COALESCE(cc.total_eleitos, 0))::integer AS total_eleitos,
    GREATEST(COALESCE(cp.total_votos_nominais, 0), COALESCE(cc.total_votos_nominais, 0))::bigint AS total_votos_nominais
  FROM candidatos_perfil cp
  FULL JOIN candidatos_cadastro cc
    ON cc.ano = cp.ano
   AND cc.uf = cp.uf
   AND cc.cod_municipio_tse = cp.cod_municipio_tse
),
resultados AS (
  SELECT
    ano,
    uf,
    cod_municipio_tse,
    SUM(votos)::bigint AS total_votos_secao
  FROM public.tse_resultados_secao
  GROUP BY ano, uf, cod_municipio_tse
),
locais AS (
  SELECT
    ano,
    uf,
    cod_municipio_tse,
    COUNT(*)::integer AS total_locais
  FROM public.tse_locais_votacao
  GROUP BY ano, uf, cod_municipio_tse
),
base AS (
  SELECT
    COALESCE(e.ano, c.ano, r.ano, l.ano) AS ano,
    COALESCE(e.uf, c.uf, r.uf, l.uf) AS uf,
    COALESCE(c.cod_municipio_tse, r.cod_municipio_tse, l.cod_municipio_tse) AS cod_municipio_tse,
    COALESCE(e.municipio, c.municipio, r.cod_municipio_tse, l.cod_municipio_tse) AS municipio,
    COALESCE(e.total_eleitores, 0)::bigint AS total_eleitores,
    COALESCE(c.total_candidatos, 0)::integer AS total_candidatos,
    COALESCE(c.total_eleitos, 0)::integer AS total_eleitos,
    GREATEST(COALESCE(c.total_votos_nominais, 0), COALESCE(r.total_votos_secao, 0))::bigint AS total_votos_nominais
  FROM eleitorado e
  FULL JOIN candidatos c
    ON c.ano = e.ano
   AND c.uf = e.uf
   AND c.municipio_key = e.municipio_key
  FULL JOIN resultados r
    ON r.ano = COALESCE(e.ano, c.ano)
   AND r.uf = COALESCE(e.uf, c.uf)
   AND r.cod_municipio_tse = c.cod_municipio_tse
  FULL JOIN locais l
    ON l.ano = COALESCE(e.ano, c.ano, r.ano)
   AND l.uf = COALESCE(e.uf, c.uf, r.uf)
   AND l.cod_municipio_tse = COALESCE(c.cod_municipio_tse, r.cod_municipio_tse)
)
SELECT
  b.ano,
  b.uf,
  b.cod_municipio_tse,
  b.municipio,
  m.id AS municipio_id,
  b.total_eleitores,
  b.total_candidatos,
  b.total_eleitos,
  b.total_votos_nominais
FROM base b
LEFT JOIN public.municipios m
  ON m.geocodigo_ibge::text LIKE b.cod_municipio_tse || '%'
  OR public.unaccent(lower(m.nome)) = public.unaccent(lower(b.municipio));

CREATE OR REPLACE FUNCTION public.tse_dashboard_kpis(_uf text DEFAULT 'BA'::text, _ano integer DEFAULT 2024)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH
  eleitorado AS (
    SELECT COALESCE(SUM(quantidade_eleitores), 0)::bigint AS total,
           COUNT(DISTINCT municipio)::bigint AS municipios
    FROM public.tse_eleitorado_perfil
    WHERE uf = _uf AND ano = _ano
  ),
  cand_cadastro AS (
    SELECT COUNT(DISTINCT (cargo, cod_municipio_tse, numero_urna))::bigint AS candidatos,
           COUNT(DISTINCT (cargo, cod_municipio_tse, numero_urna)) FILTER (WHERE eleito)::bigint AS eleitos,
           COALESCE(SUM(votos_recebidos), 0)::bigint AS votos
    FROM public.tse_candidatos
    WHERE uf = _uf AND ano = _ano
  ),
  cand_perfil AS (
    SELECT COUNT(DISTINCT (cargo, cod_municipio_tse, numero_candidato))::bigint AS candidatos,
           COUNT(DISTINCT (cargo, cod_municipio_tse, numero_candidato)) FILTER (
             WHERE situacao_totalizacao IS NOT NULL
               AND public.unaccent(lower(situacao_totalizacao)) LIKE '%eleito%'
               AND public.unaccent(lower(situacao_totalizacao)) NOT LIKE '%nao%'
           )::bigint AS eleitos,
           COALESCE(SUM(votos_nominais), 0)::bigint AS votos,
           COUNT(DISTINCT municipio)::bigint AS municipios
    FROM public.tse_votacao_candidato_perfil
    WHERE uf = _uf AND ano = _ano
  ),
  resultados AS (
    SELECT COALESCE(SUM(votos), 0)::bigint AS votos,
           COUNT(DISTINCT cod_municipio_tse)::bigint AS municipios
    FROM public.tse_resultados_secao
    WHERE uf = _uf AND ano = _ano
  ),
  locais AS (
    SELECT COUNT(*)::bigint AS total,
           COUNT(DISTINCT cod_municipio_tse)::bigint AS municipios
    FROM public.tse_locais_votacao
    WHERE uf = _uf AND ano = _ano
  )
  SELECT jsonb_build_object(
    'total_eleitores', (SELECT total FROM eleitorado),
    'total_municipios', GREATEST((SELECT municipios FROM eleitorado), (SELECT municipios FROM cand_perfil), (SELECT municipios FROM resultados), (SELECT municipios FROM locais)),
    'total_candidatos', GREATEST((SELECT candidatos FROM cand_cadastro), (SELECT candidatos FROM cand_perfil)),
    'total_eleitos', GREATEST((SELECT eleitos FROM cand_cadastro), (SELECT eleitos FROM cand_perfil)),
    'total_votos_nominais', GREATEST((SELECT votos FROM cand_cadastro), (SELECT votos FROM cand_perfil), (SELECT votos FROM resultados)),
    'total_locais_votacao', (SELECT total FROM locais),
    'pessoas_crm_candidatas', (SELECT COUNT(DISTINCT pessoa_id) FROM public.v_pessoa_match_tse WHERE uf = _uf AND ano = _ano)
  );
$function$;

CREATE OR REPLACE FUNCTION public.tse_comparativo_eleicoes(_uf text DEFAULT 'BA'::text, _municipio text DEFAULT NULL::text, _cargo text DEFAULT NULL::text)
RETURNS TABLE(ano integer, total_eleitores bigint, total_candidatos bigint, total_eleitos bigint, total_votos_nominais bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH eleitores AS (
    SELECT ano, SUM(quantidade_eleitores)::bigint AS qt
    FROM public.tse_eleitorado_perfil
    WHERE uf = _uf AND (_municipio IS NULL OR municipio = _municipio)
    GROUP BY ano
  ),
  cand_cadastro AS (
    SELECT c.ano,
      COUNT(DISTINCT (c.cargo, c.cod_municipio_tse, c.numero_urna))::bigint AS qt_cand,
      COUNT(DISTINCT (c.cargo, c.cod_municipio_tse, c.numero_urna)) FILTER (WHERE c.eleito)::bigint AS qt_eleitos,
      COALESCE(SUM(c.votos_recebidos),0)::bigint AS qt_votos
    FROM public.tse_candidatos c
    LEFT JOIN public.municipios m ON m.geocodigo_ibge::text LIKE c.cod_municipio_tse || '%'
    WHERE c.uf = _uf
      AND (_cargo IS NULL OR lower(c.cargo) LIKE '%' || lower(_cargo) || '%')
      AND (_municipio IS NULL OR public.unaccent(lower(m.nome)) = public.unaccent(lower(_municipio)))
    GROUP BY c.ano
  ),
  cand_perfil AS (
    SELECT ano,
      COUNT(DISTINCT (cargo, cod_municipio_tse, numero_candidato))::bigint AS qt_cand,
      COUNT(DISTINCT (cargo, cod_municipio_tse, numero_candidato)) FILTER (
        WHERE situacao_totalizacao IS NOT NULL
          AND public.unaccent(lower(situacao_totalizacao)) LIKE '%eleito%'
          AND public.unaccent(lower(situacao_totalizacao)) NOT LIKE '%nao%'
      )::bigint AS qt_eleitos,
      COALESCE(SUM(votos_nominais),0)::bigint AS qt_votos
    FROM public.tse_votacao_candidato_perfil
    WHERE uf = _uf
      AND (_cargo IS NULL OR lower(cargo) LIKE '%' || lower(_cargo) || '%')
      AND (_municipio IS NULL OR municipio = _municipio)
    GROUP BY ano
  ),
  cands AS (
    SELECT
      COALESCE(cc.ano, cp.ano) AS ano,
      GREATEST(COALESCE(cc.qt_cand, 0), COALESCE(cp.qt_cand, 0))::bigint AS qt_cand,
      GREATEST(COALESCE(cc.qt_eleitos, 0), COALESCE(cp.qt_eleitos, 0))::bigint AS qt_eleitos,
      GREATEST(COALESCE(cc.qt_votos, 0), COALESCE(cp.qt_votos, 0))::bigint AS qt_votos
    FROM cand_cadastro cc
    FULL JOIN cand_perfil cp ON cp.ano = cc.ano
  )
  SELECT COALESCE(e.ano, c.ano) AS ano,
         COALESCE(e.qt, 0),
         COALESCE(c.qt_cand, 0),
         COALESCE(c.qt_eleitos, 0),
         COALESCE(c.qt_votos, 0)
  FROM eleitores e FULL OUTER JOIN cands c ON c.ano = e.ano
  ORDER BY ano;
$function$;