# OBNAR VACANCES — Guest Booking Edge API Contract

**Status:** implementation contract / not deployed  
**Branch:** `pwa-foundation`  
**Date:** 24 November 2026 (updated with approved retry design)

This document defines the server boundary for guest bookings. It does not authorize a browser to access booking tables or Storage directly. The existing registered-traveler workflow remains unchanged.

## Security invariants

1. The browser never receives a Supabase service-role or secret API key.
2. Guest endpoints use a server-only Supabase credential and narrowly scoped database operations.
3. No guest endpoint grants anonymous `SELECT`, `INSERT`, `UPDATE`, or `DELETE` on `bookings`, cancellation tables, history, or Storage objects.
4. A booking reference is an identifier only. Every guest read or mutation requires both the reference and a 256-bit random secret.
5. The browser generates the 256-bit access secret and retains plaintext only in page memory. The server stores only its SHA-256 digest. Never put plaintext in logs, analytics, URLs, browser storage, or error messages.
6. Use generic failure responses for invalid reference/secret combinations. Apply database-backed atomic throttling before expensive lookups and mutations.
7. All state-changing operations must be transactional and re-check current booking/payment/cancellation state inside Postgres.
8. Existing registered-user RPCs remain authenticated and must not be weakened or reused for guests.
9. Keep the existing no-overlap exclusion constraints and property advisory transaction lock.
10. Guest access expires and can be revoked. Secret possession alone never permits access to unrelated bookings.

## Proposed endpoints

All endpoints accept HTTPS POST with JSON except receipt upload, which accepts multipart form data. Exact route names are provisional until the database RPC signatures are implemented.

### 1. Create guest booking

**Input**
- `property_id`: UUID
- `check_in`, `check_out`: ISO date strings
- `guests`: positive integer
- `guest_name`: bounded plain text
- `guest_phone`: normalized Algerian/international phone string

**Server responsibilities**
- Enforce body size, type, length and date bounds.
- Apply rate limiting using trusted server-side request context and a keyed digest of normalized contact data; do not trust client-supplied IP headers.
- Recalculate availability, approval state, capacity, owner, price and commission in Postgres.
- Reject owner self-booking and overlapping active bookings.
- Preserve property advisory locking and the exclusion constraint.
- Before the first request, the browser generates a 32-byte access secret and a separate high-entropy idempotency key using Web Crypto; it keeps the plaintext secret only in page memory.
- The browser sends the secret digest and idempotency key over HTTPS POST. The idempotency key may be kept in sessionStorage for same-tab retry continuity, but is never accepted as booking authentication.
- Create the booking, opaque reference, secret digest and idempotency record in one database transaction.
- Bind the idempotency record to a canonical fingerprint of the normalized booking request and secret digest. Same key + same fingerprint returns the same reference without creating another booking; same key + different fingerprint is rejected.
- Return the booking reference once the transaction commits. The browser already holds the access secret in page memory. Do not return internal IDs or privileged data.
- If the response is lost, retry using the same idempotency key and same payload. If the page reloads/closes and the secret is lost, do not reconstruct it or store an encrypted copy; use the separately approved administrator-assisted reissue process.

**Response**
- `booking_reference`
- `access_secret`
- minimal confirmation fields only

### 2. Read guest booking / submit cancellation request

**Input**
- `booking_reference`
- `access_secret`
- optional cancellation category and reason when requesting cancellation

**Server responsibilities**
- Validate token syntax before database work.
- Apply rate limiting, resolve reference and compare secret hash without revealing which field failed.
- Return only guest-safe booking status, dates, guest count, payment state and cancellation progress.
- Reproduce the existing five-day rule, urgent material-mismatch escalation and 48-hour owner review.
- A pending cancellation request leaves the booking active and dates blocked.
- Owner silence after 48 hours escalates to admin review; it is not approval or rejection.
- An owner-approved exceptional cancellation does not automatically grant a full refund. Refund eligibility remains a separate main-admin decision.
- Do not return owner private contact data, internal notes, admin data, or other travelers' information.

### 3. Upload guest payment receipt

**Input**
- multipart: `booking_reference`, `access_secret`, `file`

**Server responsibilities**
- Enforce size limit (5 MiB) and allowlist JPEG, PNG, WebP and PDF; validate file signature as well as MIME metadata.
- Verify the guest credential and current booking/payment state server-side.
- Upload to the existing private `payment-receipts` bucket using a server-only credential and a non-user-controlled object path.
- Attach the object path to the matching booking in the same controlled workflow; do not let the browser choose another booking ID or Storage path.
- Preserve owner/admin-only receipt access and current payment review logic.
- Never provide guest direct Storage read access or a permanent public URL.

## Staging schema audit — findings and required design

