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
