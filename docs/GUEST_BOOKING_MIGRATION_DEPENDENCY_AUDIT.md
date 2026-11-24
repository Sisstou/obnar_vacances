# OBNAR VACANCES — Guest Migration Dependency Audit

**Date:** 24 November 2026  
**Environment inspected:** staging `rhxeclddohpwtpzkruzm` (read-only)  
**Branch:** `pwa-foundation`  
**Status:** implementation audit; no database changes

## Confirmed schema facts

### Bookings
- `bookings.traveler_id` is currently NOT NULL and references `profiles(id)`.
- It can be made nullable without changing the existing FK; registered rows remain linked to profiles.
- The table has checks for positive guest count, valid date order, nonnegative total and per-night amounts, valid booking/payment/refund states, and confirmed bookings requiring verified payment.
- Two GiST exclusion constraints exist:
  - `no_overlapping_bookings` covers pending, awaiting-admin-approval, awaiting-payment and confirmed bookings, using half-open date ranges.
  - `no_overlapping_confirmed_bookings` covers confirmed bookings.
- Keep both exclusion constraints unchanged in the first guest release.
- `is_test` defaults false.

### Cancellation requests
- `booking_cancellations.requester_id` is currently NOT NULL and references `auth.users(id)`.
- `requester_role` currently allows only traveler and owner.
- `booking_cancellations_booking_id_key` enforces one cancellation record per booking. Keep it for the first release.
- Existing status, reason, owner-response, refund-eligibility, refund-execution and nonnegative refund amount checks remain valid and should not be weakened.

### Cancellation history
- `booking_cancellation_history.actor_id` is already nullable and references `auth.users(id)`.
- `actor_role` currently allows traveler, owner, admin and system. Guest support requires adding guest while requiring NULL actor_id for guest history entries.

### Notifications
- `notifications.user_id` is NOT NULL. Guest events must not create a notification row for the guest.
- Guest booking status is delivered through the credential-protected status endpoint, not the notifications table.

## Mandatory schema and logic safeguards

1. Make `bookings.traveler_id` nullable only in the coordinated migration.
2. Add a database invariant so a NULL traveler_id booking is valid only when a matching guest credential record is created in the same transaction. Implement this through a deferred constraint trigger or a carefully designed server-only atomic routine plus a final integrity check; do not rely only on frontend behavior.
3. Make cancellation requester_id nullable and allow role guest only with requester_id NULL. Registered traveler/owner roles must retain non-NULL requester IDs.
4. Allow guest cancellation history only with actor_id NULL.
5. Keep the guest credential table inaccessible to anon and authenticated, including table privileges and RLS.
6. Ensure the server-only guest creation routine inserts booking and credential atomically. It must use the same advisory lock, capacity checks, price calculation, and overlap constraints as registered booking creation.
7. Do not add guest direct access to bookings, cancellations, history, notifications, or Storage.
8. No notification insert may target a NULL traveler ID. Main-admin notification selection must use NULL-safe predicates.
9. Existing cancellation rules and unique-per-booking lifecycle remain unchanged.
10. Guest receipt object access must use either a narrow owner/admin authorization endpoint with short-lived signed URLs or an equally narrow Storage policy. No public bucket or anon Storage grants.

## Function-level changes still required

The following existing routines have guest-incompatible paths and must be replaced/reviewed in one coordinated migration:
- `notify_new_booking`: skip traveler notification when traveler_id is NULL; make admin recipient comparison NULL-safe.
- `notify_booking_cancellation`: guest request notifies owner and main admin only.
- `respond_to_booking`: guard traveler notification on owner rejection.
- `owner_respond_to_cancellation`: accept guest-role cancellation requests without changing owner authorization, response deadline or booking locks.
- `admin_review_owner_booking`: guard traveler notifications when traveler_id is NULL.
- `admin_review_payment_receipt`: guard traveler notifications when traveler_id is NULL.
- `admin_review_booking_cancellation`: allow guest in the admin refund-review branch, retaining the same approval rules and NULL-filtered notification recipients.

Registered RPCs `create_booking`, `request_booking_cancellation`, and `submit_payment_receipt` must remain authenticated-user paths; do not weaken their auth checks or grant them to anon.

## Release blockers

- The current SQL file `GUEST_BOOKING_SCHEMA_DRAFT_NOT_FOR_EXECUTION.sql` is only a schema sketch, not a complete migration.
- Full function replacements and guest-only server RPCs are not yet assembled.
- No guest Edge Functions exist in staging.
- No receipt access path has been implemented.
- Deno tests were not run; Node smoke checks of the shared token helper are not a substitute.
- No real guest workload exists in staging; the previous snapshot had zero bookings and zero cancellation rows.
- Therefore guest booking must remain disabled.

## Approval boundaries

This audit is read-only. No SQL was applied, no Edge Function deployed, no Storage policy changed, and no frontend feature enabled. Staging migration, Edge Function deployment, frontend publication, and production rollout each require separate explicit approval.
