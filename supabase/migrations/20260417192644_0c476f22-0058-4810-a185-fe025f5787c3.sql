
-- ============= TIPOS =============
DO $$ BEGIN
  CREATE TYPE public.tse_job_status AS ENUM ('queued','running','done','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tse_job_tipo AS ENUM ('eleitorado','locais','candidatos','resultados','prestacao_contas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= ELEITORADO =============
CREATE TABLE IF NOT EXISTS public.tse_eleitorado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_municipio_tse text,
  zona integer,
  secao integer,
  total_eleitores integer NOT NULL DEFAULT 0,
  faixa_etaria jsonb DEFAULT '{}'::jsonb,
  genero jsonb DEFAULT '{}'::jsonb,
  escolaridade jsonb DEFAULT '{}'::jsonb,
  estado_civil jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ano, uf, cod_municipio_tse, zona, secao)
);
CREATE INDEX IF NOT EXISTS idx_tse_eleitorado_mun ON public.tse_eleitorado(municipio_id, ano);
CREATE INDEX IF NOT EXISTS idx_tse_eleitorado_uf_ano ON public.tse_eleitorado(uf, ano);

-- ============= LOCAIS DE VOTAÇÃO =============
CREATE TABLE IF NOT EXISTS public.tse_locais_votacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_municipio_tse text,
  zona integer NOT NULL,
  codigo_local text NOT NULL,
  nome_local text,
  endereco text,
  bairro text,
  cep text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ano, uf, cod_municipio_tse, zona, codigo_local)
);
CREATE INDEX IF NOT EXISTS idx_tse_locais_mun ON public.tse_locais_votacao(municipio_id, ano);

-- ============= CANDIDATOS =============
CREATE TABLE IF NOT EXISTS public.tse_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  turno integer NOT NULL DEFAULT 1,
  uf text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  cod_municipio_tse text,
  cargo text NOT NULL,
  numero_urna text NOT NULL,
  nome_urna text,
  nome_completo text,
  cpf text,
  partido_sigla text,
  partido_numero text,
  coligacao text,
  situacao_candidatura text,
  situacao_eleicao text,
  eleito boolean DEFAULT false,
  votos_recebidos integer DEFAULT 0,
  genero text,
  data_nascimento date,
  ocupacao text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ano, turno, uf, cod_municipio_tse, cargo, numero_urna)
);
CREATE INDEX IF NOT EXISTS idx_tse_cand_mun ON public.tse_candidatos(municipio_id, ano);
CREATE INDEX IF NOT EXISTS idx_tse_cand_part ON public.tse_candidatos(partido_sigla, ano);

-- ============= RESULTADOS POR SEÇÃO =============
CREATE TABLE IF NOT EXISTS public.tse_resultados_secao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  turno integer NOT NULL DEFAULT 1,
  uf text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_municipio_tse text,
  zona integer NOT NULL,
  secao integer NOT NULL,
  cargo text NOT NULL,
  numero_votavel text NOT NULL,
  partido_sigla text,
  votos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ano, turno, uf, cod_municipio_tse, zona, secao, cargo, numero_votavel)
);
CREATE INDEX IF NOT EXISTS idx_tse_res_mun ON public.tse_resultados_secao(municipio_id, ano, cargo);
CREATE INDEX IF NOT EXISTS idx_tse_res_zona ON public.tse_resultados_secao(municipio_id, zona, secao);

-- ============= PRESTAÇÃO DE CONTAS =============
CREATE TABLE IF NOT EXISTS public.tse_prestacao_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  candidato_id uuid REFERENCES public.tse_candidatos(id) ON DELETE CASCADE,
  cpf_candidato text,
  nome_candidato text,
  cargo text,
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  valor numeric(14,2) NOT NULL DEFAULT 0,
  data_lancamento date,
  fornecedor_doador text,
  cnpj_cpf_contraparte text,
  descricao text,
  origem text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tse_pc_cand ON public.tse_prestacao_contas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_tse_pc_ano_uf ON public.tse_prestacao_contas(ano, uf);

-- ============= JOBS =============
CREATE TABLE IF NOT EXISTS public.tse_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tse_job_tipo NOT NULL,
  uf text NOT NULL,
  ano integer NOT NULL,
  municipio_cod text,
  status public.tse_job_status NOT NULL DEFAULT 'queued',
  total_registros integer DEFAULT 0,
  registros_processados integer DEFAULT 0,
  progress_pct integer NOT NULL DEFAULT 0,
  source_url text,
  error_msg text,
  attempts integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tse_jobs_status ON public.tse_import_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tse_jobs_uf_ano ON public.tse_import_jobs(uf, ano);

CREATE TRIGGER tg_tse_jobs_updated BEFORE UPDATE ON public.tse_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= LOGS =============
CREATE TABLE IF NOT EXISTS public.tse_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.tse_import_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tse_logs_job ON public.tse_import_logs(job_id, created_at);

-- ============= RLS =============
ALTER TABLE public.tse_eleitorado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_locais_votacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_resultados_secao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_prestacao_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tse_import_logs ENABLE ROW LEVEL SECURITY;

-- read policies (auth)
CREATE POLICY "Auth view tse_eleitorado" ON public.tse_eleitorado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_locais" ON public.tse_locais_votacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_candidatos" ON public.tse_candidatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_resultados" ON public.tse_resultados_secao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_pc" ON public.tse_prestacao_contas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_jobs" ON public.tse_import_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view tse_logs" ON public.tse_import_logs FOR SELECT TO authenticated USING (true);

-- jobs: admin pode inserir/cancelar
CREATE POLICY "Admin insert tse_jobs" ON public.tse_import_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update tse_jobs" ON public.tse_import_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete tse_jobs" ON public.tse_import_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
