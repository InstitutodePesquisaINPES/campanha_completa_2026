DROP VIEW IF EXISTS public.v_contratos_alerta;
CREATE VIEW public.v_contratos_alerta
WITH (security_invoker = true) AS
SELECT
  c.*,
  (c.data_fim - CURRENT_DATE) AS dias_para_vencer
FROM public.contratos c
WHERE c.status = 'vigente'
  AND c.data_fim >= CURRENT_DATE
  AND c.data_fim <= CURRENT_DATE + INTERVAL '30 days';