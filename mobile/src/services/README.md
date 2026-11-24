# Mobile service layer

Services in this folder isolate application workflows from screen components.

## Current services

- `auth.service.ts`: email/password sign-in and sign-up, current-session retrieval,
  sign-out, and auth-state subscription.
- `storage.service.ts`: constrained uploads and short-lived signed URLs for
  private Storage buckets. Uploads always use `upsert: false`.
- `file-lifecycle.ts`: bucket MIME/size/path rules and versioned object path
  generation. It does not delete files or mutate database references.
- `file-lifecycle.service.ts`: composes versioned path generation with upload.
  The caller must update the database reference only through a separately
  authorized workflow.
- All request methods return `AppResult<T>`; callers should inspect `ok` before
  reading `data` or `error`.
- Error normalization is centralized in `src/lib/errors.ts`.

## Storage rules

- Bucket limits are mirrored client-side for early validation; Supabase bucket
  configuration and Storage RLS remain authoritative.
- The current buckets are private. Use signed URLs, not public URLs.
- Payment receipts require exactly two folder levels
  (`traveler_id/booking_id/file`).
- No client-side delete, overwrite, cleanup queue, or database reference update
  is implemented in this phase.
- Versioned uploads preserve old objects; they do not by themselves guarantee
  that a database record points to the new version.
- Never put a Supabase service-role key in the mobile app.

## Boundaries

- This layer does not change the Supabase schema, RLS, Storage policies,
  Edge Functions, Auth dashboard settings, or environment secrets.
- It does not implement guest OTP, property discovery, bookings, payment review,
  owner operations, or admin workflows.
- Do not treat the current staging property catalogue as public inventory.
- Screens are not wired to these services in this phase; integration requires a
  separately coordinated UI change.
- Do not log passwords, access tokens, refresh tokens, or full session objects.
