-- Classificação estratégica de municípios para campanhas
ALTER TABLE public.municipios
  ADD COLUMN IF NOT EXISTS classificacao_estrategica text CHECK (classificacao_estrategica IN ('A','B','C','foco') OR classificacao_estrategica IS NULL),
  ADD COLUMN IF NOT EXISTS prioridade_campanha smallint CHECK (prioridade_campanha BETWEEN 1 AND 5) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notas_estrategicas text;

CREATE INDEX IF NOT EXISTS idx_municipios_classificacao ON public.municipios(classificacao_estrategica) WHERE classificacao_estrategica IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_municipios_prioridade ON public.municipios(prioridade_campanha) WHERE prioridade_campanha IS NOT NULL;

COMMENT ON COLUMN public.municipios.classificacao_estrategica IS 'Classificação estratégica: A=alta prioridade, B=média, C=baixa, foco=município sede da campanha';
COMMENT ON COLUMN public.municipios.prioridade_campanha IS 'Prioridade operacional 1-5 (1 = mais urgente)';