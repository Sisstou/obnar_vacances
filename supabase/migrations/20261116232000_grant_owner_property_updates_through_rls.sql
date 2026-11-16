-- Permit authenticated property owners and the main admin to use the
-- existing properties UPDATE RLS policy. RLS and protect_property_status()
-- remain the authorization boundary.
GRANT UPDATE ON TABLE public.properties TO authenticated;
