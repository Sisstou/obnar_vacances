# OBNAR VACANCES — Verified Guest Notification and Owner-Response Patch Notes

**Inspection date:** 24 November 2026  
**Target:** staging schema, read-only inspection  
**Branch:** `pwa-foundation`  
**Status:** verified source-level findings; not an executable SQL patch

## 1. `notify_new_booking()` — confirmed guest failure

The current trigger unconditionally inserts a traveler notification using `NEW.traveler_id`. Since `notifications.user_id` is NOT NULL, a guest booking with NULL traveler_id would fail at trigger execution and roll back booking creation.

The owner notification currently compares `v_owner_id <> NEW.traveler_id`; when traveler_id is NULL, that expression is UNKNOWN and can suppress the owner notification.

The main-admin query uses `pa.user_id <> NEW.traveler_id`; with NULL traveler_id this is also UNKNOWN and can suppress every admin notification.

**Required replacement semantics:**
- Wrap the traveler notification in `IF NEW.traveler_id IS NOT NULL THEN ... END IF`.
- Notify the owner when `v_owner_id IS NOT NULL AND (NEW.traveler_id IS NULL OR v_owner_id <> NEW.traveler_id)`.
- Main-admin recipients must be filtered with `NEW.traveler_id IS NULL OR pa.user_id <> NEW.traveler_id`, while still excluding the owner.
- Guest receives no notification row; guest status is read through credential-protected polling.

## 2. `notify_booking_cancellation()` — confirmed guest routing gap

The current trigger selects the owner as recipient only when `requester_role = 'traveler'`. A guest request would therefore notify the main admin but not the property owner.

The trigger excludes `NEW.requester_id`. For guest requester_id NULL, the comparison `recipients.user_id <> NEW.requester_id` is UNKNOWN and does not filter recipients. The existing `IS NOT NULL` guard still prevents NULL notification targets.

**Required replacement semantics:**
- Owner recipient condition becomes `requester_role IN ('traveler','guest')`.
- Owner-initiated cancellation still notifies the traveler only when traveler_id is non-NULL.
- Main-admin recipient remains included according to the existing workflow.
- Keep `recipients.user_id IS NOT NULL`; do not attempt a notification to the guest.
- Keep the current event title/message branches and history behavior unless separately reviewed.

## 3. `owner_respond_to_cancellation()` — confirmed role gate

The current owner-response routine rejects every request whose `requester_role` is not exactly `traveler`. This blocks guest cancellation requests even if the guest cancellation row is valid.

**Required minimal change:**
- Replace the exact traveler-only role predicate with a membership check accepting `traveler` and `guest`.
- Preserve owner authentication, property ownership, booking and cancellation row locks, owner-response deadline, timeout escalation, cancellation state transitions, audit history and refund rules.
- For guest requester_id NULL, existing notification recipient filtering must continue to omit the guest.

## 4. Other function guards remain mandatory

Previously identified guest NULL-traveler notification paths still require full-definition review before migration assembly:
- `respond_to_booking` rejection notification.
- `admin_review_owner_booking` approval and rejection notifications.
- `admin_review_payment_receipt` review notification.
- `admin_review_booking_cancellation` refund-review requester-role allowlist must include guest in the owner-approved exceptional refund branch only.

Do not patch these functions by broad text replacement. Preserve their complete current definitions, validate the exact target source and apply narrowly reviewed changes.

## 5. Safety and deployment

This note was created from read-only function-definition inspection. No SQL was applied. No Storage policy, Edge Function, frontend, or production setting was changed. It is not a migration and does not authorize deployment.
