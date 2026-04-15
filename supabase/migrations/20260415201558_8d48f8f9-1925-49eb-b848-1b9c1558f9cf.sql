
-- =============================================
-- ETAPA 3: CRM POLÍTICO-RELACIONAL
-- =============================================

-- Enums
CREATE TYPE public.nivel_relacionamento AS ENUM ('desconhecido', 'frio', 'morno', 'quente', 'aliado', 'lideranca');
CREATE TYPE public.tipo_contato AS ENUM ('celular', 'fixo', 'whatsapp', 'email', 'instagram', 'facebook', 'twitter');
CREATE TYPE public.tipo_endereco AS ENUM ('residencial', 'comercial', 'referencia');
CREATE TYPE public.papel_pessoa AS ENUM ('eleitor', 'apoiador', 'lideranca', 'coordenador_bairro', 'doador', 'fornecedor', 'imprensa', 'institucional', 'demandante', 'equipe');
CREATE TYPE public.tipo_vinculo AS ENUM ('familiar', 'comunitario', 'profissional', 'politico', 'indicacao');
CREATE TYPE public.tipo_interacao AS ENUM ('ligacao', 'visita', 'whatsapp', 'email', 'reuniao', 'evento');
CREATE TYPE public.finalidade_lgpd AS ENUM ('comunicacao_politica', 'pesquisa', 'campanha', 'mandato');

-- 1. PESSOAS (cadastro mestre)
CREATE TABLE public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT,
  data_nascimento DATE,
  genero TEXT,
  escolaridade TEXT,
  nivel_relacionamento public.nivel_relacionamento NOT NULL DEFAULT 'desconhecido',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pessoas_nome ON public.pessoas USING gin(to_tsvector('portuguese', full_name));
CREATE INDEX idx_pessoas_cpf ON public.pessoas(cpf);
CREATE INDEX idx_pessoas_nivel ON public.pessoas(nivel_relacionamento);

ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_pessoas_updated_at BEFORE UPDATE ON public.pessoas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_pessoas AFTER INSERT OR UPDATE OR DELETE ON public.pessoas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view pessoas" ON public.pessoas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert pessoas" ON public.pessoas FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update pessoas" ON public.pessoas FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete pessoas" ON public.pessoas FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 2. PESSOAS_CONTATOS
CREATE TABLE public.pessoas_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tipo public.tipo_contato NOT NULL,
  valor TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  verificado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contatos_pessoa ON public.pessoas_contatos(pessoa_id);
CREATE INDEX idx_contatos_valor ON public.pessoas_contatos(valor);

ALTER TABLE public.pessoas_contatos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_pessoas_contatos AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_contatos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view contatos" ON public.pessoas_contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert contatos" ON public.pessoas_contatos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update contatos" ON public.pessoas_contatos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete contatos" ON public.pessoas_contatos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 3. PESSOAS_ENDERECOS
CREATE TABLE public.pessoas_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro_id UUID REFERENCES public.bairros(id) ON DELETE SET NULL,
  municipio_id UUID REFERENCES public.municipios(id) ON DELETE SET NULL,
  cep TEXT,
  tipo public.tipo_endereco NOT NULL DEFAULT 'residencial',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enderecos_pessoa ON public.pessoas_enderecos(pessoa_id);
CREATE INDEX idx_enderecos_bairro ON public.pessoas_enderecos(bairro_id);
CREATE INDEX idx_enderecos_municipio ON public.pessoas_enderecos(municipio_id);

ALTER TABLE public.pessoas_enderecos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_pessoas_enderecos AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_enderecos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view enderecos" ON public.pessoas_enderecos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert enderecos" ON public.pessoas_enderecos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update enderecos" ON public.pessoas_enderecos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete enderecos" ON public.pessoas_enderecos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 4. PESSOAS_PAPEIS
CREATE TABLE public.pessoas_papeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  papel public.papel_pessoa NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_papeis_pessoa ON public.pessoas_papeis(pessoa_id);
CREATE INDEX idx_papeis_papel ON public.pessoas_papeis(papel);

