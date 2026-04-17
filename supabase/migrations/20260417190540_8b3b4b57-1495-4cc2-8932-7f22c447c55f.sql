-- Tabela de configurações do sistema (singleton key/value)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system_settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system_settings"
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system_settings"
  ON public.system_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system_settings"
  ON public.system_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seeds padrão
INSERT INTO public.system_settings (key, value, description) VALUES
  ('organization', '{"nome":"SIGT","logo_url":null,"cor_primaria":"#0ea5e9"}'::jsonb, 'Identidade da organização'),
  ('sla_demandas', '{"urgente_horas":24,"alta_horas":48,"media_dias":7,"baixa_dias":15}'::jsonb, 'SLA por prioridade de demanda'),
  ('defaults', '{"itens_por_pagina":25,"export_max_rows":10000}'::jsonb, 'Padrões do sistema')
ON CONFLICT (key) DO NOTHING;

-- View de estatísticas diárias (últimos 30 dias)
CREATE OR REPLACE VIEW public.v_admin_stats_30d AS
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