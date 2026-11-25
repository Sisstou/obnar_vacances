-- Tighten property verification submissions without changing existing data.
-- This migration is prepared for review only; it has not been applied to Supabase.

DROP POLICY IF EXISTS property_verifications_submit ON public.property_verifications;

CREATE POLICY property_verifications_submit
ON public.property_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND document_path IS NOT NULL
  AND btrim(document_path) <> ''
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_verifications.property_id
      AND p.owner_id = (SELECT auth.uid())
  )
);

-- Preserve the existing one-pending-request-per-property rule.
CREATE UNIQUE INDEX IF NOT EXISTS property_verifications_one_pending_per_property
ON public.property_verifications (property_id)
WHERE status = 'pending';
