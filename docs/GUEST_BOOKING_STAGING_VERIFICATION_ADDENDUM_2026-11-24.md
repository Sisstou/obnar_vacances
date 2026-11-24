# OBNAR VACANCES — Staging verification addendum

**Date:** 24 November 2026  
**Environment:** staging `rhxeclddohpwtpzkruzm`  
**Branch:** `pwa-foundation`  
**Scope:** read-only verification; no database or Storage changes

## Verified current data state

A direct read-only count of `public.bookings` returned:

- Total bookings: **0**
- Rows marked `is_test = true`: **0**
- Rows marked `is_test = false`: **0**

The current staging environment therefore has no booking rows to preserve or reuse as test fixtures. The test suite must create isolated fixtures explicitly and clean them up only within its own controlled test transaction or dedicated test setup.

This result applies only to the inspected staging project. It does not establish the row count of the separate production project.

## Exact constraint names verified

The current schema uses these exact constraint names:

### `public.booking_cancellations`

- `booking_cancellations_requester_role_check`
- `booking_cancellations_requester_id_fkey`
- `booking_cancellations_booking_id_key` — unique booking ID
- `booking_cancellations_request_status_check`
- `booking_cancellations_owner_response_check`
- `booking_cancellations_refund_eligibility_check`
- `booking_cancellations_refund_execution_status_check`
- `booking_cancellations_refund_amount_check`
- `booking_cancellations_reason_category_check`

### `public.booking_cancellation_history`

- `booking_cancellation_history_actor_role_check`
- `booking_cancellation_history_actor_id_fkey`
- `booking_cancellation_history_cancellation_id_fkey`

### `public.bookings`

- `bookings_traveler_id_fkey`
- `no_overlapping_bookings`
- `no_overlapping_confirmed_bookings`
- Existing status, date, guest-count, price and verified-payment checks remain present.

The names used by the current guest schema draft for the requester-role and history actor-role checks match the live staging names. The draft remains non-executable until all function, trigger, credential-integrity, Edge Function, Storage-read and regression work is complete.

## Function review observations

- `respond_to_booking(uuid,text)` unconditionally inserts a rejection notification for `v_traveler_id`. A guest booking has NULL `traveler_id`; the insert must be guarded so no NULL recipient is written to `notifications.user_id`.
- `admin_review_booking_cancellation(uuid,text,text,text)` currently allows only `traveler` and `owner` in its exceptional refund-review branch. Guest support requires adding `guest` to that narrow allowlist only; cancellation/refund eligibility rules must remain unchanged.
- The registered-user RPCs `create_booking`, `request_booking_cancellation`, and `submit_payment_receipt` remain authenticated-only and must not be weakened or reused for guests.
- Existing overlap exclusion constraints and one-cancellation-row-per-booking uniqueness remain unchanged for v1.

## Test-data handling decision

All test fixtures created for this work must be explicitly marked `is_test = true` where the schema supports it, use dedicated test properties/accounts, and be excluded from public availability and customer-facing workflows. Cleanup must target only fixture IDs created by the test run; never run a broad delete against booking tables.

## Release status

- Read-only schema and row-count verification completed.
- No SQL migration applied.
- No Edge Function deployed.
- No Storage policy or bucket setting changed.
- No guest booking flow enabled.
- Staging migration, function deployment, frontend publication and production rollout remain separate approval gates.
