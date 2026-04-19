-- =========================================================
-- FRENTE 3: WORKFLOW APROVAÇÃO DE CONTRATOS
-- =========================================================

CREATE TYPE public.contrato_aprovacao_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'revisao');
CREATE TYPE public.contrato_aprovacao_papel AS ENUM ('tesoureiro', 'juridico', 'candidato', 'admin');

-- Template de workflow por faixa de valor
CREATE TABLE public.contrato_workflow_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor_min numeric NOT NULL DEFAULT 0,
  valor_max numeric,
  ordem integer NOT NULL,
  papel public.contrato_aprovacao_papel NOT NULL,
  exige_observacao boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed dos templates padrão
INSERT INTO public.contrato_workflow_template (nome, valor_min, valor_max, ordem, papel, exige_observacao) VALUES
  ('Pequeno valor', 0, 5000, 1, 'tesoureiro', false),
  ('Médio valor — etapa 1', 5000.01, 50000, 1, 'tesoureiro', false),
  ('Médio valor — etapa 2', 5000.01, 50000, 2, 'juridico', false),
  ('Alto valor — etapa 1', 50000.01, NULL, 1, 'tesoureiro', false),
  ('Alto valor — etapa 2', 50000.01, NULL, 2, 'juridico', true),
  ('Alto valor — etapa 3', 50000.01, NULL, 3, 'candidato', true);

-- Aprovações concretas por contrato
CREATE TABLE public.contrato_aprovacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  papel public.contrato_aprovacao_papel NOT NULL,
  status public.contrato_aprovacao_status NOT NULL DEFAULT 'pendente',
  aprovador_id uuid,
  observacao text,
  exige_observacao boolean NOT NULL DEFAULT false,
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contrato_id, ordem)
);

CREATE INDEX idx_contrato_aprovacoes_contrato ON public.contrato_aprovacoes(contrato_id);
CREATE INDEX idx_contrato_aprovacoes_status ON public.contrato_aprovacoes(status);

ALTER TABLE public.contrato_workflow_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_aprovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view workflow templates" ON public.contrato_workflow_template FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage workflow templates" ON public.contrato_workflow_template FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Auth view aprovacoes" ON public.contrato_aprovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers update aprovacoes" ON public.contrato_aprovacoes FOR UPDATE TO authenticated
  USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers insert aprovacoes" ON public.contrato_aprovacoes FOR INSERT TO authenticated
  WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Admin delete aprovacoes" ON public.contrato_aprovacoes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Função: cria automaticamente as aprovações para um contrato
