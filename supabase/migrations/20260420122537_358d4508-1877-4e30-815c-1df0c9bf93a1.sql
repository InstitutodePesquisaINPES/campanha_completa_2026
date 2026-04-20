
-- Tabela: perfil consolidado do eleitorado (CSV "eleitorado_eleicao")
CREATE TABLE IF NOT EXISTS public.tse_eleitorado_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  regiao text,
  municipio text,
  pais text,
  cor_raca text,
  estado_civil text,
  faixa_etaria text,
  genero text,
  grau_instrucao text,
  identidade_genero text,
  interprete_libras text,
  quilombola text,
  quantidade_eleitores integer NOT NULL DEFAULT 0,
  data_carga timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tse_eleit_perfil_ano_uf ON public.tse_eleitorado_perfil(ano, uf);
CREATE INDEX IF NOT EXISTS idx_tse_eleit_perfil_municipio ON public.tse_eleitorado_perfil(municipio);
CREATE INDEX IF NOT EXISTS idx_tse_eleit_perfil_genero ON public.tse_eleitorado_perfil(genero);
CREATE INDEX IF NOT EXISTS idx_tse_eleit_perfil_faixa ON public.tse_eleitorado_perfil(faixa_etaria);

ALTER TABLE public.tse_eleitorado_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tse_eleit_perfil_select_auth" ON public.tse_eleitorado_perfil
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tse_eleit_perfil_insert_manage" ON public.tse_eleitorado_perfil
  FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "tse_eleit_perfil_update_manage" ON public.tse_eleitorado_perfil
  FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "tse_eleit_perfil_delete_manage" ON public.tse_eleitorado_perfil
  FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));


-- Tabela: votação por candidato com perfil demográfico (CSV "votacao_candidato")
CREATE TABLE IF NOT EXISTS public.tse_votacao_candidato_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  uf text NOT NULL,
  regiao text,
  municipio text,
  cod_municipio_tse text,
  cargo text NOT NULL,
  nome_candidato text,
  numero_candidato text,
  ocupacao text,
  partido text,
  situacao_totalizacao text,
  turno integer NOT NULL DEFAULT 1,
  zona integer,
  cor_raca text,
  estado_civil text,
  faixa_etaria text,
  genero text,
  grau_instrucao text,
  votos_validos integer DEFAULT 0,
  votos_nominais integer DEFAULT 0,
  data_carga timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tse_votcand_perfil_ano_uf ON public.tse_votacao_candidato_perfil(ano, uf);
CREATE INDEX IF NOT EXISTS idx_tse_votcand_perfil_municipio ON public.tse_votacao_candidato_perfil(cod_municipio_tse);
CREATE INDEX IF NOT EXISTS idx_tse_votcand_perfil_cargo ON public.tse_votacao_candidato_perfil(cargo);
CREATE INDEX IF NOT EXISTS idx_tse_votcand_perfil_candidato ON public.tse_votacao_candidato_perfil(numero_candidato, partido);

ALTER TABLE public.tse_votacao_candidato_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tse_votcand_perfil_select_auth" ON public.tse_votacao_candidato_perfil
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tse_votcand_perfil_insert_manage" ON public.tse_votacao_candidato_perfil
  FOR INSERT TO authenticated WITH CHECK (public.has_manage_role(auth.uid()));
CREATE POLICY "tse_votcand_perfil_update_manage" ON public.tse_votacao_candidato_perfil
  FOR UPDATE TO authenticated USING (public.has_manage_role(auth.uid()));
CREATE POLICY "tse_votcand_perfil_delete_manage" ON public.tse_votacao_candidato_perfil
  FOR DELETE TO authenticated USING (public.has_manage_role(auth.uid()));
