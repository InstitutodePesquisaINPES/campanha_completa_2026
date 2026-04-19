-- 1. PARAMETROS configuráveis
ALTER TABLE public.campanha_parametros
  ADD COLUMN IF NOT EXISTS duracao_dias integer NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS num_fases integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS fases_config jsonb NOT NULL DEFAULT '[
    {"fase":"diagnostico","nome":"Diagnóstico Territorial","pct_inicio":0,"pct_fim":15,"foco":"Mapeamento de municípios, bairros, lideranças e histórico eleitoral"},
    {"fase":"pre_campanha","nome":"Pré-campanha","pct_inicio":15,"pct_fim":35,"foco":"Estruturação, equipe, identidade e cadastro de base"},
    {"fase":"lancamento","nome":"Lançamento","pct_inicio":35,"pct_fim":55,"foco":"Apresentação pública, mobilização inicial e visitas"},
    {"fase":"consolidacao","nome":"Consolidação","pct_inicio":55,"pct_fim":85,"foco":"Expansão, eventos, propostas e disputa de bairros"},
    {"fase":"reta_final","nome":"Reta Final","pct_inicio":85,"pct_fim":100,"foco":"Conversão, mobilização total, fiscais e dia D"}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS etapas_sobrepostas boolean NOT NULL DEFAULT true;

-- Adicionar 'diagnostico' ao enum fase_campanha
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'diagnostico' AND enumtypid = 'public.fase_campanha'::regtype) THEN
    ALTER TYPE public.fase_campanha ADD VALUE 'diagnostico' BEFORE 'pre_campanha';
  END IF;
END $$;

-- 2. ENUMS
DO $$ BEGIN CREATE TYPE public.classificacao_estrategica AS ENUM ('reduto','disputa','expansao','perdido','neutro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.lideranca_classificacao AS ENUM ('A','B','C','D');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.lideranca_status AS ENUM ('mapeado','contactado','reuniao_marcada','comprometido','aliado','neutro','adversario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.lideranca_tipo AS ENUM ('religiosa','associativa','politica','comunitaria','empresarial','sindical','cultural','esportiva','familiar','profissional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.vereador_alinhamento AS ENUM ('aliado','simpatizante','neutro','adversario','desconhecido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.vereador_faixa_votos AS ENUM ('ate_150','f_150_500','f_500_1000','f_1000_2000','f_2000_5000','acima_5000');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. MUNICÍPIOS ESTRATÉGICOS
CREATE TABLE IF NOT EXISTS public.municipios_estrategicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  classificacao classificacao_estrategica NOT NULL DEFAULT 'neutro',
  score numeric(5,2) NOT NULL DEFAULT 0,
  meta_votos integer NOT NULL DEFAULT 0,
  votos_historicos integer DEFAULT 0,
  potencial_votos integer DEFAULT 0,
  prioridade integer NOT NULL DEFAULT 3,
  responsavel_id uuid,
  observacoes text,
  acoes_chave jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, municipio_id)
);
CREATE INDEX IF NOT EXISTS idx_mun_estrat_campanha ON public.municipios_estrategicos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_mun_estrat_class ON public.municipios_estrategicos(classificacao);
ALTER TABLE public.municipios_estrategicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizar municipios estrategicos" ON public.municipios_estrategicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar municipios estrategicos" ON public.municipios_estrategicos FOR ALL TO authenticated USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));
CREATE TRIGGER trg_mun_estrat_updated BEFORE UPDATE ON public.municipios_estrategicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. BAIRROS ESTRATÉGICOS
CREATE TABLE IF NOT EXISTS public.bairros_estrategicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  bairro_id uuid NOT NULL REFERENCES public.bairros(id) ON DELETE CASCADE,
  municipio_estrategico_id uuid REFERENCES public.municipios_estrategicos(id) ON DELETE SET NULL,
  classificacao classificacao_estrategica NOT NULL DEFAULT 'neutro',
  score numeric(5,2) NOT NULL DEFAULT 0,
  meta_votos integer NOT NULL DEFAULT 0,
  votos_estimados integer DEFAULT 0,
  num_eleitores integer DEFAULT 0,
  num_apoiadores integer DEFAULT 0,
  num_liderancas integer DEFAULT 0,
  prioridade integer NOT NULL DEFAULT 3,
  responsavel_id uuid,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, bairro_id)
);
CREATE INDEX IF NOT EXISTS idx_bairros_estrat_campanha ON public.bairros_estrategicos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_bairros_estrat_class ON public.bairros_estrategicos(classificacao);
ALTER TABLE public.bairros_estrategicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizar bairros estrategicos" ON public.bairros_estrategicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar bairros estrategicos" ON public.bairros_estrategicos FOR ALL TO authenticated USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));
CREATE TRIGGER trg_bairros_estrat_updated BEFORE UPDATE ON public.bairros_estrategicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. LIDERANÇAS LOCAIS
CREATE TABLE IF NOT EXISTS public.liderancas_locais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  nome text NOT NULL,
  apelido text,
  foto_url text,
  telefone text,
  whatsapp text,
  email text,
  municipio_id uuid REFERENCES public.municipios(id),
  bairro_id uuid REFERENCES public.bairros(id),
  endereco text,
  latitude numeric,
  longitude numeric,
  tipo lideranca_tipo NOT NULL DEFAULT 'comunitaria',
  tipos_secundarios lideranca_tipo[] DEFAULT '{}',
  tem_familia_grande boolean DEFAULT false,
  tamanho_familia_estimado integer DEFAULT 0,
  presidente_associacao boolean DEFAULT false,
  nome_associacao text,
  num_membros_associacao integer DEFAULT 0,
  lider_religioso boolean DEFAULT false,
  igreja_denominacao text,
  num_fieis_estimado integer DEFAULT 0,
  profissao text,
  profissao_influente boolean DEFAULT false,
  cargo_publico_anterior text,
  ja_foi_candidato boolean DEFAULT false,
  votos_recebidos_anterior integer,
  votos_estimados integer NOT NULL DEFAULT 0,
  rede_contatos_estimada integer NOT NULL DEFAULT 0,
  influencia_score numeric(5,2) NOT NULL DEFAULT 0,
  classificacao lideranca_classificacao NOT NULL DEFAULT 'C',
  status lideranca_status NOT NULL DEFAULT 'mapeado',
  alinhamento vereador_alinhamento DEFAULT 'desconhecido',
  responsavel_id uuid,
  ultimo_contato_em timestamptz,
  proximo_contato_em date,
  num_interacoes integer NOT NULL DEFAULT 0,
  observacoes text,
  tags text[] DEFAULT '{}',
  redes_sociais jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lider_campanha ON public.liderancas_locais(campanha_id);
