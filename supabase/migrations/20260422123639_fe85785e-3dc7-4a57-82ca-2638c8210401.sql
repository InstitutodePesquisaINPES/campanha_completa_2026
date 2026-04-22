DO $$ BEGIN
  CREATE TYPE public.fase_legal_campanha AS ENUM ('pre_campanha_legal','campanha_oficial','pos_eleicao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.campanha_tarefas
  ADD COLUMN IF NOT EXISTS fase_legal public.fase_legal_campanha DEFAULT 'pre_campanha_legal',
  ADD COLUMN IF NOT EXISTS respaldo_legal text,
  ADD COLUMN IF NOT EXISTS o_que_e text,
  ADD COLUMN IF NOT EXISTS o_que_faz text,
  ADD COLUMN IF NOT EXISTS entregaveis text,
  ADD COLUMN IF NOT EXISTS is_marco boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS responsavel_papel text,
  ADD COLUMN IF NOT EXISTS permitido_antes_registro boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.campanha_subtarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.campanha_tarefas(id) ON DELETE CASCADE,
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subtarefas_tarefa ON public.campanha_subtarefas(tarefa_id);

ALTER TABLE public.campanha_subtarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subtarefas_select_scope" ON public.campanha_subtarefas;
CREATE POLICY "subtarefas_select_scope" ON public.campanha_subtarefas
  FOR SELECT TO authenticated
  USING (public.user_has_campanha_scope(auth.uid(), campanha_id));

DROP POLICY IF EXISTS "subtarefas_insert_scope" ON public.campanha_subtarefas;
CREATE POLICY "subtarefas_insert_scope" ON public.campanha_subtarefas
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_campanha_scope(auth.uid(), campanha_id));

DROP POLICY IF EXISTS "subtarefas_update_scope" ON public.campanha_subtarefas;
CREATE POLICY "subtarefas_update_scope" ON public.campanha_subtarefas
  FOR UPDATE TO authenticated
  USING (public.user_has_campanha_scope(auth.uid(), campanha_id));

DROP POLICY IF EXISTS "subtarefas_delete_scope" ON public.campanha_subtarefas;
CREATE POLICY "subtarefas_delete_scope" ON public.campanha_subtarefas
  FOR DELETE TO authenticated
  USING (public.user_has_campanha_scope(auth.uid(), campanha_id));

DROP TRIGGER IF EXISTS trg_subtarefas_updated_at ON public.campanha_subtarefas;
CREATE TRIGGER trg_subtarefas_updated_at
  BEFORE UPDATE ON public.campanha_subtarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atualiza tarefas da Kiribamba com respaldo legal correto
