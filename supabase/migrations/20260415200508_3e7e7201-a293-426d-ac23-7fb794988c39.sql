
-- 1. Fix profiles: restrict full data to own profile, create safe public view
DROP POLICY "Authenticated users can view all profiles" ON public.profiles;

-- Users can only see their own full profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can see all profiles (needed for admin panel)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public view with safe fields only (for displaying names in lists)
CREATE VIEW public.profiles_public AS
  SELECT id, user_id, full_name, avatar_url
  FROM public.profiles;

-- 2. Prevent self-role-assignment: admin cannot assign roles to themselves
CREATE POLICY "Cannot self-assign roles"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() != user_id);
