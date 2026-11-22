# OBNAR VACANCES — Guest Booking Design (No SMS)

Status: design only. No database migration, Edge Function deployment, production change, or public UI change has been applied.

## Decision

Keep one canonical `public.bookings` table. Add a guest identity path to it rather than creating a second booking ledger. Registered travelers continue using the existing `traveler_id` path and existing authenticated workflow.

A guest booking is a booking row with:
- `traveler_id = NULL` (guest-only; authenticated bookings must still have a traveler id).
- `guest_name` and `guest_phone` stored privately on the booking.
- A separate guest-access record containing only a cryptographic hash of a high-entropy, one-time displayed access secret.
- A public booking reference that is an identifier only, never an authorization credential.

Do not allow anonymous clients to insert, select, update, or delete rows in `bookings`. Do not expose guest phone/name or access hashes through public table reads.

## Why this needs a coordinated migration

The current schema has `bookings.traveler_id NOT NULL`. The current owner/admin booking workflows and triggers assume a registered traveler. The following database routines were found to reference `traveler_id` and must be reviewed/updated before enabling guest bookings:

- `create_booking`
- `notify_new_booking`
- `notify_booking_cancellation`
- `request_booking_cancellation`
- `respond_to_booking`
- `admin_review_owner_booking`
- `admin_review_payment_receipt`
- `admin_review_booking_cancellation`
- `admin_review_refund_execution`
- `cancel_booking_by_traveler`
- `expire_unpaid_bookings`
- `submit_payment_receipt`

Also inspect the owner dashboard queries, admin booking screens, notification constraints, booking-cancellation history, payment receipt storage policies, and any views/reports that assume `traveler_id` is non-null.

The existing exclusion constraint `no_overlapping_bookings` is valuable and must remain authoritative for guest and authenticated bookings alike. Availability must be checked and inserted atomically in the database, not only in the browser.

## Proposed data model

1. Add nullable `guest_name` and `guest_phone` columns to `bookings`.
2. Add a check constraint enforcing exactly one identity mode:
   - registered booking: `traveler_id IS NOT NULL`, guest fields are null;
   - guest booking: `traveler_id IS NULL`, guest name and phone are non-empty.
3. Add `public.booking_guest_access` (or equivalent private schema table) with:
   - `booking_id` primary/foreign key;
   - `secret_hash` only (never plaintext);
   - `created_at`, `expires_at`, `revoked_at`, `last_used_at`;
   - optional failed-attempt counters / lockout metadata.
4. Add a cryptographically random public reference with a unique constraint. It is for lookup only; the secret is always required too.
5. Keep the guest access table inaccessible to `anon` and `authenticated` direct table queries. Access only through narrowly scoped server-side functions.

Do not store the plaintext access secret, full access URL containing the secret, or any secret in analytics/logs.

## Guest creation flow

1. The browser submits property id, dates, guest count, guest name and phone to a Supabase Edge Function.
2. The function validates request shape and bounds, normalizes phone input, checks origin and request size, and applies per-IP and per-property rate limits using a database-backed atomic limiter. CAPTCHA can be added later if abuse justifies its operational cost; do not assume a third-party CAPTCHA is free.
3. The server obtains the current approved property, owner, capacity and price from the database. Never trust price, owner id, status, or calculated totals sent by the browser.
4. A database transaction/function serializes booking attempts for the property, validates dates/capacity/status, calculates price and commission using the existing business rules, and inserts the pending booking. The existing exclusion constraint remains the final overlap guard.
5. Generate a high-entropy secret on the server (at least 256 random bits). Store only a cryptographic hash. Return the reference and plaintext secret once in the HTTPS response. Explain that the user must save it; it cannot be recovered if lost.
6. Notify the owner using the existing in-app notification system. Do not try to notify a guest by SMS or email as part of the free path.

The Edge Function must use server-only credentials. Never ship the service-role key to the browser. Validate every input and return generic errors that do not disclose whether a reference exists.

## Guest follow-up

- Guest enters reference + secret.
- A server-side verification function hashes and checks the secret, enforces expiry and throttling, and returns only the minimum booking status/details needed by the guest.
- A valid secret is required for every sensitive read or action. Reference alone is never sufficient.
- Do not put the secret in query strings, referrer-bearing links, or browser local storage by default. Prefer manual entry and short-lived in-memory handling.
- Provide a rotate/revoke path if the secret is suspected compromised. Do not reveal the original secret again.

