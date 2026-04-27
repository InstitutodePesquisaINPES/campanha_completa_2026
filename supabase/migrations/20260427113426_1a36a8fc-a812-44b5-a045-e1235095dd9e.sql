-- 1) Bucket privado para arquivar CSVs do TSE
INSERT INTO storage.buckets (id, name, public)
VALUES ('tse-csv-uploads', 'tse-csv-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies do bucket: só admins
DROP POLICY IF EXISTS "tse csv admin upload" ON storage.objects;
CREATE POLICY "tse csv admin upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tse-csv-uploads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "tse csv admin read" ON storage.objects;
CREATE POLICY "tse csv admin read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tse-csv-uploads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "tse csv admin update" ON storage.objects;
CREATE POLICY "tse csv admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tse-csv-uploads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "tse csv admin delete" ON storage.objects;
CREATE POLICY "tse csv admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tse-csv-uploads' AND public.has_role(auth.uid(), 'admin'));

-- 3) Catálogo de CSVs arquivados
CREATE TABLE IF NOT EXISTS public.tse_csv_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_original text NOT NULL,
  tipo text NOT NULL,
  ano integer NOT NULL,
  uf text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  tabela_destino text NOT NULL,
  tamanho_bytes bigint,
  total_linhas integer,
  linhas_processadas integer NOT NULL DEFAULT 0,
  byte_cursor bigint NOT NULL DEFAULT 0,
  header_line text,
  status text NOT NULL DEFAULT 'aguardando',
  progress_pct integer NOT NULL DEFAULT 0,
  municipios_filtro text[],
  chunk_size integer NOT NULL DEFAULT 500,
  error_msg text,
  attempts integer NOT NULL DEFAULT 0,
  ultima_atividade_em timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tse_csv_arquivos_status ON public.tse_csv_arquivos(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tse_csv_arquivos_created_by ON public.tse_csv_arquivos(created_by);

ALTER TABLE public.tse_csv_arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all tse_csv_arquivos" ON public.tse_csv_arquivos;
CREATE POLICY "admin all tse_csv_arquivos"
  ON public.tse_csv_arquivos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_tse_csv_arquivos_updated ON public.tse_csv_arquivos;
CREATE TRIGGER trg_tse_csv_arquivos_updated
  BEFORE UPDATE ON public.tse_csv_arquivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Cron job para acionar o worker a cada 1 minuto
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento antigo se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tse-csv-worker-tick') THEN
    PERFORM cron.unschedule('tse-csv-worker-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'tse-csv-worker-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lryjfthdzmrgudamuqiu.supabase.co/functions/v1/tse-csv-worker',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyeWpmdGhkem1yZ3VkYW11cWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzM5NDAsImV4cCI6MjA5MTg0OTk0MH0.weKyxo8ryelyyUSFjOY-41IpUazE1UqdBL_r_VTX_Vs"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  ) AS req;
  $$
);