ALTER TABLE public.pessoas_papeis ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_pessoas_papeis AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_papeis FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view papeis" ON public.pessoas_papeis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert papeis" ON public.pessoas_papeis FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update papeis" ON public.pessoas_papeis FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete papeis" ON public.pessoas_papeis FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 5. TAGS
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update tags" ON public.tags FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete tags" ON public.tags FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 6. PESSOAS_TAGS
CREATE TABLE public.pessoas_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pessoa_id, tag_id)
);

CREATE INDEX idx_ptags_pessoa ON public.pessoas_tags(pessoa_id);

ALTER TABLE public.pessoas_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view pessoas_tags" ON public.pessoas_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert pessoas_tags" ON public.pessoas_tags FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete pessoas_tags" ON public.pessoas_tags FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 7. PESSOAS_VINCULOS
CREATE TABLE public.pessoas_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  pessoa_vinculada_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tipo_vinculo public.tipo_vinculo NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (pessoa_id != pessoa_vinculada_id)
);

CREATE INDEX idx_vinculos_pessoa ON public.pessoas_vinculos(pessoa_id);
CREATE INDEX idx_vinculos_vinculada ON public.pessoas_vinculos(pessoa_vinculada_id);

ALTER TABLE public.pessoas_vinculos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_vinculos AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_vinculos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view vinculos" ON public.pessoas_vinculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert vinculos" ON public.pessoas_vinculos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update vinculos" ON public.pessoas_vinculos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete vinculos" ON public.pessoas_vinculos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 8. PESSOAS_HISTORICO_CONTATOS (timeline)
CREATE TABLE public.pessoas_historico_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tipo public.tipo_interacao NOT NULL,
  data_contato TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumo TEXT,
  resultado TEXT,
  proximo_contato DATE,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_pessoa ON public.pessoas_historico_contatos(pessoa_id);
CREATE INDEX idx_historico_data ON public.pessoas_historico_contatos(data_contato DESC);

ALTER TABLE public.pessoas_historico_contatos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_historico AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_historico_contatos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view historico" ON public.pessoas_historico_contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert historico" ON public.pessoas_historico_contatos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update historico" ON public.pessoas_historico_contatos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete historico" ON public.pessoas_historico_contatos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 9. PESSOAS_CONSENTIMENTOS (LGPD)
CREATE TABLE public.pessoas_consentimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  finalidade public.finalidade_lgpd NOT NULL,
  base_legal TEXT,
  consentido BOOLEAN NOT NULL DEFAULT false,
  data_consentimento TIMESTAMPTZ,
  data_revogacao TIMESTAMPTZ,
  canal_coleta TEXT,
  ip_coleta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consentimentos_pessoa ON public.pessoas_consentimentos(pessoa_id);

ALTER TABLE public.pessoas_consentimentos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_consentimentos AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_consentimentos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view consentimentos" ON public.pessoas_consentimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert consentimentos" ON public.pessoas_consentimentos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update consentimentos" ON public.pessoas_consentimentos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete consentimentos" ON public.pessoas_consentimentos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 10. PESSOAS_ANEXOS
CREATE TABLE public.pessoas_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  tipo_documento TEXT,
  arquivo_url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anexos_pessoa ON public.pessoas_anexos(pessoa_id);

ALTER TABLE public.pessoas_anexos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER audit_anexos AFTER INSERT OR UPDATE OR DELETE ON public.pessoas_anexos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth can view anexos" ON public.pessoas_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert anexos" ON public.pessoas_anexos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update anexos" ON public.pessoas_anexos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete anexos" ON public.pessoas_anexos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('pessoas-anexos', 'pessoas-anexos', false);

CREATE POLICY "Auth users can view pessoa anexos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pessoas-anexos');

CREATE POLICY "Managers can upload pessoa anexos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pessoas-anexos' AND public.has_manage_role(auth.uid()));

CREATE POLICY "Managers can delete pessoa anexos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pessoas-anexos' AND public.has_manage_role(auth.uid()));
