-- Anonymous clients may read explicitly public rows, but all mutations require an authenticated session.
-- RLS remains the row-level authorization boundary for authenticated users.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
