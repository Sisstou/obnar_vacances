# Storage Cleanup — Report-Only Implementation

**Status:** Deployed and manually verified in the staging project; not scheduled.  
**Deletion:** Not implemented. This function contains no Storage remove call.

## Fixed behavior

- Scans only the private `property-images` bucket.
- Supports only object keys in the exact layout `<owner-uuid>/<property-uuid>/<filename>`.
- Reads all non-null `property_images.storage_path` references using paginated queries.
- Uses a 30-day minimum age.
- Returns at most 20 candidate keys to an authenticated server-side caller.
- Refuses incomplete scans, reference-query failures, and configured scan-limit overflows.
- Enforces a hard total limit of 500 Storage directories and 2,000 Storage list requests per run; exceeding either limit aborts the report.
- Includes directory and list-request totals in the successful report and aggregate server log.
- Does not accept bucket names, paths, retention periods, or batch sizes from the request.
- Does not write object keys, signed URLs, or credentials to logs.
- Contains no delete, upload, database update, cron, or audit-table operation.

## Invocation security

The function uses the current Supabase server-side authentication pattern:

- `supabase/config.toml` disables the gateway JWT check for this function only.
- `withSupabase({ auth: "secret:storage_cleanup" })` requires a separately named Supabase secret API key called `storage_cleanup` on the `apikey` header.
- A second server-side secret, `STORAGE_CLEANUP_INVOKE_SECRET`, is required in the `x-cleanup-secret` header.
- The handler uses only `context.supabaseAdmin`; it does not read or expose a service-role key itself.

Both credentials must be held by a trusted server-side caller only. Never place them in the mobile app, website, repository, or client-visible environment variables.

The required named API key and Edge Function invocation secret were configured by the project owner and used for a successful manual invocation. Their values are not stored in this repository. The function is not scheduled. No Vault secret or pg_cron job was created.

## Report interpretation

A successful HTTP 200 means the full bounded scan and reference read completed. It does not authorize deletion. Review the returned candidates manually. If the scan exceeds its hard limits or any query/list operation fails, the function returns a non-200 response and no candidate report.

Only the authenticated caller receives object keys. Server logs contain aggregate counts and a run identifier, not keys.

## Deployment and verification

- Supabase staging project: `obnar-vacances-staging` (`rhxeclddohpwtpzkruzm`).
- Function: `storage-cleanup-dry-run`; deployed status `ACTIVE`, version 2.
- Gateway JWT verification is disabled for this function only; invocation is protected by the named `storage_cleanup` API key and the separate `STORAGE_CLEANUP_INVOKE_SECRET` header check.
- A manual POST invocation returned HTTP 200 on 2026-11-24.
- Verified report: `mode: dry-run`, `deletion_enabled: false`, bucket `property-images`, 30-day grace period, 4 objects scanned, 4 directories scanned, 4 Storage list requests, 3 database references, 0 eligible candidates, and no truncated candidates. All 4 objects were skipped because they were recent or referenced. No unsupported paths or invalid timestamps were encountered; duration was 709 ms.
- This invocation performed a read-only scan. It did not delete objects, change database rows, or schedule future runs.

## Remaining controls and future approval

1. Keep the function report-only and unscheduled while more reports are reviewed.
2. Treat each report as a point-in-time result; repeat the bounded scan before making any future cleanup decision.
3. Obtain separate explicit approval before adding any deletion capability, changing retention rules, broadening bucket/path scope, or scheduling invocations. The deployed function currently has no deletion capability.

## References

- Supabase Edge Function authentication: https://supabase.com/docs/guides/functions/auth
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
