
-- =============================================
-- ETAPA 1: FUNDAÇÃO DO SIGT
-- =============================================

-- 1. Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Tabela profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordenador', 'lideranca', 'operador', 'visualizador');

-- 5. Tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Função has_role (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 7. RLS policies para profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS policies para user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Tabela audit_logs (LGPD)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'export', 'login', 'logout')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for performance on audit queries
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 10. Função trigger genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id::TEXT, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Aplicar trigger de auditoria nas tabelas
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 12. Tabela system_settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE POLICY "Authenticated users can view settings"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert settings"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings"
  ON public.system_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. Inserir configurações padrão do sistema
INSERT INTO public.system_settings (key, value, description) VALUES
  ('eleicao_tipo', '"municipal"', 'Tipo da eleição: municipal, estadual, federal'),
  ('eleicao_ano', '2026', 'Ano da eleição'),
  ('eleicao_turno', '1', 'Turno atual: 1 ou 2'),
  ('eleicao_uf', '"SP"', 'UF da eleição'),
  ('sistema_nome', '"SIGT"', 'Nome do sistema'),
  ('sistema_versao', '"1.0.0"', 'Versão do sistema');
