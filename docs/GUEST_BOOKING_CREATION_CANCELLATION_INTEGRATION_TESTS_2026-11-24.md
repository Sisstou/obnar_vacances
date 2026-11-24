# OBNAR VACANCES — Guest Booking Creation and Cancellation Integration Test Specification

**Date:** 24 November 2026  
**Branch:** pwa-foundation  
**Status:** test specification only — NOT executed against staging  
**Target:** disposable local Supabase stack or isolated test project first; staging only after separate approval

## 1. Purpose

Define transaction-level acceptance tests for the two highest-risk guest workflows:

1. Creating a guest booking while preserving the registered booking rules and preventing overlapping reservations under concurrency.
2. Requesting and reviewing guest cancellation while preserving the existing five-day, urgent-mismatch, 48-hour owner-response and separate refund-review policy.

This specification does not authorize schema changes, SQL execution against staging, function deployment, or frontend activation.

## 2. Test isolation and fixture discipline

Use a disposable local Supabase database or a dedicated isolated test project. Do not use real properties, customer records, or the live booking calendar.

Each test run must create:
- one dedicated approved test property with a known owner and controlled price/capacity;
- one dedicated unapproved property for negative tests;
- separate owner and main-admin test identities;
- guest test inputs with synthetic names and phone numbers;
- unique date ranges reserved for that test run.

Never assume is_test bypasses overlap protection. Existing exclusion constraints include pending, awaiting_admin_approval, awaiting_payment and confirmed rows regardless of is_test. Use dedicated test properties and non-overlapping date ranges.

Record exact fixture IDs in the test runner output. Cleanup only rows created by that run, in dependency order, and only in the disposable environment. Do not use broad DELETE statements or clean up by date/property alone.

## 3. Guest creation — functional cases

| ID | Setup / request | Expected result |
|---|---|---|
| GC-01 | Valid guest details, approved property, future valid dates, guests within capacity | One booking and one credential record commit atomically |
| GC-02 | Property is pending/rejected/suspended | Rejected; no booking or credential row |
| GC-03 | Check-in is in the past | Rejected; no rows |
| GC-04 | Check-out equals or precedes check-in | Rejected; no rows |
| GC-05 | Guest count is zero, negative, or above capacity | Rejected; no rows |
| GC-06 | Invalid or oversized name/phone payload | Rejected before database mutation |
| GC-07 | Client supplies price, commission, owner ID, traveler ID, status, reference, raw secret, or object path | Caller-controlled values ignored or request rejected; server-derived values only |
| GC-21 | First create request supplies malformed secret digest or raw secret instead of a valid digest | Rejected before booking mutation |
| GC-08 | Two separate non-overlapping requests for same property | Both may succeed |
| GC-09 | Adjacent half-open date ranges where first checkout equals second check-in | Both may succeed |
| GC-10 | Same idempotency key and same normalized booking inputs are retried | Original booking reference returned; no second booking; no secret returned by server |
| GC-16 | Same idempotency key is reused with different normalized booking inputs | Generic conflict; no second booking or credential change |
| GC-17 | Same idempotency key and same inputs are retried concurrently | Exactly one booking/credential/idempotency record; both calls resolve to the same reference |
| GC-18 | Page reload after commit loses in-memory secret but retains idempotency key | Retry may return the original reference only; no secret or booking data disclosed; support reissue required |
| GC-19 | Same key and same inputs are retried with a different secret digest | Rejected; original stored digest is never replaced |
| GC-20 | Different idempotency key submits overlapping dates | Existing overlap protection rejects the conflicting booking |
| GC-11 | Different guests concurrently request overlapping dates on same property | At most one active booking commits |
| GC-12 | Guest creation transaction fails after booking insert but before credential insert | Entire transaction rolls back; neither row remains |
| GC-13 | Credential insert succeeds but booking transaction later fails | Entire transaction rolls back; no orphan credential |
| GC-14 | Registered traveler booking is created after guest implementation | Existing authenticated path behaves exactly as before |
| GC-15 | Guest booking has NULL traveler_id | No guest notification row; owner and main-admin notifications still follow intended behavior |

## 4. Guest creation — integrity and concurrency assertions

After every successful guest creation, assert:

- exactly one booking exists for the created booking reference;
- traveler_id is NULL;
- exactly one credential registry row references that booking;
- the reference is unique and independently generated;
- the stored secret value is a digest only, never the plaintext secret;
- the browser generated the 256-bit secret before the request and retained plaintext only in page memory;
- the server response contains the booking reference but never returns an access secret;
- the access secret is absent from DB rows, logs, URLs, analytics and browser storage;
- status/payment defaults match the registered booking creation contract;
- is_test is false for real guest creation;
- server-calculated nightly price, commission, total and deposit rules match the registered routine;
- property advisory lock and both exclusion constraints remain effective;
- no public property availability view contains guest name, phone, reference, or credential material.

At commit time, verify the bidirectional invariant:
- every booking with NULL traveler_id has exactly one credential record;
- every credential record references a booking with NULL traveler_id.

A missing or duplicate credential must make the transaction fail. A registered booking must not require a credential record.

### Concurrency test method

Run two or more independent database sessions, synchronized by a test barrier, submitting overlapping date ranges for the same property. Do not simulate concurrency with sequential requests.

Expected:
- one eligible overlapping request succeeds;
- every conflicting request receives a controlled conflict response;
- no duplicate active booking or orphan credential exists;
- the database remains usable and no transaction remains stuck.

Repeat with adjacent ranges to confirm half-open interval semantics. Repeat with different properties to confirm unrelated properties are not unnecessarily serialized.

## 5. Guest credential access tests

| ID | Attempt | Expected result |
|---|---|---|
| GA-01 | Correct reference and secret | Guest-safe status projection |
| GA-02 | Reference only | Generic denial |
| GA-03 | Secret only | Generic denial |
| GA-04 | Correct reference, wrong secret | Same public failure shape as unknown reference |
| GA-05 | Unknown reference, valid-format secret | Same public failure shape as wrong secret |
| GA-06 | Malformed/truncated secret | Generic denial; no raw database error |
| GA-07 | Expired secret | Generic denial |
| GA-08 | Revoked secret | Generic denial |
| GA-09 | Repeated failed attempts | Atomic persistent limiter blocks according to approved thresholds |
| GA-10 | Requests routed to separate Edge Function instances | Limiter state remains shared and effective |
| GA-11 | Guest attempts another booking's reference with their own secret | Generic denial; no cross-booking disclosure |
| GA-12 | Guest status response | No internal UUID, secret hash, owner private contact, admin notes, storage path, or other guest data |

Do not run brute-force tests against staging or production. Use a disposable environment and a low, test-only limiter threshold.

## 6. Guest cancellation — policy cases

The test fixture must use a confirmed or otherwise policy-eligible booking state as required by the actual cancellation routine. Payment and deposit facts must be explicit. Use Algeria-local date semantics consistently; do not calculate the five-day boundary from a UTC date without conversion.

| ID | Scenario | Expected result |
|---|---|---|
| GCAN-01 | Valid guest credential; cancellation at least five days before check-in | Request follows the existing full-deposit-refund eligibility rule |
| GCAN-02 | Valid guest credential; cancellation less than five days before check-in | Exceptional review path; owner response deadline is 48 hours |
| GCAN-03 | Guest reports material property mismatch on arrival | Urgent admin review path; no ordinary 48-hour wait |
| GCAN-04 | Cancellation request is pending owner response | Booking remains active and dates remain blocked |
| GCAN-05 | Owner approves an exceptional late request | Cancellation transition follows existing state machine; refund remains a separate main-admin decision |
| GCAN-06 | Owner rejects an exceptional late request | Escalates according to existing policy; booking remains active and dates blocked pending final decision |
| GCAN-07 | Owner does not respond within 48 hours | Request moves to admin_review; silence is neither approval nor rejection |
| GCAN-08 | Main admin rejects cancellation | Booking remains active and dates remain blocked |
| GCAN-09 | Main admin approves eligible cancellation | Final transition occurs; dates are released only at the approved final state |
| GCAN-10 | Guest attempts cancellation with wrong/expired/revoked credential | Generic denial; no cancellation row or history mutation |
| GCAN-11 | Guest attempts cancellation after an existing cancellation row was rejected | Rejected under first-release one-cancellation-row-per-booking rule |
| GCAN-12 | Guest attempts cancellation for another booking | Generic denial; no mutation |
| GCAN-13 | Guest cancellation request races with another cancellation or booking-state transition | Row locks and transaction checks allow one valid state transition only |
| GCAN-14 | Owner attempts to respond to a cancellation for a property they do not own | Denied; no mutation |
| GCAN-15 | Owner attempts response after the 48-hour deadline | Existing timeout/escalation behavior applies; no late approval bypass |
| GCAN-16 | Owner-initiated cancellation of a registered booking | Existing owner-initiated policy remains unchanged |