Read-only inspection of staging project `rhxeclddohpwtpzkruzm` confirmed the following current-state constraints. These are findings, not changes.

- `bookings.traveler_id` is NOT NULL and references `profiles(id)`; guest rows cannot be inserted as-is.
- `booking_cancellations.requester_id` is NOT NULL and references `auth.users(id)`; `requester_role` currently permits only `traveler` and `owner`.
- `booking_cancellation_history.actor_id` is nullable, but `actor_role` currently permits only `traveler`, `owner`, `admin`, and `system`.
- `notifications.user_id` is NOT NULL. The existing `notify_new_booking()` trigger inserts a traveler notification unconditionally using `NEW.traveler_id`; a guest booking with a null traveler would fail unless this trigger is changed to skip the traveler notification while preserving owner/admin notifications.
- The existing `booking_cancellations_booking_id_key` enforces one cancellation row per booking. Preserve this single-request lifecycle in the first guest release; a rejected request does not create a second cancellation row.
- Existing active-booking exclusion constraints and `create_booking()` property advisory locking must remain in force.
- Existing `submit_payment_receipt()` requires an authenticated traveler and a Storage path beginning with that traveler's auth UID. It must not be loosened for guests. Guest receipt uploads need a separate server-only path and narrowly scoped attachment routine.
- Existing SECURITY DEFINER routines have explicit role grants in several cases. New guest database routines must not be placed in the exposed `public` schema as broadly executable SECURITY DEFINER functions.

### Required schema shape (design only; not applied)

1. Permit `bookings.traveler_id` to be NULL while retaining its FK. Add nullable guest identity fields (`guest_name`, `guest_phone`), a unique opaque `booking_reference`, `guest_access_secret_hash`, `guest_access_expires_at`, and `guest_access_revoked_at`.
2. Add a check constraint enforcing exactly one booking identity mode: either a registered traveler (`traveler_id` set and guest identity absent) or a guest (traveler ID absent and required guest name/phone/reference/hash present). Test bookings and existing rows must remain valid.
3. Make `booking_cancellations.requester_id` nullable and add `guest` to its requester-role check. A guest cancellation must be created only through the authorized server routine; no guest table policy is added.
4. Add `guest` to the cancellation-history actor-role check. Guest history rows use a NULL `actor_id` and a safe guest actor role; never put the guest's phone or secret in history.
5. Update `notify_new_booking()` so the traveler notification is inserted only when `NEW.traveler_id` is not NULL. Owner and main-admin notifications continue for guest bookings.
6. Keep guest contact fields out of public views and traveler-facing registered-user queries. Only the assigned owner and main admin may see guest contact data in their authorized interfaces. Do not add guest contact data to exports in this phase.
7. Do not add guest access to `storage.objects` policies. A server-only Edge Function uploads to the existing private bucket and calls a private attachment routine after authorization and validation.

The booking identity check, reference uniqueness, cancellation FK/role changes, notification trigger behavior, and all relevant views/RPC grants must be reviewed together in one migration. Do not relax RLS or expose raw guest columns through the Data API.

## Approved lost-response and recovery behavior — 24 November 2026

Option A is approved as the design direction. The client generates the guest access secret; the server stores only its digest. A separate idempotency key prevents duplicate creation for a repeated identical request and is not itself a guest authentication factor. Do not implement encrypted secret escrow. A same-key retry must be transactionally idempotent and must reject a different canonical request fingerprint.

If the guest loses the in-memory secret after a reload or tab close, recovery requires an administrator-assisted reissue after a strong verification procedure. Booking reference, phone, name, property or dates alone are not sufficient proof. The verification evidence, administrator permissions, idempotency expiry, canonical fingerprint fields, duplicate-submission behavior and reissue audit contract remain to be specified before implementation.

## Database RPC contract required before handlers are completed

The Edge Functions must call purpose-built, tightly scoped database routines (names are placeholders, not existing functions):

- `guest_create_booking(...)`: validates and creates booking + reference + secret hash + expiry atomically.
- `guest_authorize_access(reference, secret_hash, action)`: performs throttling and authorization without returning sensitive rows.
- `guest_get_booking_status(...)`: returns a minimal guest-safe projection after authorization.
- `guest_request_booking_cancellation(...)`: applies the existing cancellation state machine for a guest.
- `guest_attach_payment_receipt(...)`: binds a server-uploaded private object to the authorized booking.
- `guest_rate_limit_check(...)`: atomic database-backed throttling with bounded retention.

These routines must live outside the exposed `public` API schema where practical, have explicit grants only to the required server role, pin `search_path`, validate all inputs, and avoid broad SECURITY DEFINER exposure. The exact role/grant model must be verified against the project's Supabase configuration before writing SQL.

## Source code added in this phase

