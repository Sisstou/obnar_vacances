-- Anonymous visitors may read approved property images and amenities,
-- but must not be able to mutate these tables at the SQL privilege layer.
-- RLS remains enabled and continues to authorize authenticated owners/admins.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.property_images FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.property_amenities FROM anon;