CREATE INDEX IF NOT EXISTS idx_lider_municipio ON public.liderancas_locais(municipio_id);
CREATE INDEX IF NOT EXISTS idx_lider_bairro ON public.liderancas_locais(bairro_id);
CREATE INDEX IF NOT EXISTS idx_lider_class ON public.liderancas_locais(classificacao);
CREATE INDEX IF NOT EXISTS idx_lider_status ON public.liderancas_locais(status);
ALTER TABLE public.liderancas_locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizar liderancas" ON public.liderancas_locais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar liderancas" ON public.liderancas_locais FOR ALL TO authenticated USING (has_manage_role(auth.uid()) OR has_role(auth.uid(),'lideranca')) WITH CHECK (has_manage_role(auth.uid()) OR has_role(auth.uid(),'lideranca'));
CREATE TRIGGER trg_lider_updated BEFORE UPDATE ON public.liderancas_locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. VEREADORES HISTÓRICOS
CREATE TABLE IF NOT EXISTS public.vereadores_historicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  cod_municipio_tse text,
  nome_completo text NOT NULL,
  nome_urna text,
  numero_urna text,
  partido_sigla text,
  votos_recebidos integer NOT NULL DEFAULT 0,
  faixa_votos vereador_faixa_votos NOT NULL DEFAULT 'ate_150',
  eleito boolean DEFAULT false,
  posicao_ranking integer,
  alinhamento vereador_alinhamento DEFAULT 'desconhecido',
  bairros_forca_ids uuid[] DEFAULT '{}',
  area_abrangencia jsonb DEFAULT '{}'::jsonb,
  potencial_apoio numeric(5,2) DEFAULT 0,
  ja_contactado boolean DEFAULT false,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ano, uf, cod_municipio_tse, numero_urna)
);
CREATE INDEX IF NOT EXISTS idx_ver_hist_ano_uf ON public.vereadores_historicos(ano, uf);
CREATE INDEX IF NOT EXISTS idx_ver_hist_mun ON public.vereadores_historicos(municipio_id);
CREATE INDEX IF NOT EXISTS idx_ver_hist_faixa ON public.vereadores_historicos(faixa_votos);
CREATE INDEX IF NOT EXISTS idx_ver_hist_alinh ON public.vereadores_historicos(alinhamento);
CREATE INDEX IF NOT EXISTS idx_ver_hist_votos ON public.vereadores_historicos(votos_recebidos DESC);
ALTER TABLE public.vereadores_historicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizar vereadores historicos" ON public.vereadores_historicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar vereadores historicos" ON public.vereadores_historicos FOR ALL TO authenticated USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));
CREATE TRIGGER trg_ver_hist_updated BEFORE UPDATE ON public.vereadores_historicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. CRUZAMENTO VEREADOR × BAIRRO
CREATE TABLE IF NOT EXISTS public.vereador_bairro_forca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vereador_id uuid NOT NULL REFERENCES public.vereadores_historicos(id) ON DELETE CASCADE,
  bairro_id uuid NOT NULL REFERENCES public.bairros(id) ON DELETE CASCADE,
  votos_estimados integer NOT NULL DEFAULT 0,
  pct_dos_votos numeric(5,2) DEFAULT 0,
  fonte text DEFAULT 'inferido',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vereador_id, bairro_id)
);
CREATE INDEX IF NOT EXISTS idx_vbf_vereador ON public.vereador_bairro_forca(vereador_id);
CREATE INDEX IF NOT EXISTS idx_vbf_bairro ON public.vereador_bairro_forca(bairro_id);
ALTER TABLE public.vereador_bairro_forca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visualizar forca territorial" ON public.vereador_bairro_forca FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar forca territorial" ON public.vereador_bairro_forca FOR ALL TO authenticated USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));