## Owner/admin and lifecycle integration

- Owners may see guest contact details only for bookings attached to properties they own. Main admin access remains governed by existing admin checks.
- Update notification triggers so a guest booking does not attempt to insert a notification with a null `user_id`; owner notification must still be created.
- Guest cancellation requests must use the same `booking_cancellations` workflow and the existing approved cancellation/refund policy. Add a guest-authorized server endpoint that validates reference + secret, then invokes a narrowly scoped database routine. Do not bypass the 48-hour owner review or main-admin refund decision rules.
- Payment receipt submission for guests needs a separate secret-authorized endpoint and storage authorization. Do not loosen the existing authenticated storage policies globally.
- Admin and owner screens should continue reading one canonical bookings dataset. Render a guest label and contact details only for authorized owner/admin views.
- Existing authenticated traveler flows, cancellation requests, payment submissions and notifications must remain unchanged.

## Security and abuse controls

- No public `INSERT/SELECT/UPDATE/DELETE` policy on `bookings`.
- No direct anonymous access to guest access hashes or guest contact fields.
- High-entropy secret, hash-at-rest, expiry, revocation and throttling.
- Atomic per-property locking and the existing exclusion constraint.
- Rate-limit both guest creation and secret verification. Avoid account/reference enumeration in responses.
- Minimize logs; never log phone numbers, secrets, hashes, or full payloads.
- Add tests for concurrent overlapping requests, invalid property state, over-capacity requests, expired/revoked secrets, repeated failed attempts, owner isolation, guest cancellation timing, payment receipts, and regression of authenticated booking.

## Deployment sequence

1. Build migration and Edge Functions in staging only.
2. Update all dependent triggers/RPCs/views/storage policies and owner/admin UI in one reviewed change set.
3. Run SQL regression tests and browser tests for both registered and guest flows.
4. Verify rollback plan and backup.
5. Only after explicit approval, apply to production and then enable the guest UI.

## Current verified findings

- The active frontend branch is `pwa-foundation`; the site still points at the primary Supabase project.
- The active frontend currently blocks booking unless `currentUser` exists and calls `create_booking`.
- In staging, `bookings.traveler_id` is NOT NULL.
- Staging has `no_overlapping_bookings` and a `create_booking` routine with property serialization and server-side price/capacity checks.
- The bookings table has notification, payment-confirmation, test-booking-guard and public-date-sync triggers.
- Multiple lifecycle routines reference `traveler_id`; these must be adapted before allowing null traveler ids.
- No database changes or deployment were performed as part of this design.


## Staging implementation audit — 22 November 2026

This section records verified staging findings. It does not authorize or apply schema changes.

### Confirmed schema blockers

- `public.bookings.traveler_id` is currently `NOT NULL`; the guest path cannot be inserted until this is changed with a strict identity-mode constraint.
- `public.booking_cancellations.requester_id` is also `NOT NULL`. Guest cancellation requests therefore need an explicit guest identity linkage (for example, a nullable requester_id plus a guest-access reference), while preserving authenticated requester attribution.
- `public.booking_cancellation_history.actor_id` is nullable already, so a guest-originated event can be represented without inventing a user account; the actor role/action still need explicit guest values and policy review.
- `public.notifications.user_id` is `NOT NULL`. Guest notifications cannot be represented as user notifications. Guest creation must skip traveler notification and still notify the property owner and main admin where applicable.
- Existing `booking_cancellations` workflow stores requester role, owner-response deadline, refund eligibility and execution state. The guest path must enter this same workflow; it must not create a parallel cancellation ledger.
- The existing booking exclusion constraint and property-level advisory lock in `create_booking` must be retained. Both remain necessary: the exclusion constraint is the final database-level overlap guard.

### Confirmed routine behavior requiring coordinated changes

