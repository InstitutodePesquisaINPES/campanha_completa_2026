
-- ============================================
-- ETAPA 4: DEMANDAS, AGENDA E MOBILIZAÇÃO
-- ============================================

-- ENUMS
CREATE TYPE public.categoria_demanda AS ENUM ('saude','educacao','infraestrutura','seguranca','social','emprego','moradia','transporte','outros');
CREATE TYPE public.prioridade_demanda AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.status_demanda AS ENUM ('aberta','triagem','encaminhada','em_andamento','resolvida','arquivada');
CREATE TYPE public.origem_demanda AS ENUM ('visita','telefone','whatsapp','gabinete','evento','rede_social');
CREATE TYPE public.tipo_agenda AS ENUM ('visita','evento','reuniao','comicio','carreata','porta_a_porta','audiencia','retorno');
CREATE TYPE public.status_agenda AS ENUM ('planejado','confirmado','em_andamento','realizado','cancelado');
CREATE TYPE public.papel_participante AS ENUM ('organizador','palestrante','convidado','equipe');
CREATE TYPE public.tipo_checkin AS ENUM ('checkin','checkout');

-- ============================================
-- DEMANDAS
-- ============================================
CREATE TABLE public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text UNIQUE NOT NULL,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  categoria categoria_demanda NOT NULL DEFAULT 'outros',
  prioridade prioridade_demanda NOT NULL DEFAULT 'media',
  status status_demanda NOT NULL DEFAULT 'aberta',
  responsavel_id uuid,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  bairro_id uuid REFERENCES public.bairros(id) ON DELETE SET NULL,
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_prazo timestamptz,
  data_resolucao timestamptz,
  data_retorno_cidadao timestamptz,
  origem origem_demanda,
  resolucao_descricao text,
  satisfacao_cidadao smallint,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view demandas" ON public.demandas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert demandas" ON public.demandas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update demandas" ON public.demandas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete demandas" ON public.demandas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER update_demandas_updated_at BEFORE UPDATE ON public.demandas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_demandas AFTER INSERT OR UPDATE OR DELETE ON public.demandas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Auto-protocolo
CREATE OR REPLACE FUNCTION public.generate_demanda_protocolo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  seq_num integer;
  ano text;
BEGIN
  ano := EXTRACT(YEAR FROM now())::text;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(protocolo, '-', 3) AS integer)
  ), 0) + 1 INTO seq_num
  FROM public.demandas
  WHERE protocolo LIKE 'DEM-' || ano || '-%';
  NEW.protocolo := 'DEM-' || ano || '-' || LPAD(seq_num::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER demanda_auto_protocolo BEFORE INSERT ON public.demandas FOR EACH ROW EXECUTE FUNCTION public.generate_demanda_protocolo();

-- SLA automático por prioridade
CREATE OR REPLACE FUNCTION public.set_demanda_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.data_prazo IS NULL THEN
    NEW.data_prazo := CASE NEW.prioridade
      WHEN 'urgente' THEN NEW.data_abertura + interval '24 hours'
      WHEN 'alta' THEN NEW.data_abertura + interval '48 hours'
      WHEN 'media' THEN NEW.data_abertura + interval '7 days'
      WHEN 'baixa' THEN NEW.data_abertura + interval '15 days'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER demanda_auto_sla BEFORE INSERT ON public.demandas FOR EACH ROW EXECUTE FUNCTION public.set_demanda_sla();

-- ============================================
-- DEMANDAS ENCAMINHAMENTOS
-- ============================================
CREATE TABLE public.demandas_encaminhamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  de_usuario_id uuid,
  para_usuario_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas_encaminhamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view encaminhamentos" ON public.demandas_encaminhamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert encaminhamentos" ON public.demandas_encaminhamentos FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete encaminhamentos" ON public.demandas_encaminhamentos FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER audit_demandas_enc AFTER INSERT OR UPDATE OR DELETE ON public.demandas_encaminhamentos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- DEMANDAS ANEXOS
-- ============================================
CREATE TABLE public.demandas_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  tipo text,
  arquivo_url text NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view demandas_anexos" ON public.demandas_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert demandas_anexos" ON public.demandas_anexos FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete demandas_anexos" ON public.demandas_anexos FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER audit_demandas_anexos AFTER INSERT OR UPDATE OR DELETE ON public.demandas_anexos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- AGENDA
-- ============================================
CREATE TABLE public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo tipo_agenda NOT NULL,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz,
  local text,
  endereco text,
  latitude double precision,
  longitude double precision,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  bairro_id uuid REFERENCES public.bairros(id) ON DELETE SET NULL,
  responsavel_id uuid,
  status status_agenda NOT NULL DEFAULT 'planejado',
  descricao text,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view agenda" ON public.agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert agenda" ON public.agenda FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update agenda" ON public.agenda FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete agenda" ON public.agenda FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_agenda AFTER INSERT OR UPDATE OR DELETE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- AGENDA PARTICIPANTES
-- ============================================
CREATE TABLE public.agenda_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  pessoa_id uuid NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  papel papel_participante NOT NULL DEFAULT 'convidado',
  confirmado boolean NOT NULL DEFAULT false,
  presente boolean NOT NULL DEFAULT false,
  data_confirmacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_participantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view participantes" ON public.agenda_participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert participantes" ON public.agenda_participantes FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update participantes" ON public.agenda_participantes FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete participantes" ON public.agenda_participantes FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER audit_agenda_part AFTER INSERT OR UPDATE OR DELETE ON public.agenda_participantes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- AGENDA CHECKINS
-- ============================================
CREATE TABLE public.agenda_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  usuario_id uuid,
  tipo tipo_checkin NOT NULL,
  latitude double precision,
  longitude double precision,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view checkins" ON public.agenda_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert checkins" ON public.agenda_checkins FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete checkins" ON public.agenda_checkins FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER audit_agenda_chk AFTER INSERT OR UPDATE OR DELETE ON public.agenda_checkins FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- AGENDA FOLLOWUPS
-- ============================================
CREATE TABLE public.agenda_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  responsavel_id uuid,
  prazo date,
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view followups" ON public.agenda_followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert followups" ON public.agenda_followups FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update followups" ON public.agenda_followups FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete followups" ON public.agenda_followups FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE TRIGGER audit_agenda_fw AFTER INSERT OR UPDATE OR DELETE ON public.agenda_followups FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Indexes
CREATE INDEX idx_demandas_status ON public.demandas(status);
CREATE INDEX idx_demandas_prioridade ON public.demandas(prioridade);
CREATE INDEX idx_demandas_pessoa ON public.demandas(pessoa_id);
CREATE INDEX idx_demandas_responsavel ON public.demandas(responsavel_id);
CREATE INDEX idx_demandas_municipio ON public.demandas(municipio_id);
CREATE INDEX idx_demandas_bairro ON public.demandas(bairro_id);
CREATE INDEX idx_agenda_data ON public.agenda(data_inicio);
CREATE INDEX idx_agenda_status ON public.agenda(status);
CREATE INDEX idx_agenda_municipio ON public.agenda(municipio_id);
CREATE INDEX idx_agenda_participantes_agenda ON public.agenda_participantes(agenda_id);
CREATE INDEX idx_agenda_participantes_pessoa ON public.agenda_participantes(pessoa_id);
