DROP VIEW IF EXISTS public.v_minhas_aprovacoes_pendentes;

CREATE VIEW public.v_minhas_aprovacoes_pendentes
WITH (security_invoker = true) AS
SELECT
  a.id, a.contrato_id, a.ordem, a.papel, a.exige_observacao, a.created_at,
  c.numero, c.objeto, c.valor, c.fornecedor_pessoa_id, c.data_inicio, c.data_fim
FROM public.contrato_aprovacoes a
JOIN public.contratos c ON c.id = a.contrato_id
WHERE a.status = 'pendente';