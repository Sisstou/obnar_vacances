# OBNAR VACANCES — Deferred Guest Booking Integrity Trigger Review

**Date:** 24 November 2026  
**Branch:** `pwa-foundation`  
**Status:** design/review artifact only — NOT executable SQL  
**Database target:** staging `rhxeclddohpwtpzkruzm` (read-only review only)

## 1. Scope and release boundary

This review specifies the trigger architecture for the invariant documented in `GUEST_BOOKING_PRIVATE_SCHEMA_INTEGRITY_DESIGN_2026-11-24.md`.

No SQL was executed against staging or production. No migration was applied. No trigger, table, function, grant, policy, Storage setting, or Edge Function was changed. Guest booking remains disabled.

The existing file `docs/sql-drafts/GUEST_BOOKING_SCHEMA_DRAFT_NOT_FOR_EXECUTION.sql` was found malformed in its current GitHub content: the secret-hash CHECK expression is cut off, an unrelated follow-up block appears inside the unfinished expression, and duplicated closing/commit sections follow. It must not be executed or used as a reliable source for a migration. This review deliberately does not try to repair it by appending fragments.

## 2. Required invariant

At transaction commit:

1. Each booking with `traveler_id IS NULL` has exactly one row in `private.guest_booking_access`.
2. Each registry row refers to an existing booking with `traveler_id IS NULL`.
3. A booking with non-NULL `traveler_id` has no registry row.
4. Deleting a booking and its registry row through the FK cascade is valid.
5. A registry row's `booking_id` and a booking's primary key `id` are immutable for this feature. A future conversion/recovery flow requires a separate reviewed atomic operation.

The registry primary key on `booking_id` enforces at-most-one credential row. The deferred assertion enforces existence and reverse ownership.

## 3. Two-phase trigger architecture

A deferred assertion by itself is not a sufficient concurrency design for a cross-table invariant. Two concurrent transactions could otherwise make decisions from snapshots that do not include one another's uncommitted changes. The implementation must serialize every mutation affecting the invariant by booking ID, then validate the final state at commit.

### A. Serialization contract for trusted write paths

Do **not** acquire a transaction advisory lock from generic `BEFORE ROW` triggers on both tables. The executor may already hold a tuple lock on the row being changed before the trigger runs. A registry mutation that then waits for the parent booking row can therefore invert lock order against a booking DELETE that holds the parent row and cascades into the registry row. This creates a credible deadlock path; a second advisory lock does not remove that ordering problem.

Instead, make all credential-registry writes available only through narrowly scoped, server-only mutation routines. Each such routine must acquire `SELECT ... FOR UPDATE` on the parent `public.bookings` row **before** it inserts, updates, or deletes the registry row. The guest-creation routine inserts the booking and registry row in one transaction; the newly inserted booking row is already owned/locked by that transaction. Any future credential rotation/revocation routine must lock the parent booking first. Direct API-role access to the registry remains revoked, and no generic trigger should attempt to lock the parent after a registry tuple has already been locked.

Booking UPDATE/DELETE statements naturally lock their target booking row. No application workflow may change `bookings.traveler_id` or registry membership outside the reviewed server-only routines. If a future workflow needs that, it must follow the same parent-first lock order and be tested as a separate change. The exact mutation entry points and their isolation level must be documented before release.

This parent-first row-lock protocol is the serialization mechanism for application writes. It avoids introducing a second lock domain with a conflicting order. It is not a substitute for the deferred invariant check below.

### B. Deferred commit-time assertion

Install two **AFTER ROW constraint triggers**, both `DEFERRABLE INITIALLY DEFERRED`:

- On `public.bookings`: INSERT, UPDATE OF `traveler_id`, DELETE.
- On `private.guest_booking_access`: INSERT, UPDATE, DELETE.

Both call one private assertion routine, passing the affected booking UUID. The routine queries the final transaction-visible state:

| Booking exists? | `traveler_id` | Registry row exists? | Result |
|---|---|---|---|
| No | n/a | No | Valid (including FK cascade delete) |
| No | n/a | Yes | Reject |
| Yes | NULL | Yes | Valid |
| Yes | NULL | No | Reject |
| Yes | non-NULL | No | Valid |
| Yes | non-NULL | Yes | Reject |

The primary key means there cannot be more than one registry row for a booking. The assertion should use existence checks rather than counting rows unnecessarily.

If the registry row is deleted while the guest booking remains, commit fails. If a guest booking is inserted without a registry row, commit fails. If the registry row is inserted without a guest booking, commit fails (the FK also rejects it). If `traveler_id` changes from NULL to non-NULL while a credential remains, commit fails. Both inserts in a guest-creation transaction pass because the checks are deferred until commit.

### C. Why both phases are required

- The parent-first row lock in every trusted registry mutation routine serializes competing application writes for the same booking.
- The deferred assertion permits the required two-row creation sequence inside one transaction while rejecting an incomplete final state.
- Both functions must be safe under the actual transaction isolation used by the Edge Function/RPC path. The final implementation must test READ COMMITTED and must either explicitly reject unsupported stronger isolation levels or demonstrate correctness under them. Do not assume the lock alone refreshes a repeatable-read transaction snapshot.
- The assertion routine must not update booking, registry, availability, cancellation, payment, or notification rows. It is validation-only.

## 4. Function privilege model

Supabase's current Database Functions guidance recommends SECURITY INVOKER by default and requires a fixed search path for SECURITY DEFINER functions. For this internal trigger-only check, SECURITY DEFINER may be necessary because the registry is intentionally inaccessible to API roles. If selected:

