# Storage File Lifecycle — Technical Design

**Status:** Design only — not approved for deployment  
**Project:** OBNAR VACANCES  
**Repository branch:** `mobile-phase-1-services`  
**Prepared:** 2026-11-24

## 1. Purpose and scope

Define a safe server-side lifecycle for Storage objects that become unreferenced after interrupted uploads, replacement uploads, or deletion of their parent database records.

This document does not authorize or perform:
- Storage object deletion or upload.
- Database schema, RLS, grants, bucket, or function changes.
- Edge Function creation or deployment.
- Changes to application screens, `App.tsx`, or test data.
- Branch merges.

The current implementation remains unchanged until a separate, explicit implementation approval is given.

## 2. Current staging snapshot

Read-only inspection of the five private buckets found:

| Bucket | Storage objects | Database references | Unreferenced objects | Missing referenced objects |
|---|---:|---:|---:|---:|
| property-images | 4 | 3 | 1 | 0 |
| owner-documents | 2 | 2 | 0 | 0 |
| business-images | 0 | 0 | 0 | 0 |
| payment-receipts | 0 | 0 | 0 | 0 |
| refund-proofs | 0 | 0 | 0 | 0 |

Additional observations:
- `property_images.storage_path` is the authoritative reference for property image objects.
- `owner_verifications.document_path` and `property_verifications.document_path` are references to owner/property verification documents.
- `bookings.payment_receipt_path` references payment receipts.
- `booking_cancellations.refund_proof_path` references refund proofs.
- `local_business_images.image_url` needs explicit path/URL normalization before it can safely be treated as a Storage object key.
- All five buckets are private, have a 5 MiB limit, and have configured MIME allowlists.
- The one unreferenced property image was created on 2026-11-17 and was approximately 258,621 bytes. It is younger than the proposed 30-day grace period and must not be deleted in an initial run.
- No referenced object was missing in this snapshot.

Counts are a point-in-time staging observation, not a guarantee about later state.

## 3. Lifecycle states

1. **Uploaded:** object exists in Storage; database reference may not yet exist.
2. **Referenced:** an authoritative database row points to the exact bucket and object key.
3. **Candidate:** object has no authoritative reference and is older than the grace period.
4. **Revalidated:** candidate is checked again immediately before deletion.
5. **Deleted:** Storage API confirms deletion.
6. **Failed / deferred:** object remains untouched and the failure is recorded for later review.

A candidate must never be deleted based only on a client-side list, a filename pattern, or a stale scan result.

## 4. Proposed first release

Limit the first release to **property-images only**.

Candidate criteria:
- Exact bucket ID is `property-images`.
- The object key is not referenced by any row in `public.property_images.storage_path`.
- Object creation time is at least 30 days old.
- The key and bucket are within the explicitly supported path policy.
- The object is not already being processed by another cleanup execution.

Before deletion:
- Re-query the authoritative reference table.
- Confirm the object still exists and its creation time still satisfies retention.
- Revalidate the candidate against the current bucket and path allowlist.
- If any query fails, returns an ambiguous result, or detects a reference, skip the object.

Use the Supabase Storage API for object deletion. Do not delete rows directly from `storage.objects`.

## 5. Explicit exclusions

The initial cleanup must not process:

- **owner-documents:** identity/ownership verification material. Retain under the existing verification lifecycle; no automatic deletion.
- **payment-receipts:** financial evidence. No automatic deletion.
- **refund-proofs:** financial/refund evidence. No automatic deletion.
- **business-images:** excluded until `image_url` is confirmed to contain normalized Storage keys and all supported reference formats are mapped.

Any future retention policy for these buckets requires its own data-retention decision and explicit approval. The existence of an unreferenced object is not, by itself, permission to delete it.

## 6. Server-side architecture

Proposed component: a scheduled Supabase Edge Function, running with a narrowly scoped server-side credential.

Security requirements:
- Never expose the service-role key to the mobile app or website.
- Keep credentials in Edge Function secrets only.
- Do not accept arbitrary bucket IDs, object keys, SQL, or delete paths from clients.
- Hard-code the first-release bucket allowlist on the server.
- Use a bounded batch size and execution time.
- Require an authenticated scheduler/cron invocation or a verifiable secret-based invocation.
- Do not provide a public client-callable cleanup endpoint.
- Treat Storage API errors and database errors as fail-closed: do not delete on uncertainty.

A database advisory lock or equivalent single-run guard should prevent overlapping cleanup runs. The exact locking mechanism must be reviewed against the chosen Edge Function runtime before implementation.

## 7. Dry-run and rollout

Recommended rollout:

**Phase A — report only**
- Discover candidates using the criteria above.
- Do not delete anything.
- Emit counts and object keys in protected server logs; avoid logging document contents, signed URLs, credentials, or personal data.
- Manually review the candidate list.

**Phase B — guarded deletion**
- Enable deletion only after the report-only run is reviewed and approved.
- Revalidate each object immediately before deletion.
- Process small batches.
- Record success/failure and continue safely without treating a partial batch as fully successful.

**Phase C — monitoring**
- Review deleted/skipped/failed counts after each run.
- Alert on unexpected spikes, missing references, or repeated failures.
- Keep the schedule conservative until normal upload and replacement behavior is verified.

The 30-day period is a proposed safety threshold, not an existing production policy.

## 8. Audit trail

For the first report-only phase, structured Edge Function logs may be sufficient.

Before enabling deletion, decide whether a durable audit table is required. If so, its schema, access policies, retention, and who may read it must be reviewed and approved separately. This design does not create such a table.

Minimum audit fields:
- run identifier and timestamp;
- bucket ID and object key;
- object creation timestamp and byte size;
- candidate reason;
- reference recheck outcome;
- action: reported, skipped, deleted, or failed;
- Storage API result/error category.

Do not store signed URLs, file contents, service-role credentials, or unnecessary personal data.

## 9. Failure handling and safety invariants

- **Reference appears after scan:** revalidation detects it; skip deletion.
- **Reference query unavailable:** fail closed; delete nothing in that batch.
- **Storage deletion fails:** record failure; do not remove or alter database references.
- **Function times out:** process bounded batches; next run re-evaluates current state.
- **Duplicate execution:** single-run guard prevents overlapping destructive work.
- **Unknown bucket/path/reference format:** skip and report; never guess.
- **Partial batch:** report per-object outcomes; never report full success unless every intended action is confirmed.

Core invariant: cleanup may remove only an old, unreferenced Storage object from an explicitly approved bucket. It must never delete or modify a database business record.

## 10. Required tests before activation

1. Referenced object is never selected.
2. Object younger than 30 days is never selected.
3. Old unreferenced property image is reported in dry-run.
4. A reference added between discovery and revalidation prevents deletion.
5. Database/reference lookup failure prevents deletion.
6. Storage API failure is recorded and does not mutate database rows.
7. Unsupported bucket and path are skipped.
8. Concurrent invocation is rejected or safely serialized.
9. Batch limit and timeout behavior are bounded.
10. Service-role credentials are absent from client bundles and logs.

Tests must use isolated test objects and test records. Existing staging objects and bookings must not be altered.

## 11. Decisions required before implementation

The following require a separate approval:
- Approve the first-release scope: `property-images` only.
- Confirm the 30-day grace period.
- Choose report-only schedule and review period.
- Decide whether a durable audit table is required.
- Approve the exact Edge Function, scheduler/cron, secret handling, and database changes after reviewing their complete source and SQL.
- Approve activation of deletion only after dry-run evidence is reviewed.

**Current decision:** design documented; no cleanup code deployed and no Storage objects deleted.
