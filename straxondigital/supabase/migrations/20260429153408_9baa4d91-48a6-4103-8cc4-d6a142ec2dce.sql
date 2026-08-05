
-- Fix search_path on touch fn + handle_new_user (already set), restrict execute on helpers
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Replace overly-permissive lead insert policy
DROP POLICY "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anonymous visitors submit leads" ON public.leads
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users submit leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);
