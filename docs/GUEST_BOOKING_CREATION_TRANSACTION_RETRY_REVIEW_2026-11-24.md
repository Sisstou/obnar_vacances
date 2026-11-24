# OBNAR VACANCES — Guest Creation Transaction and Retry Review

**Date:** 24 November 2026  
**Branch:** `pwa-foundation`  
**Status:** design review only — NOT executable SQL and NOT deployed  
**Scope:** guest creation transaction ordering, parity with registered booking, retry safety

## 1. Release boundary

This review does not execute SQL, change staging or production, deploy Edge Functions, configure secrets, change Storage, or enable guest UI. The registered `create_booking()` routine remains unchanged.

## 2. Verified registered booking behavior to preserve

The read-only staging audit recorded that `public.create_booking(uuid,date,date,integer)`:

1. Requires a non-NULL `auth.uid()`.
2. Validates property, future check-in, checkout after check-in, and positive guest count.
3. Reads owner, nightly price, capacity and approval state under `FOR SHARE`.
4. Requires an approved property and guest count within capacity.
5. Prevents owner self-booking.
6. Takes the existing property-scoped transaction advisory lock.
7. Checks active non-test overlaps using half-open date ranges.
8. Calculates nights, commission and totals server-side.
9. Inserts a pending booking and returns its UUID.

Guest creation must be a separate server-only path. It must not call the registered RPC with a fake identity or weaken its auth check.

## 3. Required guest transaction sequence

The proposed guest creation operation must be one database transaction, with all booking and credential writes committed or rolled back together:

1. Edge Function validates bounded input syntax and request size; it does not accept price, commission, owner ID, traveler ID, booking status, reference, secret hash, or Storage path from the client.
2. Edge Function applies the approved creation throttle using server-derived HMAC digests. It does not trust arbitrary client forwarding headers as network identity.
3. Server generates the opaque booking reference and 32-byte access secret independently using a cryptographically secure random generator; computes the secret digest; plaintext secret remains only in transient server memory.
4. Database routine reads and validates the property using the same approval, capacity, date and price rules as the registered routine.
5. Database routine takes the same property-scoped advisory transaction lock as the registered path, then performs the authoritative overlap check. The existing exclusion constraints remain the final concurrency guard.
6. Database routine inserts the guest booking with `traveler_id = NULL`, `is_test = false`, server-calculated prices, and the same appropriate initial status/payment defaults.
7. In that same transaction, it inserts exactly one row into `private.guest_booking_access` with the booking ID, generated reference, digest, and approved expiry. It never stores plaintext secret.
8. Deferred booking/credential constraint triggers validate the final pair at transaction commit.
9. Only after successful commit does the Edge Function return the reference and plaintext secret once, plus a minimal confirmation DTO. No internal booking UUID or private owner data is returned.
10. All logs and error paths redact the secret, digest, reference/contact where appropriate, and raw database errors.

The private-registry write path must obey the parent-first lock order documented in `GUEST_BOOKING_DEFERRED_INTEGRITY_TRIGGER_REVIEW_2026-11-24.md`. Do not add generic advisory-lock triggers on both tables.

## 4. Critical unresolved retry case

There is a product/security gap that must be resolved before enabling guest creation:

- The database transaction may commit successfully.
- The HTTPS response carrying the one-time plaintext secret may then be lost (network interruption, client disconnect, or Edge Function failure after commit).
- The database correctly stores only a digest, so the server cannot reconstruct the original secret.
- A blind client retry could create a second booking unless request deduplication is designed.
- Returning the original secret later is not possible under the current one-time-secret model.

Do not silently solve this by storing plaintext, returning the secret from a lookup endpoint, or treating booking reference/phone/name as sufficient recovery proof.

Before implementation, choose and document one safe product behavior:
- a narrowly scoped idempotent creation protocol with a separately designed, short-lived recovery capability; or
- no automatic replay, with a clearly defined support/reissue process that does not disclose credentials based only on public booking details.

The idempotency/recovery mechanism itself must be reviewed for entropy, storage, expiry, replay, privacy, throttling and transaction semantics. No specific recovery policy is approved by this document.

## 5. Required additional tests

Add these cases to the existing creation/cancellation integration suite:

| ID | Scenario | Expected result |
|---|---|---|
| GCR-01 | Failure before booking insert | No booking and no credential row |
| GCR-02 | Failure after booking insert but before credential insert | Entire transaction rolls back |
| GCR-03 | Failure after credential insert but before commit | Entire transaction rolls back |
| GCR-04 | Deferred invariant fails at commit | Entire transaction rolls back; no secret returned |
| GCR-05 | Commit succeeds and response reaches client | One booking; one registry row; secret returned once |
| GCR-06 | Commit succeeds but response is lost | Behavior follows the separately approved retry/recovery design; never create an unintended duplicate |
| GCR-07 | Same creation request is submitted concurrently | Behavior follows the approved idempotency contract; no unintended duplicate |
| GCR-08 | Two different requests overlap for the same property/dates | At most one active booking commits |
| GCR-09 | Adjacent half-open date ranges | Both may commit |
| GCR-10 | Different properties are booked concurrently | No unnecessary cross-property serialization |
| GCR-11 | Owner/admin notification trigger fails | Booking and credential transaction roll back together |
| GCR-12 | Existing registered booking creation runs in parallel | Existing authenticated flow and its auth checks remain unchanged |

Tests must use isolated fixtures and independent concurrent database sessions, not sequential simulation. Record sanitized SQLSTATEs and fixture IDs. Never run brute-force or destructive concurrency tests against production.

## 6. Invariant and parity checks

For every successful guest creation:
- exactly one booking is created;
- `traveler_id` is NULL;
- exactly one private credential row exists;
- reference uniqueness holds;
- only the secret digest is persisted;
- property approval, capacity, self-booking protections where applicable, pricing, commission and overlap rules match the registered business rules;
- the existing property advisory lock and both exclusion constraints remain active;
- guest contact and credentials do not appear in public availability projections;
- owner and main-admin notifications remain functional, while no guest notification row is attempted.

For registered bookings:
- `traveler_id` still comes from `auth.uid()`;
- existing authenticated RPC grants and behavior remain unchanged;
- no credential-registry row is created.

## 7. Trigger syntax note

PostgreSQL's current `CREATE TRIGGER` reference permits `UPDATE OF column_name` in the event list and confirms that constraint triggers must be AFTER ROW and can be DEFERRABLE/INITIALLY DEFERRED. This confirms the intended trigger form at the syntax-reference level only; it does not replace parsing and executing the draft against a disposable database matching the project's PostgreSQL version.

Reference: https://www.postgresql.org/docs/current/sql-createtrigger.html

## 8. Current disposition

- Guest creation transaction sequence documented.
- Lost-response/idempotency gap identified as a release blocker.
- Registered booking routine remains unchanged.
- No executable creation RPC SQL produced.
- No SQL executed against staging or production.
- No Edge Function deployed and no guest UI enabled.
- Staging and production each still require separate explicit approval.
