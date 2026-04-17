DROP VIEW IF EXISTS public.v_admin_stats_30d;

CREATE VIEW public.v_admin_stats_30d
WITH (security_invoker = true) AS
WITH dias AS (
  SELECT generate_series(
    (CURRENT_DATE - INTERVAL '29 days')::date,
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date AS dia
)
SELECT
  d.dia,
  (SELECT COUNT(*) FROM public.pessoas p WHERE p.created_at::date = d.dia) AS pessoas,
  (SELECT COUNT(*) FROM public.demandas dm WHERE dm.created_at::date = d.dia) AS demandas,
  (SELECT COUNT(*) FROM public.agenda a WHERE a.created_at::date = d.dia) AS eventos,
  (SELECT COALESCE(SUM(valor),0) FROM public.despesas dp WHERE dp.data_despesa = d.dia) AS despesas_valor
FROM dias d
ORDER BY d.dia;

GRANT SELECT ON public.v_admin_stats_30d TO authenticated;