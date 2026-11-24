# OBNAR VACANCES — Guest NULL-recipient RPC audit

**Date:** 24 November 2026  
**Environment:** staging `rhxeclddohpwtpzkruzm`  
**Branch:** `pwa-foundation`  
**Scope:** read-only inspection of live function definitions; no database or Storage changes.

## Verified live function fragments

The following findings were confirmed from `pg_get_functiondef` on staging. They are source-review findings, not an executable patch.

### 1. `notify_new_booking()`

The live function currently:
- Inserts a traveler notification unconditionally with `NEW.traveler_id`.
- Uses `v_owner_id <> NEW.traveler_id` for owner suppression.
- Uses `pa.user_id <> NEW.traveler_id` for main-admin suppression.

Required semantics:
- Put the traveler notification inside `IF NEW.traveler_id IS NOT NULL THEN ... END IF`.
- Owner notification condition: `v_owner_id IS NOT NULL AND (NEW.traveler_id IS NULL OR v_owner_id <> NEW.traveler_id)`.
- Main-admin query condition: `NEW.traveler_id IS NULL OR pa.user_id <> NEW.traveler_id`, retaining the existing owner exclusion.
- No guest notification row is written.

### 2. `notify_booking_cancellation()`

The live recipient subquery selects:
- Owner only when `requester_role = 'traveler'`.
- Traveler only when `requester_role = 'owner'`.
- Main admin for all cancellation events.

Required semantics:
- Owner recipient condition must accept `requester_role IN ('traveler','guest')`.
- Owner-initiated cancellation continues to notify the traveler only through the existing non-NULL traveler ID.
- Keep the existing `recipients.user_id IS NOT NULL` guard. Do not send notifications to guests.

### 3. `respond_to_booking(uuid,text)`

The live rejection branch inserts a notification with `v_traveler_id` without a NULL guard.

Required semantics:
- Wrap the complete traveler notification insert in `IF v_traveler_id IS NOT NULL THEN ... END IF`.
- Preserve owner authorization, status transition, test-booking exclusion and all message fields.

### 4. `admin_review_owner_booking(uuid,text,text)`

The live function has two separate traveler notification inserts:
- On admin approval: event type `booking_accepted`.
- On admin rejection: event type `booking_admin_rejected`.

Both currently use `v_booking.traveler_id` directly as `notifications.user_id`.

Required semantics:
- Guard each traveler notification independently with `IF v_booking.traveler_id IS NOT NULL THEN`.
- Do not wrap or suppress the separate owner notification.
- Preserve all existing admin checks, owner notification content, price/deposit calculations, booking transitions, history and logs.

### 5. `admin_review_payment_receipt(uuid,text,text)`

The live function inserts a traveler notification unconditionally using `v_traveler_id`. Its owner notification is currently guarded by:

```sql
IF v_owner_id IS NOT NULL AND v_owner_id <> v_traveler_id THEN
```

Required semantics:
- Guard the traveler notification with `IF v_traveler_id IS NOT NULL THEN`.
- Make the owner condition NULL-safe:

```sql
IF v_owner_id IS NOT NULL
   AND (v_traveler_id IS NULL OR v_owner_id <> v_traveler_id) THEN
```

- Preserve receipt verification/rejection, booking confirmation triggers, admin logs and returned JSON state.

### 6. `owner_respond_to_cancellation(uuid,text,text)`

The live role gate currently requires exactly `requester_role <> 'traveler'` to be false, which rejects guest cancellation rows.

Required semantics:
- Accept `requester_role IN ('traveler','guest')`.
- Preserve all other conditions: authenticated owner, assigned property, active booking, row locks, pending owner response, 48-hour deadline, timeout escalation, history and refund handling.

### 7. `admin_review_booking_cancellation(uuid,text,text,text)`

The live exceptional refund-review branch is narrowly gated by:

```sql
v_cancellation.requester_role IN ('traveler', 'owner')
AND v_cancellation.refund_eligibility = 'admin_review'
AND v_cancellation.refund_execution_status = 'not_started'
```

Required semantics:
- Add `guest` to that one requester-role allowlist.
- Do not change the separate initial cancellation/refund eligibility decision tree unless the final policy review explicitly requires it.
- Preserve the verified-payment and positive-deposit requirements, booking-cancelled check, admin decision requirement, audit history and NULL-filtered recipient notifications.

## Regression cases required before staging approval

1. Guest booking creation does not fail on `notify_new_booking`; owner and main admin receive notifications, no guest notification is inserted.
2. Registered booking creation still notifies traveler, owner and main admin according to the current suppression rules.
3. Guest owner-rejection/owner-response paths never insert a NULL notification recipient.
4. Admin approval and rejection of guest bookings notify owner but never attempt a traveler notification.
5. Guest receipt verification and rejection notify owner/admin as currently intended, with no NULL traveler recipient.
6. Registered traveler cancellation still notifies owner/admin; guest cancellation notifies owner/admin; owner cancellation notifies the registered traveler/admin.
7. Guest cancellation owner response accepts only valid guest requests and retains the 48-hour timeout behavior.
8. Guest exceptional refund review is possible only after the existing owner-approved cancellation state and `admin_review` eligibility; approval still requires verified payment and a positive deposit.
9. Registered-user flows, authorization failures, overlap constraints, payment checks, test-booking exclusions and audit records remain unchanged.
10. All guest RPCs remain server-only; anon/authenticated roles receive no direct guest credential or booking table access.

## Release gate

No migration was applied, no Edge Function deployed, no Storage policy changed, and no frontend feature enabled. This audit does not authorize staging or production changes. Guest booking remains disabled until the coordinated migration, Edge Functions, receipt access path and regression suite are complete and separately approved.
