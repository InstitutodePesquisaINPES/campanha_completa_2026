UPDATE public.campanhas
SET cargo = 'deputado_federal',
    nome = regexp_replace(nome, 'Estadual', 'Federal', 'gi'),
    updated_at = now()
WHERE lower(nome) LIKE '%kiribamba%';