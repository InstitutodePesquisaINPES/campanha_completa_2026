-- Phase 3: Compliance, Contracts, Risks, Incidents

-- Enums
CREATE TYPE public.contrato_status AS ENUM ('rascunho','vigente','encerrado','cancelado','vencido');
CREATE TYPE public.risco_categoria AS ENUM ('juridico','reputacional','financeiro','operacional','eleitoral');
CREATE TYPE public.risco_severidade AS ENUM ('baixa','media','alta','critica');
CREATE TYPE public.risco_status AS ENUM ('identificado','em_mitigacao','mitigado','aceito','materializado');
CREATE TYPE public.incidente_status AS ENUM ('aberto','em_apuracao','resolvido','arquivado');

-- Contratos
CREATE TABLE public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE SET NULL,
  fornecedor_pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  numero text,
  objeto text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status contrato_status NOT NULL DEFAULT 'rascunho',
  arquivo_url text,
  observacoes text,
  responsavel_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_data_fim ON public.contratos(data_fim);
CREATE INDEX idx_contratos_status ON public.contratos(status);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update contratos" ON public.contratos FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete contratos" ON public.contratos FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER trg_contratos_updated BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Riscos
CREATE TABLE public.riscos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  categoria risco_categoria NOT NULL,
  severidade risco_severidade NOT NULL DEFAULT 'media',
  probabilidade smallint NOT NULL DEFAULT 3 CHECK (probabilidade BETWEEN 1 AND 5),
  impacto smallint NOT NULL DEFAULT 3 CHECK (impacto BETWEEN 1 AND 5),
  status risco_status NOT NULL DEFAULT 'identificado',
  plano_mitigacao text,
  responsavel_id uuid,
  data_revisao date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view riscos" ON public.riscos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert riscos" ON public.riscos FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update riscos" ON public.riscos FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete riscos" ON public.riscos FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER trg_riscos_updated BEFORE UPDATE ON public.riscos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Incidentes
CREATE TABLE public.incidentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE SET NULL,
  risco_id uuid REFERENCES public.riscos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  categoria risco_categoria NOT NULL,
  severidade risco_severidade NOT NULL DEFAULT 'media',
  status incidente_status NOT NULL DEFAULT 'aberto',
  data_ocorrencia timestamptz NOT NULL DEFAULT now(),
  data_resolucao timestamptz,
  acoes_tomadas text,
  responsavel_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view incidentes" ON public.incidentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert incidentes" ON public.incidentes FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update incidentes" ON public.incidentes FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete incidentes" ON public.incidentes FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER trg_incidentes_updated BEFORE UPDATE ON public.incidentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Evidências (dossiê)
CREATE TABLE public.evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  arquivo_url text NOT NULL,
  mime_type text,
  tamanho_bytes bigint,
  versao integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidencias_entidade ON public.evidencias(entidade_tipo, entidade_id);

ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view evidencias" ON public.evidencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert evidencias" ON public.evidencias FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete evidencias" ON public.evidencias FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

-- Storage bucket privado para evidências
INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias', 'evidencias', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth view evidencias bucket" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias');
CREATE POLICY "Managers upload evidencias bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias' AND has_manage_role(auth.uid()));
CREATE POLICY "Managers delete evidencias bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidencias' AND has_manage_role(auth.uid()));

-- Alerta de contratos vencendo (gera notificação via trigger diário não — feito por edge function futura).
-- Por ora, view de contratos vencendo:
CREATE OR REPLACE VIEW public.v_contratos_alerta AS
SELECT
  c.*,
  (c.data_fim - CURRENT_DATE) AS dias_para_vencer
FROM public.contratos c
WHERE c.status = 'vigente'
  AND c.data_fim >= CURRENT_DATE
  AND c.data_fim <= CURRENT_DATE + INTERVAL '30 days';