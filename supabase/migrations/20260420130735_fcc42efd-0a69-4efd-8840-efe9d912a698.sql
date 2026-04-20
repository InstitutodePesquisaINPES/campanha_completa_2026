-- RPC que agrega eleitorado no servidor (evita limite de 1000 do PostgREST)
CREATE OR REPLACE FUNCTION public.tse_eleitorado_agregado(
  _uf text DEFAULT 'BA',
  _ano integer DEFAULT 2024,
  _municipio text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT genero, faixa_etaria, grau_instrucao, cor_raca, estado_civil, quantidade_eleitores
    FROM public.tse_eleitorado_perfil
    WHERE uf = _uf AND ano = _ano
      AND (_municipio IS NULL OR municipio = _municipio)
  )
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT SUM(quantidade_eleitores) FROM base), 0),
    'genero', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(genero,'Não informado'), 'value', soma) ORDER BY soma DESC), '[]'::jsonb)
               FROM (SELECT genero, SUM(quantidade_eleitores) soma FROM base GROUP BY genero) g),
    'faixa_etaria', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(faixa_etaria,'Não informado'), 'value', soma) ORDER BY soma DESC), '[]'::jsonb)
               FROM (SELECT faixa_etaria, SUM(quantidade_eleitores) soma FROM base GROUP BY faixa_etaria) f),
    'grau_instrucao', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(grau_instrucao,'Não informado'), 'value', soma) ORDER BY soma DESC), '[]'::jsonb)
               FROM (SELECT grau_instrucao, SUM(quantidade_eleitores) soma FROM base GROUP BY grau_instrucao) i),
    'cor_raca', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(cor_raca,'Não informado'), 'value', soma) ORDER BY soma DESC), '[]'::jsonb)
               FROM (SELECT cor_raca, SUM(quantidade_eleitores) soma FROM base GROUP BY cor_raca) c),
    'estado_civil', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(estado_civil,'Não informado'), 'value', soma) ORDER BY soma DESC), '[]'::jsonb)
               FROM (SELECT estado_civil, SUM(quantidade_eleitores) soma FROM base GROUP BY estado_civil) e)
  );
$$;