- `create_booking(uuid,date,date,integer)` currently requires `auth.uid()`, verifies approved property, owner exclusion, capacity and server-side price/commission, obtains a per-property advisory transaction lock, checks active overlaps, and inserts one booking. A separate guest-only server entry point should reuse the same transactional invariants rather than accepting client-supplied totals.
- `notify_new_booking()` unconditionally inserts a notification for `NEW.traveler_id`; this will violate the notifications NOT NULL constraint for guest rows unless the traveler insert is conditional. Owner and main-admin notification behavior must remain.
- `notify_booking_cancellation()` routes notifications using the authenticated requester and traveler IDs. Guest requests need to notify the owner/admin without assuming a traveler user ID.
- `request_booking_cancellation(uuid,text,text)` currently authenticates with `auth.uid()`, determines traveler/owner role, locks the booking and property, and implements the existing immediate-cancel / owner-review / admin-review paths. A guest endpoint must validate the guest secret before invoking an equivalent tightly scoped transition.
- `respond_to_booking(uuid,text)` notifies the traveler directly after owner rejection. It must skip that user notification for guests while preserving owner decision rules.
- Admin cancellation/refund routines notify traveler and owner using booking.traveler_id. Guest bookings must not break those operations; the owner and main-admin controls and refund decision rules remain unchanged.
- The current `cancel_booking_by_traveler(uuid)` routine contains a separate older cancellation path with a seven-day threshold. It must not be used for guest bookings or silently override the current cancellation-request workflow. Its use by the UI and grants must be checked before any change.
- Admin/owner screens in `index.html` resolve traveler profile data through `traveler_id`; guest bookings need a safe guest display branch. The admin export currently derives name/phone from profiles only. Owner booking retrieval does not select guest contact fields yet.
- The traveler dashboard filters bookings by `traveler_id = currentUser.id`, which should remain unchanged; guest follow-up must use the server-side reference+secret endpoint, not broaden public table reads.

### Frontend locations identified

The current `index.html` has traveler-dependent code in the admin booking card/export and profile lookup, owner booking retrieval, traveler dashboard query, payment receipt RPC, cancellation RPC, and `create_booking` call. In particular, the booking submit path currently invokes the authenticated `create_booking` RPC, so the guest form must not be exposed until the guest Edge Function and database transaction are ready.

### Work still required before a migration can be called complete

1. Finish extracting and reviewing all twelve routine definitions, trigger definitions, RLS policies, table constraints, cancellation history, storage policies for payment receipts, and any views/reports referencing `traveler_id`.
2. Inspect the complete owner/admin JavaScript query and rendering paths, including export and payment/refund proof upload.
3. Design the exact guest linkage for cancellation rows and history, including storage object ownership for guest payment receipts.
4. Write a single coherent migration that updates every dependent function/trigger/policy and preserves the existing registered-user behavior. Do not ship a partial migration.
5. Add Edge Function source with server-only credentials, cryptographic secret generation/hash verification, atomic database-backed rate limiting, generic lookup failures, and no sensitive values in logs.
6. Validate SQL against a disposable local database or equivalent migration test environment, run regression tests for registered bookings, and test guest concurrency, access-secret expiry/revocation, cancellation timing, 48-hour owner response, and admin refund review.
7. Only after the above passes, request explicit approval to apply to staging. Production requires separate explicit approval.

No migration, Edge Function, database write, deployment, or guest-facing UI change has been performed as part of this audit.


## Payment, storage, cancellation-history and authorization audit — 22 November 2026

### Payment receipt storage

- The `payment-receipts` bucket is private, with a 5 MiB limit and MIME allowlist for JPEG, PNG, WebP and PDF.
- Current upload object names are `<traveler_auth_uid>/<booking_id>/<timestamp>-<filename>`.
- The `traveler_upload_payment_receipt` INSERT policy requires a non-null `bookings.traveler_id` equal to `auth.uid()`, a matching first path segment, `awaiting_payment` status, and unpaid/rejected payment status.
- The read policy also assumes the first path segment equals `bookings.traveler_id`, then permits the traveler, property owner or main admin.
- `submit_payment_receipt(uuid,text)` requires an authenticated user and matches both booking.traveler_id and the storage path prefix to `auth.uid()`. It updates payment status and sends notifications to owner/admin.
- Owner and admin browser screens generate signed URLs directly through Storage. Guest receipt objects therefore need a distinct server-generated path and narrowly scoped owner/admin read authorization. The guest secret must never be used as a storage path or placed in the object name.
- The preferred guest upload design is a server-authorized Edge Function that validates reference + secret + booking payment state and uploads to the existing private bucket using a server-only secret key. The guest should not receive direct bucket table permissions. Owner/admin access should be constrained to the matching booking and property owner/main-admin identity. Do not loosen the existing authenticated traveler policy globally.

### Cancellation records and history