DO $$
DECLARE v_camp uuid;
BEGIN
  SELECT id INTO v_camp FROM public.campanhas WHERE nome ILIKE '%kiribamba%' LIMIT 1;
  IF v_camp IS NULL THEN RETURN; END IF;

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'pre_campanha_legal', permitido_antes_registro = true,
    responsavel_papel = 'Pré-candidato + Coordenador Geral',
    o_que_e = 'Ato formal de constituição da equipe pré-eleitoral. Define quem responde por cada área antes do registro oficial de candidatura no TSE.',
    o_que_faz = 'Formaliza papéis-chave: Coordenador Geral, Coordenador de Marketing/Digital, Secretaria Executiva, Assessoria de Imprensa, Jurídico Eleitoral, Tesoureiro/Administrador. Aprova organograma e custo total estimado da equipe.',
    entregaveis = E'• Ata de constituição assinada por todos\n• Organograma com nomes e funções\n• Planilha de custo mensal da equipe\n• Termo de confidencialidade assinado',
    respaldo_legal = 'Lei 9.504/97, art. 36-A: atos de pré-campanha são permitidos desde que não haja pedido explícito de voto. A constituição de equipe técnica e administrativa é considerada ato preparatório legítimo. Pedido de registro até 15/08 do ano eleitoral (art. 11).'
  WHERE campanha_id = v_camp AND titulo ILIKE 'REUNI%FUNDA%';

  UPDATE public.campanha_tarefas SET
    fase_legal = 'pre_campanha_legal', permitido_antes_registro = true,
    responsavel_papel = 'Coordenador de Marketing Digital',
    o_que_e = 'Auditoria completa da presença digital atual do pré-candidato.',
    o_que_faz = 'Avalia métricas, sentimento, gaps de conteúdo e benchmark com pares. Base para o plano editorial.',
    entregaveis = E'• Relatório PDF com score atual\n• Lista de 10 ações prioritárias\n• Calendário editorial dos 30 primeiros dias',
    respaldo_legal = 'Lei 9.504/97, art. 36-A, §2º: a manutenção e atualização de perfis em redes sociais é livre na pré-campanha. VEDADO impulsionamento pago de conteúdo eleitoral antes do registro (art. 57-C).'
  WHERE campanha_id = v_camp AND titulo ILIKE '%redes sociais%';

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'pre_campanha_legal', permitido_antes_registro = true,
    responsavel_papel = 'Jurídico Eleitoral + Tesoureiro',
    o_que_e = 'Formalização contratual da equipe pré-eleitoral via prestação de serviços PJ ou CLT.',
    o_que_faz = 'Garante respaldo trabalhista e prova de execução para futura prestação de contas eleitoral. Pagamentos antes do registro saem do patrimônio pessoal do pré-candidato.',
    entregaveis = E'• Contratos assinados\n• Cópias arquivadas neste card\n• Cadastro no eSocial/RFB\n• Modelo de recibo de quitação mensal',
    respaldo_legal = 'Lei 9.504/97, art. 22 + Resolução TSE 23.607/2019: gastos pré-eleitorais devem ser comprovados e podem ser reembolsados pela campanha após o registro, desde que documentados.'
  WHERE campanha_id = v_camp AND titulo ILIKE '%ASSINATURA%CONTRATOS%';

  UPDATE public.campanha_tarefas SET
    titulo = 'Definir conta PESSOAL do pré-candidato para gastos pré-eleitorais',
    fase_legal = 'pre_campanha_legal', permitido_antes_registro = true, is_marco = true,
    responsavel_papel = 'Pré-candidato + Tesoureiro',
    o_que_e = 'Antes do registro de candidatura no TSE NÃO existe conta de campanha nem CNPJ eleitoral. Todo gasto pré-eleitoral sai do patrimônio pessoal do pré-candidato.',
    o_que_faz = 'Define a conta bancária pessoal dedicada aos gastos pré-eleitorais (separada das despesas pessoais para facilitar a futura prestação de contas e o eventual reembolso).',
    entregaveis = E'• Conta pessoal isolada para uso pré-eleitoral\n• Planilha de controle de gastos\n• Guarda de TODOS os comprovantes (NF, recibos)\n• Política interna: nenhum recurso de terceiros entra antes do registro',
    respaldo_legal = 'Lei 9.504/97, art. 22-A: o CNPJ eleitoral só é obtido APÓS o requerimento de registro. Antes disso é VEDADO arrecadar recursos eleitorais (art. 23). Gastos com recursos próprios são permitidos e podem ser declarados/ressarcidos depois (Resolução TSE 23.607/2019, art. 36).'
  WHERE campanha_id = v_camp AND (titulo ILIKE '%conta bancária%campanha%' OR titulo ILIKE '%abrir conta%');

  UPDATE public.campanha_tarefas SET
    titulo = 'Mapear potenciais doadores (sem solicitar contribuição)',
    fase_legal = 'pre_campanha_legal', permitido_antes_registro = true,
    responsavel_papel = 'Coordenador Geral + Tesoureiro',
    o_que_e = 'Construção da matriz de potenciais doadores que serão contatados APÓS o registro oficial.',
    o_que_faz = 'Lista nominal com perfil, capacidade de doação estimada e relação com o pré-candidato. SEM pedido de doação nessa fase — apenas inteligência.',
    entregaveis = E'• Planilha confidencial com 50+ contatos\n• Plano de abordagem para uso pós-registro\n• Limites legais por doador documentados',
    respaldo_legal = 'Lei 9.504/97, art. 23: arrecadação só pode ocorrer APÓS o registro e abertura da conta eleitoral. Pessoa física: até 10% dos rendimentos brutos do ano anterior. VEDADAS doações de PJ (ADI 4650/STF).'
  WHERE campanha_id = v_camp AND titulo ILIKE '%doadores prioritários%';

  UPDATE public.campanha_tarefas SET
    titulo = 'Reuniões institucionais com lideranças (sem pedido de voto/recurso)',
    fase_legal = 'pre_campanha_legal', permitido_antes_registro = true,
    responsavel_papel = 'Pré-candidato + Coordenador Geral',
    o_que_e = 'Encontros para apresentar trajetória e ouvir demandas. Sem pedir voto, sem pedir doação.',
    o_que_faz = 'Constrói relacionamento institucional para mobilização posterior.',
    entregaveis = E'• Lista de reuniões realizadas\n• Resumo executivo de cada encontro\n• Cadastro CRM atualizado',
    respaldo_legal = 'Lei 9.504/97, art. 36-A, IV: encontros, seminários e congressos com finalidade política são permitidos. VEDADO pedir voto explícito (art. 36) e captar recursos (art. 23) antes do registro.'
  WHERE campanha_id = v_camp AND titulo ILIKE '%1:1 com 10 doadores%';

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'campanha_oficial', permitido_antes_registro = false,
    responsavel_papel = 'Jurídico Eleitoral',
    o_que_e = 'Marco legal que separa a pré-campanha da campanha oficial.',
    o_que_faz = 'A partir desta data: pode pedir voto, captar recursos, abrir CNPJ eleitoral, abrir conta bancária de campanha, fazer propaganda eleitoral.',
    entregaveis = E'• Pedido de registro protocolado no TSE/TRE\n• CNPJ eleitoral emitido\n• Conta bancária eleitoral aberta\n• Recibos eleitorais habilitados',
    respaldo_legal = 'Lei 9.504/97, art. 11: pedido de registro até 15 de agosto. Resolução TSE 23.609/2019. CNPJ eleitoral via art. 22-A.'
  WHERE campanha_id = v_camp AND titulo ILIKE 'TSE: Registro%';

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'campanha_oficial', permitido_antes_registro = false,
    o_que_e = 'Início legal da propaganda eleitoral (16 de agosto do ano eleitoral).',
    respaldo_legal = 'Lei 9.504/97, art. 36: a propaganda eleitoral somente é permitida após 16 de agosto. Antes disso configura propaganda antecipada (art. 36, §3º).'
  WHERE campanha_id = v_camp AND titulo ILIKE 'TSE: Início da propaganda%';

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'campanha_oficial', permitido_antes_registro = false,
    o_que_e = 'Horário Gratuito de Propaganda Eleitoral em rádio e TV.',
    respaldo_legal = 'Lei 9.504/97, arts. 47-57. Resolução TSE 23.610/2019.'
  WHERE campanha_id = v_camp AND titulo ILIKE 'TSE: Início HGPE%';

  UPDATE public.campanha_tarefas SET
    is_marco = true, fase_legal = 'campanha_oficial', permitido_antes_registro = false,
    o_que_e = 'Prestação de contas parcial obrigatória.',
    respaldo_legal = 'Lei 9.504/97, art. 28, §4º: prestação parcial entre 9 e 13 de setembro. Resolução TSE 23.607/2019.'
  WHERE campanha_id = v_camp AND titulo ILIKE 'TSE: Prestação%';

  UPDATE public.campanha_tarefas t SET fase_legal = 'campanha_oficial', permitido_antes_registro = false
  FROM public.campanhas c
  WHERE t.campanha_id = c.id AND c.id = v_camp
    AND t.data_prevista >= (c.data_eleicao - INTERVAL '50 days')
    AND t.fase_legal = 'pre_campanha_legal';
END $$;