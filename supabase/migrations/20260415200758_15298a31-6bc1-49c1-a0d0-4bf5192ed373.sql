
-- =============================================
-- ETAPA 2: CADASTRO TERRITORIAL
-- =============================================

-- Helper function to check admin or coordenador
CREATE OR REPLACE FUNCTION public.has_manage_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'coordenador')
  )
$$;

-- 1. ESTADOS
CREATE TABLE public.estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla CHAR(2) NOT NULL UNIQUE,
  geocodigo_ibge TEXT UNIQUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_estados_updated_at BEFORE UPDATE ON public.estados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_estados AFTER INSERT OR UPDATE OR DELETE ON public.estados FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view estados" ON public.estados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert estados" ON public.estados FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update estados" ON public.estados FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete estados" ON public.estados FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 2. MUNICÍPIOS
CREATE TABLE public.municipios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_id UUID NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  geocodigo_ibge TEXT UNIQUE,
  populacao INTEGER,
  eleitorado_total INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_municipios_estado ON public.municipios(estado_id);
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_municipios_updated_at BEFORE UPDATE ON public.municipios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_municipios AFTER INSERT OR UPDATE OR DELETE ON public.municipios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view municipios" ON public.municipios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert municipios" ON public.municipios FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update municipios" ON public.municipios FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete municipios" ON public.municipios FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 3. DISTRITOS
CREATE TABLE public.distritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  geocodigo_ibge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_distritos_municipio ON public.distritos(municipio_id);
ALTER TABLE public.distritos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_distritos_updated_at BEFORE UPDATE ON public.distritos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_distritos AFTER INSERT OR UPDATE OR DELETE ON public.distritos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view distritos" ON public.distritos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert distritos" ON public.distritos FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update distritos" ON public.distritos FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete distritos" ON public.distritos FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 4. BAIRROS
CREATE TYPE public.classificacao_territorial AS ENUM ('reduto', 'expansao', 'disputa', 'risco', 'baixa_presenca');

CREATE TABLE public.bairros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  distrito_id UUID REFERENCES public.distritos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  classificacao public.classificacao_territorial,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bairros_municipio ON public.bairros(municipio_id);
CREATE INDEX idx_bairros_distrito ON public.bairros(distrito_id);
ALTER TABLE public.bairros ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_bairros_updated_at BEFORE UPDATE ON public.bairros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_bairros AFTER INSERT OR UPDATE OR DELETE ON public.bairros FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view bairros" ON public.bairros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert bairros" ON public.bairros FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update bairros" ON public.bairros FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete bairros" ON public.bairros FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 5. COMUNIDADES
CREATE TABLE public.comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro_id UUID NOT NULL REFERENCES public.bairros(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  microarea TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comunidades_bairro ON public.comunidades(bairro_id);
ALTER TABLE public.comunidades ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_comunidades_updated_at BEFORE UPDATE ON public.comunidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_comunidades AFTER INSERT OR UPDATE OR DELETE ON public.comunidades FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view comunidades" ON public.comunidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert comunidades" ON public.comunidades FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update comunidades" ON public.comunidades FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete comunidades" ON public.comunidades FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 6. ZONAS ELEITORAIS
CREATE TABLE public.zonas_eleitorais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  numero_zona INTEGER NOT NULL,
  tribunal_regional TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zonas_municipio ON public.zonas_eleitorais(municipio_id);
ALTER TABLE public.zonas_eleitorais ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_zonas_updated_at BEFORE UPDATE ON public.zonas_eleitorais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_zonas AFTER INSERT OR UPDATE OR DELETE ON public.zonas_eleitorais FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view zonas" ON public.zonas_eleitorais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert zonas" ON public.zonas_eleitorais FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update zonas" ON public.zonas_eleitorais FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete zonas" ON public.zonas_eleitorais FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 7. SEÇÕES ELEITORAIS
CREATE TABLE public.secoes_eleitorais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID NOT NULL REFERENCES public.zonas_eleitorais(id) ON DELETE CASCADE,
  numero_secao INTEGER NOT NULL,
  local_votacao TEXT,
  endereco TEXT,
  eleitores_aptos INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_secoes_zona ON public.secoes_eleitorais(zona_id);
ALTER TABLE public.secoes_eleitorais ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_secoes_updated_at BEFORE UPDATE ON public.secoes_eleitorais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_secoes AFTER INSERT OR UPDATE OR DELETE ON public.secoes_eleitorais FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view secoes" ON public.secoes_eleitorais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert secoes" ON public.secoes_eleitorais FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update secoes" ON public.secoes_eleitorais FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete secoes" ON public.secoes_eleitorais FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- 8. ÁREAS DE ATUAÇÃO
CREATE TYPE public.tipo_area_atuacao AS ENUM ('equipe', 'lider', 'coordenador');

CREATE TABLE public.areas_atuacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.tipo_area_atuacao NOT NULL,
  municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  geometria JSONB,
  bairros_ids UUID[] DEFAULT '{}',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_areas_municipio ON public.areas_atuacao(municipio_id);
CREATE INDEX idx_areas_responsavel ON public.areas_atuacao(responsavel_id);
ALTER TABLE public.areas_atuacao ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas_atuacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_areas AFTER INSERT OR UPDATE OR DELETE ON public.areas_atuacao FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Auth users can view areas" ON public.areas_atuacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert areas" ON public.areas_atuacao FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can update areas" ON public.areas_atuacao FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete areas" ON public.areas_atuacao FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));

-- Seed: Brazilian states
INSERT INTO public.estados (nome, sigla, geocodigo_ibge) VALUES
  ('Acre', 'AC', '12'), ('Alagoas', 'AL', '27'), ('Amapá', 'AP', '16'),
  ('Amazonas', 'AM', '13'), ('Bahia', 'BA', '29'), ('Ceará', 'CE', '23'),
  ('Distrito Federal', 'DF', '53'), ('Espírito Santo', 'ES', '32'),
  ('Goiás', 'GO', '52'), ('Maranhão', 'MA', '21'), ('Mato Grosso', 'MT', '51'),
  ('Mato Grosso do Sul', 'MS', '50'), ('Minas Gerais', 'MG', '31'),
  ('Pará', 'PA', '15'), ('Paraíba', 'PB', '25'), ('Paraná', 'PR', '41'),
  ('Pernambuco', 'PE', '26'), ('Piauí', 'PI', '22'), ('Rio de Janeiro', 'RJ', '33'),
  ('Rio Grande do Norte', 'RN', '24'), ('Rio Grande do Sul', 'RS', '43'),
  ('Rondônia', 'RO', '11'), ('Roraima', 'RR', '14'), ('Santa Catarina', 'SC', '42'),
  ('São Paulo', 'SP', '35'), ('Sergipe', 'SE', '28'), ('Tocantins', 'TO', '17');
