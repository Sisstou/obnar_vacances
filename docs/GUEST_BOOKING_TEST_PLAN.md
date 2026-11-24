# OBNAR VACANCES — Guest Booking Verification Plan

**Branch:** `pwa-foundation`  
**Status:** test specification only; no deployment or database changes

This plan is the release gate for guest booking. It is intentionally separate from the registered-traveler flow.

## 1. Security invariants

- Guest endpoints are HTTPS-only and accept bounded JSON or multipart payloads.
- The browser never receives a Supabase service-role key or any server secret.
- A booking reference is not an authentication factor. Every read or mutation requires the reference and the 256-bit access secret.
- Only a SHA-256 digest is persisted. Plaintext is returned once after creation and is never logged, placed in a URL, analytics event, or browser storage.
- Unknown reference, incorrect secret, expired secret, revoked secret, and malformed credential produce the same public failure shape.
- Rate limiting is atomic and server/database-backed; client-supplied forwarding headers are not trusted.
- Guest requests cannot directly read or write booking tables, cancellation tables, notification rows, or Storage objects.
- Existing registered-user RPCs and policies remain unchanged in behavior and privilege scope.

## 2. Secret primitive tests

The shared helper must pass tests for:

1. 32 cryptographically random bytes encoded as exactly 43 Base64URL characters.
2. Only the Base64URL alphabet is emitted.
3. Two generated secrets are not equal in repeated sampling.
4. SHA-256 output is exactly 64 lowercase hexadecimal characters.
5. Identical secrets produce identical hashes.
6. Different secrets produce different hashes in test samples.
7. Malformed, truncated, or non-string secrets are rejected before hashing.
8. Hash comparison rejects malformed hex strings and compares fixed-format hashes without early character mismatch exits.

These tests do not establish endpoint security, database authorization, or rate-limit correctness.

## 3. Guest booking creation

- Approved property only; reject pending, rejected, suspended, or unavailable properties.
- Validate check-in/check-out order, booking horizon, guest count, property capacity, and all pricing on the server.
- Reject owner self-booking.
- Never accept client-calculated price, commission, deposit, owner ID, traveler ID, booking status, or Storage path as authoritative.
- Serialize same-property booking attempts with the existing advisory transaction lock.
- Preserve both existing exclusion constraints as the final overlap guard.
- Under concurrent requests for overlapping dates, at most one eligible booking is created.
- Create booking, opaque reference, secret digest, expiry, and initial state atomically.
- Do not create a guest notification row; retain owner and admin notification delivery.

## 4. Guest access and lifecycle

- Valid reference + secret returns only the guest-safe projection.
- Reference alone, secret alone, wrong secret, expired secret, revoked secret, and unknown reference reveal no booking data.
- Repeated failed attempts trigger throttling without revealing whether the reference exists.
- Secret revocation and expiry take effect immediately.
- Status polling does not mutate booking state.
- Guest cannot retrieve owner private contact details, admin notes, other travelers, internal IDs, or secret hashes.

## 5. Cancellation state machine

- Apply the agreed five-day full-refund rule using Algeria-local date semantics.
- Late exceptional requests enter owner review with the existing 48-hour deadline.
- Urgent material property mismatch follows the urgent admin path.
- Pending cancellation keeps the booking active and dates blocked.
- Owner silence after 48 hours moves the request to admin review; it is neither approval nor rejection.
- Owner approval of an exceptional late cancellation does not itself approve a refund.
- Main admin separately decides refund eligibility.
- Preserve the single cancellation row per booking for the first release; a rejected request cannot silently create a second ledger row.
- Every transition writes an attributable, non-sensitive history record. Guest history uses a null auth actor and the explicit guest actor role.

## 6. Payment receipt handling

- Accept only JPEG, PNG, WebP, or PDF up to the existing 5 MiB limit.
- Validate file signature as well as MIME metadata and extension.
- Generate the object path server-side; reject caller-supplied paths.
- Keep `payment-receipts` private.
- Guest receives no direct Storage read permission or permanent public URL.
- Assigned owner and main admin can access only the receipt for the matching booking through one explicitly reviewed authorization path.
- Unrelated owners, travelers, and guests cannot retrieve the object.
- Receipt attachment and payment state validation are performed in a controlled server/database workflow.

## 7. Regression tests for existing registered users

All of the following must continue to pass before guest UI is enabled:

- Registered traveler booking creation and overlap rejection.
- Traveler dashboard query and booking detail access.
- Authenticated receipt upload and `submit_payment_receipt`.
- Existing traveler cancellation request and five-day rule.
- Owner booking response and cancellation response.
- Main-admin booking, payment, cancellation, and refund reviews.
- Owner/admin receipt access and notification delivery.
- RLS isolation for unrelated travelers and owners.
- Existing exports do not silently gain guest personal data.

## 8. Deployment gates

1. Complete the read-only dependency inventory for all routines, triggers, views, constraints, grants, RLS and Storage policies.
2. Implement a single coordinated migration and server-side handlers; do not expose guest RPCs through the anonymous Data API.
3. Validate SQL in a disposable local database or isolated test project.
4. Run automated secret-helper tests and database/Edge integration tests.
5. Review all changed SQL definitions and effective grants.
6. Request explicit approval before applying the migration to staging.
7. Repeat the full regression and security suite in staging.
8. Request separate explicit approval before any production migration, function deployment, or frontend release.
9. Enable guest UI only after the server paths and owner/admin receipt access are verified.

## Current execution status

- Shared cryptographic helper exists.
- Expanded unit-test source is committed, but Deno is not available in the current execution environment; these tests are **not yet run**.
- No guest HTTP handler is deployed.
- No database migration has been applied.
- No Supabase policy, grant, Storage configuration, secret, or production site has been changed.
