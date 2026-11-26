-- Bind each property-verification submission to a real private document
-- stored beneath the submitting owner's UID and the exact property ID.
-- Prepared for review only; this migration has NOT been applied to Supabase.

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
  AND array_length(storage.foldername(document_path), 1) = 3
  AND (storage.foldername(document_path))[1] = (SELECT auth.uid())::text
  AND (storage.foldername(document_path))[2] = 'properties'
  AND (storage.foldername(document_path))[3] = property_verifications.property_id::text
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_verifications.property_id
      AND p.owner_id = (SELECT auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM storage.objects o
    WHERE o.bucket_id = 'owner-documents'
      AND o.name = property_verifications.document_path
  )
);

-- Preserve the existing one-pending-request-per-property rule.
CREATE UNIQUE INDEX IF NOT EXISTS property_verifications_one_pending_per_property
ON public.property_verifications (property_id)
WHERE status = 'pending';