- `supabase/functions/_shared/guest-security.ts`: cryptographic secret generation, format validation, SHA-256 hashing and hash comparison.
- `supabase/functions/_shared/guest-security_test.ts`: Deno tests for the shared primitives.

These are shared primitives only. No HTTP endpoint is functional until the database contract above exists and has been tested. No migration, function deployment, secrets change, Storage policy change, or production change has been made.

## Required tests before staging

- Secret generation entropy/format, hashing, malformed input rejection.
- No plaintext secret in DB, logs, URL, browser storage, analytics or error payload.
- Unknown reference, wrong secret, expired secret, revoked secret and repeated attempts all return generic failures.
- Throttling is atomic under concurrent requests and cannot be reset by changing client-supplied headers.
- Guest creation enforces property approval, dates, capacity, price, owner self-booking and overlapping-booking constraints.
- Concurrent requests for the same property/date cannot create overlapping active bookings.
- Registered-user booking, traveler dashboard, payment upload, cancellation and notifications continue to pass regression tests.
- Guest cancellation preserves the five-day rule, urgent mismatch escalation, owner 48-hour deadline, admin escalation and separate refund review.
- Receipt upload validates actual file type and size; owner/main admin can access the receipt while unrelated users and guests cannot.
- Guest endpoints cannot read or mutate another booking by reference alone.
- Admin and owner screens display guest contact only to authorized parties; exports require an explicit personal-data decision.

## Implementation gate

Do not create or apply a database migration until all dependent routine definitions, triggers, RLS policies, Storage policies, role grants and frontend queries have been reviewed together. Use the Supabase CLI to generate the migration filename; do not hand-create a migration file. Apply to staging only after explicit user approval. Production requires separate approval.


## Additional staging audit requirements — 23 November 2026

The follow-up read-only routine review identified implementation requirements that every Edge Function/database migration must satisfy:

- Guest booking creation must not create a `notifications` row for the guest. The current table requires a non-NULL `user_id`; owner and main-admin notifications must still be generated.
- Guest cancellation creation must route notifications to the assigned property owner and main admin. The current cancellation trigger routes the owner only for `requester_role = 'traveler'`; the guest branch must be explicit.
- Owner response to a guest cancellation must be supported by the server-side state machine. The current `owner_respond_to_cancellation()` routine accepts only `requester_role = 'traveler'`; update its authorization/state branch for `guest` without accepting a caller-supplied owner identity.
- If the owner approves an exceptional guest cancellation, the booking cancellation and the separate main-admin refund review must follow the existing policy. The current admin refund-review continuation branch accepts only `traveler` and `owner`; it must also accept `guest`.
- Skip NULL traveler notification inserts in `notify_new_booking()`, `respond_to_booking()`, `admin_review_owner_booking()`, and `admin_review_payment_receipt()`. Keep owner/admin notifications and all existing role checks. Do not solve these failures by making `notifications.user_id` nullable.
- `admin_review_booking_cancellation()` and `admin_review_refund_execution()` already filter NULL notification recipients; preserve that behavior.
- Guest status polling must be the only way the guest receives booking/cancellation/payment status. Do not issue a guest notification row, email/SMS assumption, or public booking lookup.

The owner dashboard may show guest name/phone only for bookings belonging to that owner, after the database authorization boundary is verified. The current owner export intentionally excludes traveler/guest contact details and must continue to do so in the first release. The main-admin interface can show guest contact fields only through its authorized projection; do not expose the secret hash or access secret.

The current frontend has no guest UI: registered booking, cancellation, and receipt flows still call the existing authenticated RPCs. Keep those flows unchanged and add guest UI only after the Edge Functions, private database routines, and guest state-machine tests are deployed and verified.

These requirements are design guidance only. No database migration or Edge Function is deployed.


## Storage authorization finding — 24 November 2026

The existing private `payment-receipts` bucket is configured for 5 MiB and JPEG/PNG/WebP/PDF. The current registered-traveler upload policy requires the object path to begin with the authenticated traveler UID. The current participant-read policy also checks that path segment against `bookings.traveler_id`; therefore it cannot authorize owner/admin reads for guest receipts where `traveler_id` is NULL.

For guest uploads, the Edge Function must generate a distinct object path such as `guest/<booking_id>/<random-object-id>.<validated-extension>`, after validating the reference+secret and the booking's payment state. Do not accept a caller-supplied object path. Keep the bucket private and the existing registered-user upload policy unchanged.

Before enabling guest receipt uploads, implement and test exactly one owner/admin read path:
- a separate Storage SELECT policy that matches the guest path to the booking, requires `traveler_id IS NULL`, and authorizes only the assigned property owner or main admin; or
- a server endpoint that checks the assigned owner/main-admin identity and returns a short-lived signed URL.

The guest receives no direct Storage access. No anonymous Storage policy or public bucket is permitted.