- Use `SET search_path = ''` and fully qualify every relation and helper.
- Use a trusted, explicitly selected owner; verify owner role membership, table ownership, RLS bypass behavior, and effective privileges before finalizing.
- Revoke EXECUTE from `PUBLIC`, `anon`, `authenticated`, and `service_role` for each private helper and trigger function unless a separate, explicit caller is approved.
- Do not grant API roles `USAGE` on `private`, or any registry table privileges.
- Do not create public wrapper RPCs for either lock or assertion function.
- Trigger invocation is not a client-callable RPC. Verify effective function ACLs after creation rather than assuming the trigger mechanism requires broad grants.
- Keep private schema outside the Data API exposed-schema list and verify this in the Dashboard. SQL NULL values for PostgREST settings do not prove exposure configuration.

A future service-only booking wrapper may write both rows in one transaction, but that wrapper is a separate API boundary and is not specified or authorized by this trigger review.

## 5. Existing-object compatibility

The trigger design is additive and must preserve all current staging objects:

- `bookings_require_verified_payment` BEFORE trigger.
- `guard_test_booking_mutation` BEFORE trigger.
- `sync_property_public_booking_dates` AFTER trigger.
- `trg_notify_new_booking` AFTER trigger.
- Existing cancellation guards and history immutability trigger.
- `no_overlapping_bookings` and `no_overlapping_confirmed_bookings` exclusion constraints.
- Existing cancellation uniqueness constraint `booking_cancellations_booking_id_key`.

The currently confirmed `notify_new_booking()` NULL-traveler bug remains a separate release blocker. This integrity trigger does not fix the unconditional traveler notification insert or the NULL-sensitive owner/admin comparisons. Do not enable guest creation until the notification and RPC patches are separately reviewed and regression-tested.

## 6. Required tests

All tests must run in an isolated disposable database or controlled staging test fixture set. Test fixtures must use dedicated test properties/accounts and `is_test = true` where supported. Cleanup must target only IDs created by the test run.

### Integrity outcomes

1. Registered booking insert with non-NULL traveler and no registry row — commit succeeds.
2. Guest booking + exactly one registry row in one transaction — commit succeeds.
3. Guest booking without registry row — commit fails.
4. Registry row without a booking — commit fails (FK/invariant).
5. Registry row attached to a registered booking — commit fails.
6. Delete registry row while guest booking remains — commit fails.
7. Delete guest booking with FK cascade — commit succeeds.
8. Change guest booking to registered traveler while registry row remains — commit fails.
9. Attempt to mutate registry `booking_id` — rejected immediately.
10. Attempt to mutate booking primary key `id` — rejected if the final design installs the immutable-ID guard.
11. Roll back after inserting only one side — no residual row.
12. Rotate reference/hash/expiry fields without changing `booking_id` — commit succeeds if all registry CHECK constraints pass.

### Concurrency and integration

13. Two trusted mutation transactions contend on the same parent booking row — they serialize under the documented parent-first lock order.
14. Concurrent guest booking attempts for overlapping dates still respect the existing property advisory lock and both exclusion constraints.
15. A failed notification trigger or payment validation causes the entire guest creation transaction to roll back, including the credential row.
16. A transaction that changes booking/registry state and then rolls back leaves the original invariant intact.
17. Verify behavior under the exact isolation level used by the production RPC/Edge Function path; include an explicit REPEATABLE READ test before claiming support for that isolation level, and verify whole-transaction retry behavior for serialization failures.
18. Run the full registered booking, payment, owner response, cancellation, admin review, and public availability regression suite.

## 7. PostgreSQL syntax and platform verification

The PostgreSQL `CREATE TRIGGER` reference confirms that constraint triggers are AFTER-only, row-level, and may be DEFERRABLE/INITIALLY DEFERRED. It also documents UPDATE column lists. The final SQL should still be parsed and tested in an isolated database matching the staging PostgreSQL major version before any migration review.

Supabase's current Database Functions guidance recommends SECURITY INVOKER by default and a fixed empty search path for SECURITY DEFINER functions. The final design must document why each definer function is necessary and verify effective ACLs.

The Supabase 2026 Data API change took effect for existing projects on 30 October 2026: new public-schema tables are no longer automatically exposed by default, but explicit grants still control access and existing objects retain their current grants. This does not replace the required private-schema and ACL checks.

References:
- PostgreSQL CREATE TRIGGER: https://www.postgresql.org/docs/current/sql-createtrigger.html
- PostgreSQL trigger behavior: https://www.postgresql.org/docs/current/trigger-definition.html
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- Supabase Data API exposure change: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

## 8. Current disposition

- Trigger architecture specified for review; no executable trigger SQL produced.
- Existing malformed SQL draft remains untouched and must be quarantined from execution.
- No staging or production changes.
- No Edge Functions deployed.
- No guest booking feature enabled.
- Next implementation artifact should be a clean, separately reviewed SQL draft only after ownership, transaction isolation, trigger ordering, and migration syntax are verified in an isolated environment.


## 9. Lock-order review correction (24 November 2026)

A subsequent review rejected the earlier proposal to take a shared advisory lock inside generic BEFORE ROW triggers on both bookings and the credential registry. Row-level tuple locks may already be held before the trigger executes; a registry-side trigger that then waits for its parent booking can deadlock with a booking DELETE that holds the parent and cascades into the registry row.

The revised design removes those generic advisory-lock triggers. The only permitted registry mutations must occur through server-only routines that lock the parent booking row with `SELECT ... FOR UPDATE` before touching the registry. Booking row updates/deletes already acquire their target row lock. The guest creation transaction inserts both booking and registry row atomically. The deferred constraint triggers remain as the final-state invariant guard. This is a design correction, not an implemented database change; the complete lock order and isolation behavior still require isolated integration tests.
