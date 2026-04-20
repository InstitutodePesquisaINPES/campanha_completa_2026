-- Deduplica eleitorado perfil mantendo o registro mais antigo de cada combinação
DELETE FROM public.tse_eleitorado_perfil a
USING public.tse_eleitorado_perfil b
WHERE a.ctid > b.ctid
  AND a.ano = b.ano
  AND a.uf = b.uf
  AND COALESCE(a.municipio,'') = COALESCE(b.municipio,'')
  AND COALESCE(a.cor_raca,'') = COALESCE(b.cor_raca,'')
  AND COALESCE(a.estado_civil,'') = COALESCE(b.estado_civil,'')
  AND COALESCE(a.faixa_etaria,'') = COALESCE(b.faixa_etaria,'')
  AND COALESCE(a.genero,'') = COALESCE(b.genero,'')
  AND COALESCE(a.grau_instrucao,'') = COALESCE(b.grau_instrucao,'')
  AND COALESCE(a.identidade_genero,'') = COALESCE(b.identidade_genero,'')
  AND COALESCE(a.interprete_libras,'') = COALESCE(b.interprete_libras,'')
  AND COALESCE(a.quilombola,'') = COALESCE(b.quilombola,'');

CREATE UNIQUE INDEX IF NOT EXISTS tse_eleit_perfil_uniq
ON public.tse_eleitorado_perfil (
  ano, uf,
  COALESCE(municipio,''),
  COALESCE(cor_raca,''),
  COALESCE(estado_civil,''),
  COALESCE(faixa_etaria,''),
  COALESCE(genero,''),
  COALESCE(grau_instrucao,''),
  COALESCE(identidade_genero,''),
  COALESCE(interprete_libras,''),
  COALESCE(quilombola,'')
);

-- Deduplica votação candidato perfil
DELETE FROM public.tse_votacao_candidato_perfil a
USING public.tse_votacao_candidato_perfil b
WHERE a.ctid > b.ctid
  AND a.ano = b.ano
  AND a.uf = b.uf
  AND a.turno = b.turno
  AND COALESCE(a.cod_municipio_tse,'') = COALESCE(b.cod_municipio_tse,'')
  AND COALESCE(a.cargo,'') = COALESCE(b.cargo,'')
  AND COALESCE(a.numero_candidato,'') = COALESCE(b.numero_candidato,'')
  AND COALESCE(a.cor_raca,'') = COALESCE(b.cor_raca,'')
  AND COALESCE(a.estado_civil,'') = COALESCE(b.estado_civil,'')
  AND COALESCE(a.faixa_etaria,'') = COALESCE(b.faixa_etaria,'')
  AND COALESCE(a.genero,'') = COALESCE(b.genero,'')
  AND COALESCE(a.grau_instrucao,'') = COALESCE(b.grau_instrucao,'');

CREATE UNIQUE INDEX IF NOT EXISTS tse_votcand_perfil_uniq
ON public.tse_votacao_candidato_perfil (
  ano, uf, turno,
  COALESCE(cod_municipio_tse,''),
  COALESCE(cargo,''),
  COALESCE(numero_candidato,''),
  COALESCE(cor_raca,''),
  COALESCE(estado_civil,''),
  COALESCE(faixa_etaria,''),
  COALESCE(genero,''),
  COALESCE(grau_instrucao,'')
);