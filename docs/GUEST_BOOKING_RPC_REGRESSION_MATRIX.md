# OBNAR VACANCES — Guest Booking RPC and Regression Matrix

**Date:** 24 November 2026  
**Target branch:** `pwa-foundation`  
**Target environment:** staging only, after explicit approval  
**Status:** design/test artifact; no SQL applied and no deployment performed

## 1. Keep registered and guest creation paths separate

### Registered path
Keep `create_booking(uuid,date,date,integer)` unchanged:
- Requires `auth.uid()`.
- Stores that UID in `bookings.traveler_id`.
- Validates property approval, owner self-booking, dates, guest count and capacity.
- Uses the property-scoped advisory transaction lock and checks overlapping active bookings.
- Preserves current price and commission calculation.

Keep `request_booking_cancellation(uuid,text,text)` unchanged for registered users. It derives the requester from `auth.uid()`, checks traveler/owner relationship, and retains the existing 5-day, urgent mismatch, 48-hour owner review and refund rules.

### Guest path
Do not overload either registered RPC. Add separate server-only operations invoked by Edge Functions:
- `guest_create_booking`: atomically validates property and dates, applies the same capacity/pricing/commission rules and advisory lock, inserts a booking with NULL `traveler_id`, creates a high-entropy reference and stores only a hash of the secret.
- `guest_get_booking_status`: verifies reference + secret hash, expiry/revocation and rate limits, then returns a strict allowlist of guest-visible fields.
- `guest_request_booking_cancellation`: verifies the same credential, locks the booking, applies the same existing cancellation eligibility rules, inserts a guest-role cancellation with NULL requester ID and a NULL-actor guest history record.
- `guest_submit_payment_receipt`: verifies credential and booking payment state, validates content server-side, uploads to the private bucket using a server-generated object path, then binds the path to the booking atomically.
- `guest_get_payment_or_cancellation_status`: returns only the minimum status fields required for follow-up.

These routines must not be executable by `anon` or `authenticated` through PostgREST. Edge Functions use server-only credentials; no service-role key is shipped to the browser.

## 2. Notification behavior

| Event | Registered traveler | Guest booking | Owner | Main admin |
|---|---|---|---|---|
| Booking created | Existing notification | No notification row; status polling | Notify | Notify |
| Owner rejects pending booking | Notify traveler | No guest notification row | Existing behavior | Existing behavior |
| Admin approves/rejects owner acceptance | Notify traveler | No guest notification row | Notify | Existing admin log |
| Payment receipt reviewed | Notify traveler | No guest notification row | Notify | Existing admin log |
| Cancellation requested by traveler | Notify owner | — | Notify | Notify where existing workflow requires |
| Cancellation requested by guest | — | No guest notification row | Notify | Notify |
| Owner responds to guest cancellation | — | No guest notification row | Actor is owner | Notify |
| Admin decision on guest cancellation/refund | — | No guest notification row | Notify | Admin log |

A NULL `traveler_id` must never be inserted into `notifications.user_id`. Admin recipient filters must be NULL-safe; SQL comparisons such as `user_id <> NULL` do not evaluate true.

## 3. Cancellation state-machine invariants

- Guest requests use `requester_role='guest'` and `requester_id IS NULL`.
- The unique one-cancellation-row-per-booking constraint remains for the first release.
- A pending owner review leaves booking status and date blocking unchanged.
- Owner silence after 48 hours moves the request to `admin_review`; it is not approval or rejection.
- An owner approval of an exceptional late cancellation may cancel the booking, but refund eligibility remains for main-admin review.
- Owner rejection routes the request to admin review and leaves the booking active with dates blocked.
- A main-admin rejection leaves the booking active and dates blocked.
- Only a final cancellation decision releases dates.
- The existing separate owner-initiated cancellation policy remains unchanged.
- The urgent material-mismatch path remains routed directly to admin review.

## 4. Required pre-release test matrix

### Registered-user regression (must all pass)
1. Registered booking creation: correct traveler ID, price, commission and pending state.
2. Reject invalid dates, past check-in, zero/negative guests and capacity overflow.
3. Reject owner self-booking.
4. Two concurrent overlapping attempts for one property: at most one succeeds.
5. Registered cancellation at least 5 days before check-in: existing full-refund eligibility remains.
6. Registered exceptional cancellation under 5 days: owner 48-hour review and admin escalation remain.
7. Registered receipt upload/read: existing UID-prefixed path and Storage policy remain.
8. Registered notification recipients and admin audit logs remain unchanged.

### Guest security and workflow (must all pass)
1. Create guest booking without auth; traveler ID is NULL and booking invariants match registered flow.
2. Reference alone cannot read status, upload a receipt, cancel, or modify a booking.
3. Correct secret + reference returns only allowlisted fields.
4. Invalid secret, malformed reference, expired credential and revoked credential are rejected.
5. Repeated invalid attempts trigger bounded rate limiting/temporary lockout without revealing whether a reference exists.
6. Concurrent guest booking overlap attempts serialize and cannot double-book.
7. Guest booking creation is atomic: no booking without credential, no credential without booking.
8. Guest cancellation creates requester role guest, NULL requester ID and NULL actor history; no guest notification row.
9. Guest cancellation owner review obeys the same 48-hour deadline and pending-date blocking.
10. Guest owner approval leaves refund decision to the main admin in exceptional late cases.
11. Guest receipt is uploaded only to a server-generated path in the private bucket.
12. Owner/admin receipt retrieval succeeds only after server-side authorization and uses a short-lived signed URL.
13. No anonymous SELECT/INSERT/UPDATE/DELETE on bookings, cancellations, history, credential table, notifications or Storage objects.
14. No anonymous EXECUTE on guest RPCs; no service-role secret in frontend assets or logs.
15. Guest status polling exposes no owner private data, internal notes, admin identity, storage path or other guest bookings.

## 5. Deployment gates

The schema draft currently in `docs/sql-drafts/GUEST_BOOKING_SCHEMA_DRAFT_NOT_FOR_EXECUTION.sql` is not a complete release migration. Do not apply it alone.

Release order after review:
1. Complete and statically review one coordinated migration containing schema, triggers and RPCs.
2. Run migration on staging only after separate explicit approval.
3. Verify effective grants, RLS, function EXECUTE ACLs, constraints and Storage policies.
4. Deploy server-side Edge Functions only after separate explicit approval.
5. Run the complete matrix above with isolated test data.
6. Inspect frontend guest flow and verify registered-user flow regression.
7. Publish frontend only after separate explicit approval.
8. Production migration and production deployment each require their own explicit approval.

## 6. Current implementation status

- Staging schema and affected function definitions inspected read-only.
- Initial schema draft committed to `pwa-foundation`.
- No migration applied.
- No Edge Functions deployed.
- No Storage policies or bucket settings changed.
- No guest booking enabled in the frontend.
- This document defines implementation and acceptance criteria; it is not evidence that tests have passed.
