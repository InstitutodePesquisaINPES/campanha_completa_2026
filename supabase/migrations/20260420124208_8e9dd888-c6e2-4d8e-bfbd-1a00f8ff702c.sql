CREATE OR REPLACE FUNCTION public.tse_resumo_municipios(_ano integer, _uf text)
RETURNS TABLE(municipio text, eleitores bigint, registros_perfil bigint, candidatos_perfil bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH e AS (
    SELECT municipio,
           SUM(quantidade_eleitores)::bigint AS eleitores,
           COUNT(*)::bigint AS registros_perfil
    FROM public.tse_eleitorado_perfil
    WHERE ano = _ano AND uf = _uf
    GROUP BY municipio
  ),
  c AS (
    SELECT municipio, COUNT(*)::bigint AS candidatos_perfil
    FROM public.tse_votacao_candidato_perfil
    WHERE ano = _ano AND uf = _uf
    GROUP BY municipio
  )
  SELECT COALESCE(e.municipio, c.municipio) AS municipio,
         COALESCE(e.eleitores, 0),
         COALESCE(e.registros_perfil, 0),
         COALESCE(c.candidatos_perfil, 0)
  FROM e FULL OUTER JOIN c ON c.municipio = e.municipio
  ORDER BY COALESCE(e.eleitores, 0) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.tse_resumo_municipios(integer, text) TO authenticated;