- `booking_cancellations.requester_id` is NOT NULL and references `auth.users(id)`.
- `requester_role` currently permits only `traveler` and `owner`.
- `booking_cancellation_history.actor_id` is nullable and references `auth.users(id)`; however, `actor_role` currently permits only `traveler`, `owner`, `admin`, and `system`. A guest actor role requires a deliberate constraint and history-policy update.
- The cancellation-history participant read policy currently recognizes the booking traveler, property owner and main admin. It has no guest-secret authorization path; public table reads must remain disabled.
- The cancellation notification trigger routes traveler/owner/admin notifications and relies on booking/requester user IDs. Guest requests must notify the property owner and main admin as appropriate without attempting a notification to a null traveler/requester user ID.
- The current cancellation request routine is authenticated-only. It calculates the five-day rule, urgent mismatch escalation and 48-hour owner review. The guest cancellation endpoint must preserve those branches exactly and must not directly mutate cancellation status from the browser.
- The current admin review workflow contains a distinct branch for an owner-approved exceptional cancellation where refund eligibility remains for main-admin decision. Guest handling must preserve this separation.
- The old `cancel_booking_by_traveler(uuid)` routine is not granted to `authenticated` in the inspected staging ACL and must not be revived as a guest cancellation path.

### Frontend dependency map

- Admin booking list loads `traveler_id`, then fetches profiles by traveler IDs; rendering and CSV/XLSX export currently derive traveler name/phone from profiles. For guest bookings, admin query/render/export must read guest contact fields only through the existing admin RLS-authorized booking query.
- Owner booking list currently does not select traveler_id, guest name or guest phone. It needs an authorized guest display branch and secure receipt link generation for guest receipt paths.
- Traveler dashboard filters by `traveler_id = currentUser.id`. Keep this filter unchanged; guest follow-up is a separate reference + secret server request.
- Traveler payment upload and cancellation currently call authenticated RPCs. Do not reuse those calls for guests.
- Guest booking UI must remain hidden until server creation, follow-up, cancellation and receipt paths are complete and tested.

### Edge Functions and grants

- Staging currently has no deployed Edge Functions.
- The twelve inspected booking-related functions are SECURITY DEFINER with a fixed search_path. Most application RPCs grant EXECUTE to `authenticated`; trigger functions are postgres-only. The old traveler cancellation and unpaid-expiry routines are not directly executable by authenticated users.
- The staging security advisor reports 12 SECURITY DEFINER functions executable by authenticated users, including admin review RPCs. This is a warning, not by itself proof of privilege escalation: each callable routine must retain explicit internal authorization checks. Keep admin-only routines guarded by the main-admin check and owner routines guarded by property ownership. The guest implementation must not add anonymous EXECUTE on these existing public RPCs.
- The security advisor also reports leaked-password protection disabled. This is an existing Auth configuration warning, separate from the guest booking feature.
- The current private Storage bucket design supports server-side uploads from Edge Functions using a server-only secret key. No key may be included in `index.html`, public repository files, responses, analytics or logs.

### Required coordinated changes before implementation is approved

1. Add guest identity columns and a strict identity-mode constraint to bookings, preserving all existing registered rows.
2. Add guest access records with high-entropy random secret, hash-at-rest, expiry, revocation and database-backed throttling. No plaintext secret persistence.
3. Add an explicit guest linkage to cancellation requests while keeping authenticated requester attribution intact; update requester-role and history-role constraints and participant policies.
4. Update all booking/cancellation/payment/expiry/notification routines and triggers that assume traveler_id is present. Keep one cancellation ledger and one bookings ledger.
5. Add a server-only guest booking Edge Function and guest access/follow-up/cancellation/payment endpoints. Do not deploy until source review and tests pass.
6. Add secure guest receipt upload and owner/admin receipt retrieval without granting guests direct Storage read or table access.
7. Update owner/admin rendering, export, notification display and payment receipt access. Keep the traveler dashboard's authenticated query unchanged.
8. Review all function EXECUTE grants and internal authorization checks. Do not treat SECURITY DEFINER warnings as harmless without inspecting each routine.
9. Test SQL on a disposable local database or isolated test project, including registered-user regression, guest booking concurrency, no-overlap constraint, secret expiry/revocation, request throttling, payment receipt access, owner 48-hour response and main-admin refund review.
10. Only after those checks pass, prepare a CLI-generated migration and request explicit approval before applying it to staging. Production requires separate approval.

No database DDL, migration application, Edge Function deployment, Storage policy change, production change or guest-facing UI change has been made.
