
-- Cenários salvos do mapa
CREATE TABLE public.mapa_cenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  publico BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mapa_cenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cenarios_select" ON public.mapa_cenarios FOR SELECT
  USING (
    has_role(auth.uid(),'admin')
    OR created_by = auth.uid()
    OR (publico = true AND (campanha_id IS NULL OR public.user_has_campanha_scope(auth.uid(), campanha_id)))
  );

CREATE POLICY "cenarios_insert" ON public.mapa_cenarios FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "cenarios_update" ON public.mapa_cenarios FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR created_by = auth.uid());

CREATE POLICY "cenarios_delete" ON public.mapa_cenarios FOR DELETE
  USING (has_role(auth.uid(),'admin') OR created_by = auth.uid());

CREATE TRIGGER trg_mapa_cenarios_updated
  BEFORE UPDATE ON public.mapa_cenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Setores (polígonos) do mapa
CREATE TABLE public.mapa_setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
  municipio_id UUID REFERENCES public.municipios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'setor',
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  geometria JSONB NOT NULL,
  area_km2 NUMERIC,
  perimetro_km NUMERIC,
  responsavel_id UUID,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mapa_setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setores_select" ON public.mapa_setores FOR SELECT
  USING (
    has_role(auth.uid(),'admin')
    OR campanha_id IS NULL
    OR public.user_has_campanha_scope(auth.uid(), campanha_id)
  );

CREATE POLICY "setores_insert" ON public.mapa_setores FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (campanha_id IS NULL OR public.user_has_campanha_scope(auth.uid(), campanha_id))
  );

CREATE POLICY "setores_update" ON public.mapa_setores FOR UPDATE
  USING (
    has_role(auth.uid(),'admin')
    OR created_by = auth.uid()
    OR (campanha_id IS NOT NULL AND public.user_has_campanha_scope(auth.uid(), campanha_id))
  );

CREATE POLICY "setores_delete" ON public.mapa_setores FOR DELETE
  USING (has_role(auth.uid(),'admin') OR created_by = auth.uid());

CREATE TRIGGER trg_mapa_setores_updated
  BEFORE UPDATE ON public.mapa_setores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mapa_setores_campanha ON public.mapa_setores(campanha_id);
CREATE INDEX idx_mapa_cenarios_campanha ON public.mapa_cenarios(campanha_id);
