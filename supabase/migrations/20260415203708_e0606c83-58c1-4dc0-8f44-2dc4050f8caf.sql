
-- ============================================
-- ETAPA 5: CAMPO, MATERIAIS E FINANCEIRO
-- ============================================

-- ENUMS
CREATE TYPE public.status_roteiro AS ENUM ('planejado','em_campo','concluido','cancelado');
CREATE TYPE public.tipo_parada AS ENUM ('visita','entrega','coleta');
CREATE TYPE public.tipo_material AS ENUM ('grafico','brinde','camiseta','adesivo','banner','santinho','outros');
CREATE TYPE public.tipo_movimentacao AS ENUM ('entrada','saida','transferencia','perda');
CREATE TYPE public.categoria_despesa AS ENUM ('pessoal','material','transporte','alimentacao','comunicacao','evento','juridico','outros');
CREATE TYPE public.status_despesa AS ENUM ('pendente','aprovada','paga','cancelada');
CREATE TYPE public.tipo_receita AS ENUM ('doacao','fundo_partidario','recursos_proprios','outros');

-- ============================================
-- ROTEIROS DE VISITA
-- ============================================
CREATE TABLE public.roteiros_visita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data date NOT NULL,
  responsavel_id uuid,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  status status_roteiro NOT NULL DEFAULT 'planejado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiros_visita ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view roteiros" ON public.roteiros_visita FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert roteiros" ON public.roteiros_visita FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update roteiros" ON public.roteiros_visita FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete roteiros" ON public.roteiros_visita FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_roteiros_updated_at BEFORE UPDATE ON public.roteiros_visita FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_roteiros AFTER INSERT OR UPDATE OR DELETE ON public.roteiros_visita FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- ROTEIROS PARADAS
-- ============================================
CREATE TABLE public.roteiros_paradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id uuid NOT NULL REFERENCES public.roteiros_visita(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  endereco text,
  latitude double precision,
  longitude double precision,
  tipo tipo_parada NOT NULL DEFAULT 'visita',
  concluido boolean NOT NULL DEFAULT false,
  hora_chegada timestamptz,
  hora_saida timestamptz,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiros_paradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view paradas" ON public.roteiros_paradas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert paradas" ON public.roteiros_paradas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update paradas" ON public.roteiros_paradas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete paradas" ON public.roteiros_paradas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER audit_paradas AFTER INSERT OR UPDATE OR DELETE ON public.roteiros_paradas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- MATERIAIS
-- ============================================
CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo tipo_material NOT NULL DEFAULT 'outros',
  descricao text,
  custo_unitario numeric(12,2),
  foto_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update materiais" ON public.materiais FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete materiais" ON public.materiais FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_materiais AFTER INSERT OR UPDATE OR DELETE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- ESTOQUES
-- ============================================
CREATE TABLE public.estoques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  centro_distribuicao text NOT NULL DEFAULT 'Principal',
  quantidade_atual integer NOT NULL DEFAULT 0,
  quantidade_minima integer NOT NULL DEFAULT 0,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estoques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view estoques" ON public.estoques FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert estoques" ON public.estoques FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update estoques" ON public.estoques FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete estoques" ON public.estoques FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_estoques_updated_at BEFORE UPDATE ON public.estoques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_estoques AFTER INSERT OR UPDATE OR DELETE ON public.estoques FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- MOVIMENTAÇÕES ESTOQUE
-- ============================================
CREATE TABLE public.movimentacoes_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estoque_id uuid NOT NULL REFERENCES public.estoques(id) ON DELETE CASCADE,
  tipo tipo_movimentacao NOT NULL,
  quantidade integer NOT NULL,
  motivo text,
  responsavel_id uuid,
  agenda_id uuid REFERENCES public.agenda(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view movimentacoes" ON public.movimentacoes_estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert movimentacoes" ON public.movimentacoes_estoque FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete movimentacoes" ON public.movimentacoes_estoque FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER audit_movimentacoes AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Trigger para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION public.update_estoque_on_movimentacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.estoques SET quantidade_atual = quantidade_atual + NEW.quantidade WHERE id = NEW.estoque_id;
  ELSIF NEW.tipo IN ('saida', 'perda') THEN
    UPDATE public.estoques SET quantidade_atual = GREATEST(quantidade_atual - NEW.quantidade, 0) WHERE id = NEW.estoque_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER movimentacao_update_estoque AFTER INSERT ON public.movimentacoes_estoque FOR EACH ROW EXECUTE FUNCTION public.update_estoque_on_movimentacao();

-- ============================================
-- CENTROS DE CUSTO
-- ============================================
CREATE TABLE public.centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  orcamento_previsto numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view centros_custo" ON public.centros_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert centros_custo" ON public.centros_custo FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update centros_custo" ON public.centros_custo FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete centros_custo" ON public.centros_custo FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_centros_custo_updated_at BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_centros_custo AFTER INSERT OR UPDATE OR DELETE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- DESPESAS
-- ============================================
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  categoria categoria_despesa NOT NULL DEFAULT 'outros',
  descricao text NOT NULL,
  valor numeric(14,2) NOT NULL,
  data_despesa date NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento date,
  fornecedor_pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  documento_tipo text,
  documento_numero text,
  documento_url text,
  status status_despesa NOT NULL DEFAULT 'pendente',
  responsavel_id uuid,
  aprovador_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view despesas" ON public.despesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert despesas" ON public.despesas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update despesas" ON public.despesas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete despesas" ON public.despesas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_despesas_updated_at BEFORE UPDATE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_despesas AFTER INSERT OR UPDATE OR DELETE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- RECEITAS
-- ============================================
CREATE TABLE public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  tipo tipo_receita NOT NULL DEFAULT 'outros',
  valor numeric(14,2) NOT NULL,
  origem_pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE SET NULL,
  documento_url text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view receitas" ON public.receitas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert receitas" ON public.receitas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Managers can update receitas" ON public.receitas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Managers can delete receitas" ON public.receitas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));
CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON public.receitas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_receitas AFTER INSERT OR UPDATE OR DELETE ON public.receitas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- INDEXES
CREATE INDEX idx_roteiros_data ON public.roteiros_visita(data);
CREATE INDEX idx_roteiros_status ON public.roteiros_visita(status);
CREATE INDEX idx_estoques_material ON public.estoques(material_id);
CREATE INDEX idx_movimentacoes_estoque ON public.movimentacoes_estoque(estoque_id);
CREATE INDEX idx_despesas_centro ON public.despesas(centro_custo_id);
CREATE INDEX idx_despesas_status ON public.despesas(status);
CREATE INDEX idx_despesas_data ON public.despesas(data_despesa);
CREATE INDEX idx_receitas_centro ON public.receitas(centro_custo_id);
CREATE INDEX idx_receitas_data ON public.receitas(data);