-- 8. FAIXA DE VOTOS
CREATE OR REPLACE FUNCTION public.faixa_votos_vereador(_votos integer)
RETURNS vereador_faixa_votos LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _votos < 150 THEN 'ate_150'::vereador_faixa_votos
    WHEN _votos < 500 THEN 'f_150_500'::vereador_faixa_votos
    WHEN _votos < 1000 THEN 'f_500_1000'::vereador_faixa_votos
    WHEN _votos < 2000 THEN 'f_1000_2000'::vereador_faixa_votos
    WHEN _votos < 5000 THEN 'f_2000_5000'::vereador_faixa_votos
    ELSE 'acima_5000'::vereador_faixa_votos END;
$$;

-- 9. POPULAR VEREADORES HISTÓRICOS
CREATE OR REPLACE FUNCTION public.popular_vereadores_historicos(_uf text DEFAULT 'BA', _ano integer DEFAULT 2024, _votos_min integer DEFAULT 150)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer := 0;
BEGIN
  INSERT INTO public.vereadores_historicos (ano, uf, cod_municipio_tse, municipio_id, nome_completo, nome_urna, numero_urna, partido_sigla, votos_recebidos, faixa_votos, eleito)
  SELECT c.ano, c.uf, c.cod_municipio_tse,
    (SELECT id FROM public.municipios m WHERE m.geocodigo_ibge::text LIKE c.cod_municipio_tse || '%' OR public.unaccent(lower(m.nome)) = public.unaccent(lower(coalesce(c.raw->>'NM_UE',''))) LIMIT 1),
    c.nome_completo, c.nome_urna, c.numero_urna, c.partido_sigla,
    COALESCE((c.raw->>'QT_VOTOS_NOMINAIS')::integer, 0),
    public.faixa_votos_vereador(COALESCE((c.raw->>'QT_VOTOS_NOMINAIS')::integer, 0)),
    c.eleito
  FROM public.tse_candidatos c
  WHERE c.ano = _ano AND c.uf = _uf AND lower(c.cargo) LIKE '%vereador%'
    AND COALESCE((c.raw->>'QT_VOTOS_NOMINAIS')::integer, 0) >= _votos_min
  ON CONFLICT (ano, uf, cod_municipio_tse, numero_urna) DO UPDATE SET
    votos_recebidos = EXCLUDED.votos_recebidos,
    faixa_votos = EXCLUDED.faixa_votos,
    eleito = EXCLUDED.eleito,
    updated_at = now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 10. SCORE DE INFLUÊNCIA AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.calcular_score_lideranca()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _score numeric := 0;
BEGIN
  IF NEW.tem_familia_grande THEN _score := _score + LEAST(25, COALESCE(NEW.tamanho_familia_estimado, 0) * 0.5); END IF;
  IF NEW.presidente_associacao THEN _score := _score + LEAST(25, 10 + COALESCE(NEW.num_membros_associacao, 0) * 0.05); END IF;
  IF NEW.lider_religioso THEN _score := _score + LEAST(25, 10 + COALESCE(NEW.num_fieis_estimado, 0) * 0.03); END IF;
  IF NEW.profissao_influente THEN _score := _score + 10; END IF;
  IF NEW.ja_foi_candidato THEN _score := _score + LEAST(15, COALESCE(NEW.votos_recebidos_anterior, 0) / 100.0); END IF;
  NEW.influencia_score := LEAST(100, _score);
  NEW.classificacao := CASE
    WHEN NEW.influencia_score >= 75 THEN 'A'::lideranca_classificacao
    WHEN NEW.influencia_score >= 50 THEN 'B'::lideranca_classificacao
    WHEN NEW.influencia_score >= 25 THEN 'C'::lideranca_classificacao
    ELSE 'D'::lideranca_classificacao END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calcular_score_lideranca
BEFORE INSERT OR UPDATE OF tem_familia_grande, tamanho_familia_estimado, presidente_associacao, num_membros_associacao, lider_religioso, num_fieis_estimado, profissao_influente, ja_foi_candidato, votos_recebidos_anterior
ON public.liderancas_locais FOR EACH ROW EXECUTE FUNCTION public.calcular_score_lideranca();