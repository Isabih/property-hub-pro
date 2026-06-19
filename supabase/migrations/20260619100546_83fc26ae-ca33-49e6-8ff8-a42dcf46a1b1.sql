
-- Lock down SECURITY DEFINER functions: only callable internally / via RLS evaluation
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- authenticated keeps execute so client can call has_role if needed; safe (read-only)

-- Add explicit deny policy on email_verifications so RLS-enabled-no-policy is silenced
CREATE POLICY "No client access to email verifications"
  ON public.email_verifications FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
