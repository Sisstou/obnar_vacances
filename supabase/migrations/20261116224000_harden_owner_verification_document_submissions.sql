-- Require every owner-verification request to reference an uploaded document
-- in the applicant's own private folder, and prevent duplicate pending requests.
DROP POLICY IF EXISTS owner_verifications_submit ON public.owner_verifications;

CREATE POLICY owner_verifications_submit
ON public.owner_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND (storage.foldername(document_path))[1] = (SELECT auth.uid())::text
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'traveler'
      AND p.requested_account_type = 'owner'
  )
  AND EXISTS (
    SELECT 1
    FROM storage.objects o
    WHERE o.bucket_id = 'owner-documents'
      AND o.name = owner_verifications.document_path
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS owner_verifications_one_pending_per_owner
ON public.owner_verifications (owner_id)
WHERE status = 'pending';
