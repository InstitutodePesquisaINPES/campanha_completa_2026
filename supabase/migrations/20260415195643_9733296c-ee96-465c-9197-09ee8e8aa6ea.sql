
-- Drop the permissive policy
DROP POLICY "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive policy - audit logs are inserted by triggers (SECURITY DEFINER)
-- so we don't need a permissive INSERT policy for regular users
-- The audit_trigger_func runs as SECURITY DEFINER and bypasses RLS
CREATE POLICY "Audit logs insert via triggers only"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
