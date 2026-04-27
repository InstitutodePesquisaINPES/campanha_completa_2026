CREATE OR REPLACE FUNCTION public.tse_cstr(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$ SELECT COALESCE(t, CHR(45)::text) $fn$;

CREATE OR REPLACE FUNCTION public.tse_cint(i int, def int) RETURNS int
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$ SELECT COALESCE(i, def) $fn$;

CREATE TEMP TABLE _ep AS
SELECT ano, uf, municipio,
  public.tse_cstr(genero::text) g, public.tse_cstr(faixa_etaria::text) f,
  public.tse_cstr(grau_instrucao::text) gi, public.tse_cstr(cor_raca::text) cr, public.tse_cstr(estado_civil::text) ec,
  SUM(quantidade_eleitores)::bigint AS qe
FROM public.tse_eleitorado_perfil GROUP BY 1,2,3,4,5,6,7,8;
DELETE FROM public.tse_eleitorado_perfil;
INSERT INTO public.tse_eleitorado_perfil
  (ano, uf, municipio, genero, faixa_etaria, grau_instrucao, cor_raca, estado_civil, quantidade_eleitores)
SELECT ano, uf, municipio,
  NULLIF(g, CHR(45)::text), NULLIF(f, CHR(45)::text),
  NULLIF(gi, CHR(45)::text), NULLIF(cr, CHR(45)::text), NULLIF(ec, CHR(45)::text), qe
FROM _ep;

CREATE TEMP TABLE _vcp AS
SELECT ano, uf, municipio,
  public.tse_cstr(cod_municipio_tse::text) cm, public.tse_cstr(numero_candidato::text) nc, public.tse_cstr(cargo::text) cg,
  public.tse_cint(turno, 1) AS turno, public.tse_cint(zona, 0) AS zona,
  public.tse_cstr(genero::text) g, public.tse_cstr(faixa_etaria::text) f,
  public.tse_cstr(grau_instrucao::text) gi, public.tse_cstr(cor_raca::text) cr, public.tse_cstr(estado_civil::text) ec,
  SUM(COALESCE(votos_nominais,0))::int AS vn, SUM(COALESCE(votos_validos,0))::int AS vv,
  MAX(nome_candidato) nm, MAX(partido) pt, MAX(ocupacao) oc, MAX(situacao_totalizacao) st, MAX(regiao) rg
FROM public.tse_votacao_candidato_perfil GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13;
DELETE FROM public.tse_votacao_candidato_perfil;
INSERT INTO public.tse_votacao_candidato_perfil
  (ano, uf, regiao, municipio, cod_municipio_tse, cargo, nome_candidato, numero_candidato,
   ocupacao, partido, situacao_totalizacao, turno, zona,
   cor_raca, estado_civil, faixa_etaria, genero, grau_instrucao, votos_validos, votos_nominais)
SELECT ano, uf, rg, municipio,
  NULLIF(cm, CHR(45)::text), NULLIF(cg, CHR(45)::text), nm, NULLIF(nc, CHR(45)::text),
  oc, pt, st, turno, NULLIF(zona, 0),
  NULLIF(cr, CHR(45)::text), NULLIF(ec, CHR(45)::text),
  NULLIF(f, CHR(45)::text), NULLIF(g, CHR(45)::text), NULLIF(gi, CHR(45)::text), vv, vn
FROM _vcp;

CREATE TEMP TABLE _el AS
SELECT ano, uf,
  public.tse_cstr(cod_municipio_tse::text) cm,
  public.tse_cint(zona, 0) zn, public.tse_cint(secao, 0) sc,
  public.tse_cstr(genero::text) g, public.tse_cstr(faixa_etaria::text) f,
  public.tse_cstr(escolaridade::text) es, public.tse_cstr(estado_civil::text) ec,
  (array_agg(municipio_id))[1] mu_id,
  SUM(COALESCE(total_eleitores,0))::int AS te
FROM public.tse_eleitorado GROUP BY 1,2,3,4,5,6,7,8,9;
DELETE FROM public.tse_eleitorado;
INSERT INTO public.tse_eleitorado
  (ano, uf, municipio_id, cod_municipio_tse, zona, secao,
   genero, faixa_etaria, escolaridade, estado_civil, total_eleitores)
SELECT ano, uf, mu_id, NULLIF(cm, CHR(45)::text),
  NULLIF(zn, 0), NULLIF(sc, 0),
  NULLIF(g, CHR(45)::text)::jsonb, NULLIF(f, CHR(45)::text)::jsonb,
  NULLIF(es, CHR(45)::text)::jsonb, NULLIF(ec, CHR(45)::text)::jsonb, te
FROM _el;

CREATE UNIQUE INDEX IF NOT EXISTS tse_resultados_secao_uniq
  ON public.tse_resultados_secao (ano, uf, cod_municipio_tse, zona, secao, cargo, numero_votavel, public.tse_cint(turno,1));

CREATE UNIQUE INDEX IF NOT EXISTS tse_locais_votacao_uniq
  ON public.tse_locais_votacao (ano, uf, cod_municipio_tse, zona, codigo_local);

CREATE UNIQUE INDEX IF NOT EXISTS tse_candidatos_uniq
  ON public.tse_candidatos (ano, uf, cod_municipio_tse, numero_urna, public.tse_cint(turno,1))
  WHERE numero_urna IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tse_eleitorado_perfil_uniq
  ON public.tse_eleitorado_perfil (
    ano, uf, municipio,
    public.tse_cstr(genero::text), public.tse_cstr(faixa_etaria::text),
    public.tse_cstr(grau_instrucao::text), public.tse_cstr(cor_raca::text), public.tse_cstr(estado_civil::text)
  );

CREATE UNIQUE INDEX IF NOT EXISTS tse_votacao_candidato_perfil_uniq
  ON public.tse_votacao_candidato_perfil (
    ano, uf, municipio,
    public.tse_cstr(numero_candidato::text), public.tse_cstr(cargo::text),
    public.tse_cint(turno, 1), public.tse_cint(zona, 0),
    public.tse_cstr(genero::text), public.tse_cstr(faixa_etaria::text),
    public.tse_cstr(grau_instrucao::text), public.tse_cstr(cor_raca::text), public.tse_cstr(estado_civil::text)
  );

CREATE UNIQUE INDEX IF NOT EXISTS tse_eleitorado_uniq
  ON public.tse_eleitorado (
    ano, uf, public.tse_cstr(cod_municipio_tse::text),
    public.tse_cint(zona, 0), public.tse_cint(secao, 0),
    public.tse_cstr(genero::text), public.tse_cstr(faixa_etaria::text),
    public.tse_cstr(escolaridade::text), public.tse_cstr(estado_civil::text)
  );