-- Public property reads evaluate properties_read_approved for the anon role.
-- The policy calls is_main_admin(); for an unauthenticated caller auth.uid()
-- is NULL, so the function safely returns false.
GRANT EXECUTE ON FUNCTION public.is_main_admin() TO anon;
