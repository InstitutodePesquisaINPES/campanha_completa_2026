
-- FASE 5: Comunicação 360 + War Room

CREATE TYPE public.pauta_status AS ENUM ('ideia','aprovada','em_producao','agendada','publicada','cancelada');
CREATE TYPE public.pauta_canal AS ENUM ('instagram','facebook','tiktok','youtube','whatsapp','site','imprensa','radio','tv','outdoor','outros');
CREATE TYPE public.peca_status AS ENUM ('rascunho','em_revisao','aprovacao_juridica','aprovada','reprovada','publicada');
CREATE TYPE public.peca_tipo AS ENUM ('post','video','reels','story','jingle','santinho','adesivo','outdoor','release','spot','outros');
CREATE TYPE public.mencao_canal AS ENUM ('instagram','facebook','twitter','tiktok','youtube','whatsapp','imprensa','blog','grupo','outros');
CREATE TYPE public.mencao_sentimento AS ENUM ('positivo','neutro','negativo','crise');
CREATE TYPE public.mencao_status AS ENUM ('novo','em_analise','respondido','escalado','arquivado');

-- Pautas (calendário editorial)
CREATE TABLE public.comunicacao_pautas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  canal public.pauta_canal NOT NULL DEFAULT 'instagram',
  status public.pauta_status NOT NULL DEFAULT 'ideia',
  data_publicacao timestamptz,
  responsavel_id uuid,
  tags text[] DEFAULT '{}',
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Peças (biblioteca de ativos com aprovação)
CREATE TABLE public.comunicacao_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pauta_id uuid REFERENCES public.comunicacao_pautas(id) ON DELETE SET NULL,
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo public.peca_tipo NOT NULL DEFAULT 'post',
  status public.peca_status NOT NULL DEFAULT 'rascunho',
  arquivo_url text,
  thumbnail_url text,
  texto_legenda text,
  aprovador_id uuid,
  aprovado_em timestamptz,
  observacoes_juridicas text,
  versao integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Menções / War Room
CREATE TABLE public.comunicacao_mencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  canal public.mencao_canal NOT NULL DEFAULT 'instagram',
  autor text,
  url text,
  conteudo text NOT NULL,
  sentimento public.mencao_sentimento NOT NULL DEFAULT 'neutro',
  status public.mencao_status NOT NULL DEFAULT 'novo',
  alcance_estimado integer,
  resposta text,
  respondido_por uuid,
  respondido_em timestamptz,
  data_mencao timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pautas_data ON public.comunicacao_pautas(data_publicacao DESC NULLS LAST);
CREATE INDEX idx_pautas_status ON public.comunicacao_pautas(status);
CREATE INDEX idx_pecas_status ON public.comunicacao_pecas(status);
CREATE INDEX idx_mencoes_data ON public.comunicacao_mencoes(data_mencao DESC);
CREATE INDEX idx_mencoes_sentimento ON public.comunicacao_mencoes(sentimento, status);

-- Triggers updated_at
CREATE TRIGGER trg_pautas_updated BEFORE UPDATE ON public.comunicacao_pautas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pecas_updated BEFORE UPDATE ON public.comunicacao_pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mencoes_updated BEFORE UPDATE ON public.comunicacao_mencoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.comunicacao_pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicacao_mencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view pautas" ON public.comunicacao_pautas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert pautas" ON public.comunicacao_pautas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update pautas" ON public.comunicacao_pautas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete pautas" ON public.comunicacao_pautas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE POLICY "Auth view pecas" ON public.comunicacao_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert pecas" ON public.comunicacao_pecas FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update pecas" ON public.comunicacao_pecas FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete pecas" ON public.comunicacao_pecas FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

CREATE POLICY "Auth view mencoes" ON public.comunicacao_mencoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage insert mencoes" ON public.comunicacao_mencoes FOR INSERT TO authenticated WITH CHECK (has_manage_role(auth.uid()));
CREATE POLICY "Manage update mencoes" ON public.comunicacao_mencoes FOR UPDATE TO authenticated USING (has_manage_role(auth.uid()));
CREATE POLICY "Manage delete mencoes" ON public.comunicacao_mencoes FOR DELETE TO authenticated USING (has_manage_role(auth.uid()));

-- View resumo war room (KPIs)
CREATE OR REPLACE VIEW public.v_warroom_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'novo') AS mencoes_novas,
  COUNT(*) FILTER (WHERE sentimento = 'crise' AND status NOT IN ('arquivado','respondido')) AS crises_ativas,
  COUNT(*) FILTER (WHERE sentimento = 'negativo' AND data_mencao > now() - interval '24 hours') AS negativas_24h,
  COUNT(*) FILTER (WHERE sentimento = 'positivo' AND data_mencao > now() - interval '24 hours') AS positivas_24h,
  COUNT(*) FILTER (WHERE data_mencao > now() - interval '7 days') AS total_7d
FROM public.comunicacao_mencoes;

GRANT SELECT ON public.v_warroom_kpis TO authenticated;
