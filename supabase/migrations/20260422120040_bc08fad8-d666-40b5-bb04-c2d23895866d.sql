
CREATE TABLE IF NOT EXISTS public.campanha_metas_municipio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  meta_votos integer NOT NULL DEFAULT 0,
  meta_cadastros integer NOT NULL DEFAULT 0,
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, municipio_id)
);

ALTER TABLE public.campanha_metas_municipio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura autenticada" ON public.campanha_metas_municipio
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestao por has_manage_role" ON public.campanha_metas_municipio
  FOR ALL TO authenticated
  USING (public.has_manage_role(auth.uid()))
  WITH CHECK (public.has_manage_role(auth.uid()));

CREATE TRIGGER trg_metas_municipio_updated
  BEFORE UPDATE ON public.campanha_metas_municipio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_metas_municipio_campanha ON public.campanha_metas_municipio(campanha_id);

CREATE OR REPLACE VIEW public.v_cobertura_territorial_campanha AS
WITH foco AS (
  SELECT c.id AS campanha_id, c.meta_votos AS meta_global, unnest(c.municipios_foco_ids) AS municipio_id
  FROM public.campanhas c
  WHERE c.ativa = true
)
SELECT
  f.campanha_id,
  m.id AS municipio_id,
  m.nome AS municipio_nome,
  m.geocodigo_ibge,
  COALESCE(mm.meta_votos, 0) AS meta_votos,
  COALESCE(mm.meta_cadastros, 0) AS meta_cadastros,
  COALESCE(mm.prioridade, 'media') AS prioridade,
  (SELECT COUNT(DISTINCT pe.pessoa_id) FROM public.pessoas_enderecos pe
     WHERE pe.municipio_id = m.id) AS cadastrados,
  (SELECT COALESCE(SUM(quantidade_eleitores),0) FROM public.tse_eleitorado_perfil
     WHERE municipio = upper(public.unaccent(m.nome))) AS eleitorado_tse,
  (SELECT COUNT(*) FROM public.bairros WHERE municipio_id = m.id) AS bairros_count
FROM foco f
JOIN public.municipios m ON m.id = f.municipio_id
LEFT JOIN public.campanha_metas_municipio mm
  ON mm.campanha_id = f.campanha_id AND mm.municipio_id = m.id;

GRANT SELECT ON public.v_cobertura_territorial_campanha TO authenticated;