## 7. Cancellation record and notification assertions

For a successful guest cancellation request, assert:

- requester_role is guest;
- requester_id is NULL;
- booking_id is the authorized guest booking;
- one cancellation row only exists for the booking;
- guest history actor_role is guest and actor_id is NULL;
- no phone, secret, secret hash, or raw credential appears in cancellation history;
- no guest notification row is attempted;
- assigned owner and main admin receive the intended notifications;
- no unrelated owner/admin receives a notification;
- pending review does not change booking status or free dates.

For owner/admin decisions, assert the actor identity is the authenticated owner/admin and the audit history is preserved.

## 8. Refund separation assertions

Test these independently from cancellation approval:

1. Early cancellation eligibility follows the agreed full-deposit refund rule.
2. Exceptional late owner approval does not automatically mark the refund as approved or executed.
3. Only the main admin can make the exceptional refund decision.
4. Refund execution requires the existing verified-payment and positive-deposit prerequisites.
5. Owner-initiated cancellation retains its separate policy.
6. A rejected cancellation or unresolved review does not release dates or create a refund.

Never treat a cancellation status as proof that money was actually refunded. Keep eligibility, admin decision and execution status distinct.

## 9. Registered-user regression suite

Run the existing registered workflow before and after guest-specific changes with equivalent fixtures:

- authenticated create_booking still requires auth.uid();
- traveler_id is populated from auth.uid(), never client input;
- property approval, capacity, date validation, self-booking and pricing remain unchanged;
- overlapping registered booking attempts remain serialized;
- registered cancellation retains its existing five-day and exceptional rules;
- owner response and 48-hour handling remain unchanged;
- admin cancellation/refund decisions remain unchanged;
- registered receipt upload and participant read policies remain unchanged;
- notifications still reach registered traveler, owner and main admin as intended;
- test-booking guards and public date synchronization remain intact.

Any registered regression is a release blocker.

## 10. Test evidence required

A test report is acceptable only if it records:
- exact migration revision and database version;
- isolated environment identifier (never service credentials);
- test runner version;
- fixture IDs and cleanup result;
- each case ID with PASS/FAIL and relevant sanitized error;
- concurrent session count and overlap result;
- post-test integrity queries;
- registered regression result;
- confirmation that anon/authenticated roles have no new direct guest table, RPC, or Storage privileges.

A source-code review or successful helper unit test alone is not evidence that these integration cases passed.

## 11. Known design correction before migration drafting

The current schema sketch creates guest_booking_access in public. Before any executable migration is assembled, move this credential registry into a dedicated non-exposed schema (or prove an equally restrictive server-only access boundary), verify schema USAGE and table ACLs, and ensure PostgREST cannot expose it. Keep RLS enabled and deny anon/authenticated privileges. Do not rely on RLS alone while leaving broad table grants in place.

Also implement the booking/credential bidirectional commit-time integrity invariant identified in the dependency audit. The current schema sketch does not yet implement that invariant and must not be treated as migration-ready.

## 12. Execution and approval boundary

This document is a test specification only. It has not been run against staging. No staging or production SQL, Storage, Edge Function, secret, or frontend change is authorized by this document.

Required sequence:
1. Finish private-schema and commit-time integrity design.
2. Assemble and statically review the complete coordinated migration and server handlers.
3. Run all tests in a disposable local/isolated environment.
4. Present the evidence and remaining blockers.
5. Obtain explicit approval before staging migration.
6. Obtain separate explicit approval for staging Edge Function deployment and frontend activation.
7. Obtain separate approvals for production migration and rollout.
