CREATE TABLE public.reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'executiva',
  data_reuniao timestamptz NOT NULL,
  local text,
  pauta text,
  ata text,
  status text NOT NULL DEFAULT 'agendada',
  responsavel_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view reunioes" ON public.reunioes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert reunioes" ON public.reunioes FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update reunioes" ON public.reunioes FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete reunioes" ON public.reunioes FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER trg_reunioes_updated BEFORE UPDATE ON public.reunioes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reuniao_deliberacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid NOT NULL REFERENCES public.reunioes(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  responsavel_id uuid,
  prazo date,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reuniao_deliberacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view deliberacoes" ON public.reuniao_deliberacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert deliberacoes" ON public.reuniao_deliberacoes FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update deliberacoes" ON public.reuniao_deliberacoes FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete deliberacoes" ON public.reuniao_deliberacoes FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER trg_deliberacoes_updated BEFORE UPDATE ON public.reuniao_deliberacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.v_indicadores_campanha
WITH (security_invoker = true) AS
SELECT
  c.id AS campanha_id,
  c.nome AS campanha_nome,
  c.cargo,
  c.meta_votos,
  c.data_eleicao,
  (c.data_eleicao - CURRENT_DATE) AS dias_restantes,
  (SELECT COUNT(*) FROM public.pessoas) AS total_pessoas,
  (SELECT COUNT(*) FROM public.demandas WHERE status NOT IN ('resolvida','arquivada')) AS demandas_abertas,
  (SELECT COUNT(*) FROM public.demandas WHERE status = 'resolvida') AS demandas_resolvidas,
  (SELECT COUNT(*) FROM public.demandas WHERE prioridade = 'urgente' AND status NOT IN ('resolvida','arquivada')) AS demandas_urgentes,
  (SELECT COUNT(*) FROM public.agenda WHERE data_inicio >= now()) AS eventos_futuros,
  (SELECT COUNT(*) FROM public.campanha_tarefas WHERE campanha_id = c.id AND status = 'concluida') AS tarefas_concluidas,
  (SELECT COUNT(*) FROM public.campanha_tarefas WHERE campanha_id = c.id) AS tarefas_total,
  (SELECT COUNT(*) FROM public.campanha_tarefas WHERE campanha_id = c.id AND status IN ('pendente','atrasada') AND data_prevista < CURRENT_DATE) AS tarefas_atrasadas,
  (SELECT COALESCE(SUM(valor),0) FROM public.despesas WHERE status IN ('paga','aprovada')) AS total_gasto,
  COALESCE(c.orcamento_total, 0) AS orcamento_total
FROM public.campanhas c
WHERE c.ativa = true;

CREATE OR REPLACE VIEW public.v_burndown_tarefas
WITH (security_invoker = true) AS
SELECT
  campanha_id,
  data_prevista,
  COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas_dia,
  COUNT(*) AS total_dia,
  SUM(COUNT(*)) OVER (PARTITION BY campanha_id ORDER BY data_prevista) AS total_acumulado,
  SUM(COUNT(*) FILTER (WHERE status = 'concluida')) OVER (PARTITION BY campanha_id ORDER BY data_prevista) AS concluidas_acumulado
FROM public.campanha_tarefas
GROUP BY campanha_id, data_prevista;