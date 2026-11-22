# OBNAR VACANCES — Guest Booking Edge API Contract

**Status:** implementation contract / not deployed  
**Branch:** `pwa-foundation`  
**Date:** 22 November 2026

This document defines the server boundary for guest bookings. It does not authorize a browser to access booking tables or Storage directly. The existing registered-traveler workflow remains unchanged.

## Security invariants

1. The browser never receives a Supabase service-role or secret API key.
2. Guest endpoints use a server-only Supabase credential and narrowly scoped database operations.
3. No guest endpoint grants anonymous `SELECT`, `INSERT`, `UPDATE`, or `DELETE` on `bookings`, cancellation tables, history, or Storage objects.
4. A booking reference is an identifier only. Every guest read or mutation requires both the reference and a 256-bit random secret.
5. Store only the SHA-256 hash of the secret. Return plaintext once, immediately after successful creation; never put it in logs, analytics, URLs, browser storage, or error messages.
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
- Create the booking, opaque reference and secret hash in one database transaction.
- Return booking reference and plaintext secret once; do not return internal IDs or privileged data.

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
