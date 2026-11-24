# OBNAR VACANCES — Guest Booking Staging Dependency Findings

**Checked:** 24 November 2026  
**Project:** staging `rhxeclddohpwtpzkruzm`  
**Branch:** `pwa-foundation`  
**Scope:** read-only schema and function inspection  
**Execution:** no database writes, migrations, deployments, Storage changes, or frontend changes

## Confirmed schema blockers

| Object | Current staging state | Required guest-support change |
|---|---|---|
| `bookings.traveler_id` | NOT NULL; FK to `profiles(id)` | Permit NULL for guest bookings while retaining the FK for registered users. |
| `booking_cancellations.requester_id` | NOT NULL; FK to `auth.users(id)` | Permit NULL only for guest-originated requests; retain the FK. |
| `booking_cancellations.requester_role` | CHECK permits `traveler`, `owner` only | Add `guest`; enforce role/ID consistency in controlled server-side routines. |
| `booking_cancellation_history.actor_id` | Nullable UUID FK to `auth.users(id)` | Already supports NULL actor. |
| `booking_cancellation_history.actor_role` | CHECK permits `traveler`, `owner`, `admin`, `system` | Add `guest` for guest-originated history with NULL actor. |
| `booking_cancellations_booking_id_key` | UNIQUE on `booking_id` | Preserve for first release: one cancellation lifecycle per booking. |

The existing booking overlap exclusion constraints remain in place and must not be weakened.

## Confirmed notification and lifecycle failure paths

1. **`notify_new_booking()`:** unconditionally inserts a traveler notification using `NEW.traveler_id`. A guest booking with NULL traveler ID would violate `notifications.user_id NOT NULL`. The admin-recipient predicate `pa.user_id <> NEW.traveler_id` also evaluates UNKNOWN for NULL and can suppress the admin notification. Guest path must skip traveler notification and use an explicit NULL-safe admin predicate; owner notification must remain.
2. **`notify_booking_cancellation()`:** owner notification currently covers only `requester_role='traveler'`. A guest request needs an owner-recipient branch and main-admin notification, with no guest notification row.
3. **`respond_to_booking()`:** rejection inserts a traveler notification unconditionally. Skip that insert when traveler ID is NULL while preserving the owner authorization and booking transition.
4. **`admin_review_owner_booking()`:** both approval and rejection paths insert a traveler notification unconditionally. Guard those inserts for guest bookings; preserve owner notification and admin audit log.
5. **`admin_review_payment_receipt()`:** inserts a traveler notification unconditionally after payment review. Skip it for guest bookings; preserve owner notification, payment transition, and admin log.
6. **`owner_respond_to_cancellation()`:** currently rejects every requester role other than `traveler`. Permit `guest` only in the same `owner_review` / pending-response lifecycle; retain owner identity checks, row locks, 48-hour deadline, active-booking checks, and history writes.
7. **`admin_review_booking_cancellation()`:** the post-owner-approval refund-review branch currently accepts requester roles `traveler` and `owner` only. Add `guest` to this branch without changing the separate initial cancellation decision rules or the main-admin gate.

## Security and compatibility requirements

- Do not grant anonymous table access or anonymous execution of guest database routines through PostgREST.
- Guest operations must be reached through server-side Edge Functions using server-only credentials; no service-role key in the browser.
- Keep registered-user booking, cancellation, receipt-upload, and notification behavior unchanged.
- Keep the private payment-receipts bucket and existing registered-user Storage policy unchanged.
- Guest receipt access for owners/admins still requires one explicit, narrowly scoped authorization path.
- Guest credentials must be stored as a hash and checked with rate limiting; the booking reference alone is never authorization.
- Keep pending cancellation dates blocked until the final decision.
- Keep the existing single-cancellation-row lifecycle for the first release.

## Verification limits

- This was read-only inspection of live staging definitions and metadata.
- Staging currently has no guest Edge Functions and no guest migration.
- No guest workload exists in staging to test these paths.
- No Deno test suite or database integration suite has been run against this staging environment.
- These findings are a migration implementation checklist, not evidence that guest booking is ready or enabled.