CREATE OR REPLACE FUNCTION public.criar_aprovacoes_contrato(_contrato_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _valor numeric;
  _tpl record;
BEGIN
  SELECT valor INTO _valor FROM public.contratos WHERE id = _contrato_id;
  IF _valor IS NULL THEN RETURN; END IF;

  DELETE FROM public.contrato_aprovacoes WHERE contrato_id = _contrato_id AND status = 'pendente';

  FOR _tpl IN
    SELECT * FROM public.contrato_workflow_template
    WHERE ativo = true
      AND valor_min <= _valor
      AND (valor_max IS NULL OR valor_max >= _valor)
    ORDER BY ordem
  LOOP
    INSERT INTO public.contrato_aprovacoes (contrato_id, ordem, papel, exige_observacao)
    VALUES (_contrato_id, _tpl.ordem, _tpl.papel, _tpl.exige_observacao)
    ON CONFLICT (contrato_id, ordem) DO NOTHING;
  END LOOP;
END;
$$;

-- Trigger: ao inserir contrato, gera o workflow
CREATE OR REPLACE FUNCTION public.tg_contrato_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.criar_aprovacoes_contrato(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contrato_after_insert
AFTER INSERT ON public.contratos
FOR EACH ROW EXECUTE FUNCTION public.tg_contrato_after_insert();

-- Trigger: quando todas aprovações ficam aprovadas, marca contrato como vigente
CREATE OR REPLACE FUNCTION public.tg_aprovacao_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pendentes int;
  _rejeitados int;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  NEW.decidido_em := now();
  NEW.updated_at := now();
  NEW.aprovador_id := COALESCE(NEW.aprovador_id, auth.uid());

  SELECT
    COUNT(*) FILTER (WHERE status = 'pendente'),
    COUNT(*) FILTER (WHERE status = 'rejeitado')
  INTO _pendentes, _rejeitados
  FROM public.contrato_aprovacoes
  WHERE contrato_id = NEW.contrato_id AND id <> NEW.id;

  -- Considera nova decisão
  IF NEW.status = 'rejeitado' THEN _rejeitados := _rejeitados + 1; END IF;
  IF NEW.status = 'pendente' THEN _pendentes := _pendentes + 1; END IF;

  IF _rejeitados > 0 THEN
    UPDATE public.contratos SET status = 'rejeitado', updated_at = now() WHERE id = NEW.contrato_id;
  ELSIF _pendentes = 0 AND NEW.status = 'aprovado' THEN
    UPDATE public.contratos SET status = 'vigente', updated_at = now() WHERE id = NEW.contrato_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_aprovacao_after_update
BEFORE UPDATE ON public.contrato_aprovacoes
FOR EACH ROW EXECUTE FUNCTION public.tg_aprovacao_after_update();

-- View: aprovações pendentes para o usuário atual
CREATE OR REPLACE VIEW public.v_minhas_aprovacoes_pendentes AS
SELECT
  a.id, a.contrato_id, a.ordem, a.papel, a.exige_observacao, a.created_at,
  c.numero, c.objeto, c.valor, c.fornecedor_pessoa_id, c.data_inicio, c.data_fim
FROM public.contrato_aprovacoes a
JOIN public.contratos c ON c.id = a.contrato_id
WHERE a.status = 'pendente';

-- =========================================================
-- FRENTE 6: DEMOGRAFIA IBGE + OSM
-- =========================================================

ALTER TABLE public.municipios
  ADD COLUMN IF NOT EXISTS populacao_2022 integer,
  ADD COLUMN IF NOT EXISTS area_km2 numeric,
  ADD COLUMN IF NOT EXISTS idh numeric,
  ADD COLUMN IF NOT EXISTS urbano_pct numeric,
  ADD COLUMN IF NOT EXISTS densidade_hab_km2 numeric,
  ADD COLUMN IF NOT EXISTS ano_referencia integer DEFAULT 2022,
  ADD COLUMN IF NOT EXISTS ibge_atualizado_em timestamptz;

CREATE TYPE public.zona_tipo AS ENUM ('urbano', 'rural', 'misto', 'desconhecido');

ALTER TABLE public.bairros
  ADD COLUMN IF NOT EXISTS zona_tipo public.zona_tipo DEFAULT 'desconhecido',
  ADD COLUMN IF NOT EXISTS populacao_estimada integer,
  ADD COLUMN IF NOT EXISTS area_km2 numeric,
  ADD COLUMN IF NOT EXISTS geometria jsonb,
  ADD COLUMN IF NOT EXISTS osm_id bigint,
  ADD COLUMN IF NOT EXISTS osm_atualizado_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_bairros_osm ON public.bairros(osm_id) WHERE osm_id IS NOT NULL;

CREATE TABLE public.municipio_demografia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  faixa_etaria text NOT NULL,
  faixa_min integer NOT NULL,
  faixa_max integer,
  sexo text NOT NULL CHECK (sexo IN ('M', 'F', 'T')),
  quantidade integer NOT NULL DEFAULT 0,
  fonte text NOT NULL DEFAULT 'IBGE-Censo2022',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipio_id, ano, faixa_etaria, sexo)
);

CREATE INDEX idx_demografia_municipio ON public.municipio_demografia(municipio_id);
CREATE INDEX idx_demografia_ano ON public.municipio_demografia(ano);

ALTER TABLE public.municipio_demografia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view demografia" ON public.municipio_demografia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage demografia" ON public.municipio_demografia FOR ALL TO authenticated
  USING (has_manage_role(auth.uid())) WITH CHECK (has_manage_role(auth.uid()));

-- Tabela de jobs de importação IBGE/OSM
CREATE TYPE public.import_job_status AS ENUM ('pendente', 'rodando', 'sucesso', 'erro', 'parcial');

CREATE TABLE public.dados_externos_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte text NOT NULL,
  tipo text NOT NULL,
  uf text,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  status public.import_job_status NOT NULL DEFAULT 'pendente',
  total_processados integer NOT NULL DEFAULT 0,
  total_inseridos integer NOT NULL DEFAULT 0,
  total_atualizados integer NOT NULL DEFAULT 0,
  erro text,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status ON public.dados_externos_jobs(status);
CREATE INDEX idx_jobs_fonte ON public.dados_externos_jobs(fonte);

ALTER TABLE public.dados_externos_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view jobs" ON public.dados_externos_jobs FOR SELECT TO authenticated
  USING (has_manage_role(auth.uid()));
CREATE POLICY "Admin manage jobs" ON public.dados_externos_jobs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));