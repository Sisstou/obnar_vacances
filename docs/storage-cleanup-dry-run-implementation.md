# Storage Cleanup — Report-Only Implementation

**Status:** Source prepared on `mobile-phase-1-services`; not deployed or scheduled.  
**Deletion:** Not implemented. This function contains no Storage remove call.

## Fixed behavior

- Scans only the private `property-images` bucket.
- Supports only object keys in the exact layout `<owner-uuid>/<property-uuid>/<filename>`.
- Reads all non-null `property_images.storage_path` references using paginated queries.
- Uses a 30-day minimum age.
- Returns at most 20 candidate keys to an authenticated server-side caller.
- Refuses incomplete scans, reference-query failures, and configured scan-limit overflows.
- Does not accept bucket names, paths, retention periods, or batch sizes from the request.
- Does not write object keys, signed URLs, or credentials to logs.
- Contains no delete, upload, database update, cron, or audit-table operation.

## Invocation security

The handler requires both:
1. `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, which also satisfies the platform JWT verification when enabled.
2. `x-cleanup-secret: <STORAGE_CLEANUP_INVOKE_SECRET>`.

Both values must be held by a trusted server-side caller only. Never place them in the mobile app, website, repository, or client-visible environment variables. The service-role key must never be returned in the response or logs.

The function is not scheduled. No Vault secret, pg_cron job, Edge Function secret, or hosted setting is created by this source-only change.

## Report interpretation

A successful HTTP 200 means the full bounded scan and reference read completed. It does not authorize deletion. Review the returned candidates manually. If the scan exceeds its hard limits or any query/list operation fails, the function returns a non-200 response and no candidate report.

Only the authenticated caller receives object keys. Server logs contain aggregate counts and a run identifier, not keys.

## Required before any deployment

1. Review this source and its tests.
2. Confirm the deployed project schema and Storage path layout still match the assumptions.
3. Configure secrets and invocation settings through a separately approved change.
4. Deploy in report-only mode and inspect multiple runs.
5. Obtain separate explicit approval before any future deletion implementation. This source does not contain deletion capability.
