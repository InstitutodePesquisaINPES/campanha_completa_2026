-- ============================================================
-- FASE 1: Governança, Notificações e Busca Global
-- ============================================================

-- 1) Escopos de usuário (RBAC territorial + por campanha)
CREATE TABLE public.user_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campanha_id uuid REFERENCES public.campanhas(id) ON DELETE CASCADE,
  estado_id uuid REFERENCES public.estados(id) ON DELETE CASCADE,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(user_id, campanha_id, estado_id, municipio_id)
);

CREATE INDEX idx_user_scopes_user ON public.user_scopes(user_id);
CREATE INDEX idx_user_scopes_campanha ON public.user_scopes(campanha_id);
CREATE INDEX idx_user_scopes_municipio ON public.user_scopes(municipio_id);

ALTER TABLE public.user_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view own scopes or admin sees all"
ON public.user_scopes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage scopes"
ON public.user_scopes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Helper functions de escopo
CREATE OR REPLACE FUNCTION public.user_has_municipio_scope(_user_id uuid, _municipio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.user_scopes
    WHERE user_id = _user_id
      AND (municipio_id = _municipio_id OR municipio_id IS NULL)
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_campanha_scope(_user_id uuid, _campanha_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.user_scopes
    WHERE user_id = _user_id
      AND (campanha_id = _campanha_id OR campanha_id IS NULL)
  )
$$;

-- 2) Central de Notificações
CREATE TYPE public.notificacao_tipo AS ENUM (
  'info', 'sucesso', 'aviso', 'erro', 'demanda', 'agenda', 'financeiro', 'tarefa', 'sistema'
);

CREATE TYPE public.notificacao_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');

CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo public.notificacao_tipo NOT NULL DEFAULT 'info',
  prioridade public.notificacao_prioridade NOT NULL DEFAULT 'media',
  titulo text NOT NULL,
  mensagem text,
  link text,
  entidade_tipo text,
  entidade_id uuid,
  lida boolean NOT NULL DEFAULT false,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_notificacoes_user_lida ON public.notificacoes(user_id, lida, created_at DESC);
CREATE INDEX idx_notificacoes_entidade ON public.notificacoes(entidade_tipo, entidade_id);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notificacoes FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notificacoes FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers create notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (has_manage_role(auth.uid()));

CREATE POLICY "Users delete own notifications"
ON public.notificacoes FOR DELETE TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Função utilitária para criar notificação
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  _user_id uuid,
  _titulo text,
  _mensagem text DEFAULT NULL,
  _tipo public.notificacao_tipo DEFAULT 'info',
  _prioridade public.notificacao_prioridade DEFAULT 'media',
  _link text DEFAULT NULL,
  _entidade_tipo text DEFAULT NULL,
  _entidade_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, prioridade, link, entidade_tipo, entidade_id, created_by)
  VALUES (_user_id, _titulo, _mensagem, _tipo, _prioridade, _link, _entidade_tipo, _entidade_id, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Notificar todos os admins/coordenadores
CREATE OR REPLACE FUNCTION public.notificar_gestores(
  _titulo text,
  _mensagem text DEFAULT NULL,
  _tipo public.notificacao_tipo DEFAULT 'info',
  _prioridade public.notificacao_prioridade DEFAULT 'media',
  _link text DEFAULT NULL,
  _entidade_tipo text DEFAULT NULL,
  _entidade_id uuid DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer := 0; r record;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','coordenador')
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, prioridade, link, entidade_tipo, entidade_id, created_by)
    VALUES (r.user_id, _titulo, _mensagem, _tipo, _prioridade, _link, _entidade_tipo, _entidade_id, auth.uid());
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Trigger: notificar gestores quando demanda urgente é aberta
CREATE OR REPLACE FUNCTION public.notificar_demanda_urgente()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.prioridade = 'urgente' THEN
    PERFORM public.notificar_gestores(
      'Demanda urgente: ' || NEW.titulo,
      'Protocolo ' || NEW.protocolo,
      'demanda',
      'urgente',
      '/demandas',
      'demandas',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_demanda_urgente
AFTER INSERT ON public.demandas
FOR EACH ROW EXECUTE FUNCTION public.notificar_demanda_urgente();

-- 3) Busca Global — view consolidada
CREATE OR REPLACE VIEW public.v_busca_global AS
SELECT 'pessoa'::text AS tipo, p.id, p.full_name AS titulo,
       COALESCE(p.cpf, p.cnpj, p.razao_social) AS subtitulo,
       '/pessoas'::text AS link, p.created_at
FROM public.pessoas p
UNION ALL
SELECT 'demanda'::text, d.id, d.titulo, d.protocolo, '/demandas', d.created_at
FROM public.demandas d
UNION ALL
SELECT 'agenda'::text, a.id, a.titulo, a.local, '/agenda', a.created_at
FROM public.agenda a
UNION ALL
SELECT 'municipio'::text, m.id, m.nome, e.sigla, '/territorios', m.created_at
FROM public.municipios m JOIN public.estados e ON e.id = m.estado_id
UNION ALL
SELECT 'campanha'::text, c.id, c.nome, c.cargo::text, '/plano', c.created_at
FROM public.campanhas c
UNION ALL
SELECT 'despesa'::text, dp.id, dp.descricao, 'R$ ' || dp.valor::text, '/financeiro', dp.created_at
FROM public.despesas dp
UNION ALL
SELECT 'material'::text, mt.id, mt.nome, mt.tipo::text, '/materiais', mt.created_at
FROM public.materiais mt;