DROP POLICY IF EXISTS property_verifications_submit ON public.property_verifications;

CREATE POLICY property_verifications_submit
ON public.property_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_verifications.property_id
      AND p.owner_id = (SELECT auth.uid())
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS property_verifications_one_pending_per_property
ON public.property_verifications (property_id)
WHERE status = 'pending';
