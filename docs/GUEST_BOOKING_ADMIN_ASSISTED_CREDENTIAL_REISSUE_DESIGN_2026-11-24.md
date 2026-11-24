# OBNAR VACANCES — Administrator-Assisted Guest Credential Reissue Design

**Date:** 24 November 2026  
**Branch:** pwa-foundation  
**Status:** proposed security design — pending explicit product approval; NOT implemented

## 1. Purpose and scope

This design addresses the approved Option A failure case: a guest loses the in-memory 256-bit access secret after a page reload, tab close, device loss or browser restart. The server stores only the secret digest, so the original secret must never be reconstructed.

The proposed fallback is an administrator-assisted, in-person credential reissue. It does not add SMS, email OTP, anonymous database access, public Storage access, or encrypted secret escrow. It does not change the registered-traveler workflow.

This document is a proposal only. It does not authorize SQL, migrations, Edge Function deployment, secret configuration, or guest UI activation.

## 2. Security decision proposed

**Remote reissue is not allowed in the first release.** A booking reference, guest name, phone number, property, dates, payment receipt image, or caller-ID match alone is insufficient proof.

Reissue requires the guest to be physically present at a platform-designated verification point and to show an identity document whose displayed name matches the named guest on the booking. The verifier visually checks the document and returns it immediately. Do not photograph, scan, upload, copy, or retain the document, document number, date of birth, address, or other identity fields.

If in-person verification cannot be completed, do not reissue the credential. The guest must continue using the existing credential if available or use the platform's separately approved dispute/support process; staff must not bypass the control.

This proposal deliberately avoids making the property owner a credential-reset authority. Only the authenticated main platform administrator may authorize reissue. An owner may help the guest reach the platform's designated verification point but cannot issue, approve, or complete a reset.

## 3. Proposed two-stage recovery flow

### Stage A — verify and open a one-time recovery challenge

1. The guest requests access recovery through the platform's published support channel. The support agent does not disclose whether a supplied reference exists before identity verification.
2. The guest attends the designated verification point in person.
3. The main administrator signs in through the existing administrator account and independently locates the booking internally.
4. The administrator checks that the presented identity document's displayed name matches the booking's named guest. The document is visually inspected only; no image or document number is captured or retained.
5. The administrator confirms that the booking is eligible for credential recovery and is not already subject to a conflicting recovery, fraud hold, or terminal retention state.
6. Through a server-mediated admin action, the administrator opens exactly one recovery transaction. The server locks the booking and credential record, records the administrator identity and verification method, revokes/suspends the old credential immediately, and creates a high-entropy, single-use recovery challenge bound to that booking and transaction.
7. Only the challenge digest is stored in the private, non-exposed schema. The plaintext challenge is shown once as a QR code on the administrator's authenticated screen for the guest to scan in person. It must not appear in logs, URLs, analytics, browser history, or support notes.
8. The challenge expiry is short and one-time, but its exact duration is a product/security parameter that must be explicitly selected and tested before implementation. Do not invent a duration in code.

### Stage B — guest creates a replacement secret

1. The guest scans the QR code using the device/browser on which they will follow the booking.
2. The guest's browser generates a new independent 32-byte access secret using Web Crypto and keeps the plaintext only in page memory.
3. The browser sends the challenge and the SHA-256 digest of the new secret over HTTPS POST to a dedicated Edge Function. The raw new secret is never sent to the server.
4. The server validates the challenge digest, expiry, unused state, booking binding and recovery transaction under a database lock. It applies throttling and rejects malformed or replayed challenges generically.
5. In one transaction, the server installs the new secret digest, invalidates the challenge, marks the recovery transaction complete and writes a sanitized audit event. The old credential remains revoked; there must never be two simultaneously valid guest secrets.
6. The browser receives only a success result and continues with the new secret already held in page memory. The server does not return the secret or any internal booking UUID.
7. If the guest closes/reloads the page before safely retaining the new secret in the active session, the process must be repeated after a new in-person verification. Do not add a recovery route that returns the secret.

### Expired or interrupted recovery

- The old credential is revoked as soon as Stage A succeeds.
- If the challenge expires, is consumed incorrectly, or the guest abandons the process, the challenge is invalidated and the booking remains protected; the old secret is not silently restored.
- A new challenge requires a new in-person verification and a new administrator action.
- Recovery attempts are rate-limited and audited. Repeated failed attempts may trigger a temporary recovery hold; exact thresholds remain a release gate.
- Support staff must not send a challenge through SMS, email, messaging apps, or a URL. The QR is presented only in person.

## 4. Authorization and database boundary

- Only the existing main-admin authorization check may initiate Stage A. Do not trust user metadata or a caller-supplied role.
- Owners, ordinary authenticated users, and anon must have no direct access to the recovery tables or routines.
- The browser must not call private database routines directly. Both stages go through narrowly scoped Edge Functions and server-only credentials.
- Keep the recovery challenge, its digest, transaction state and audit data in a dedicated non-exposed schema. Explicitly revoke PUBLIC, anon, authenticated and unnecessary service_role privileges; grant only the exact server-side execution path required.
- Use fixed search paths for any SECURITY DEFINER routine, explicit EXECUTE grants, internal authorization checks, row locks and atomic state transitions.
- Do not put raw challenge values, access secrets, secret digests, identity-document numbers, or document images in audit rows.
- The recovery operation must be idempotent for its own transaction identifier and must reject concurrent reset attempts. It must not mutate booking dates, payment state, cancellation state, deposit, receipt path, owner assignment or booking status.
- Existing registered-user RPCs, RLS policies and Storage policies remain unchanged.

## 5. Minimal audit record

Record only what is necessary to establish accountability:

- internal booking identifier (not exposed to the guest);
- recovery transaction identifier;
- authenticated main-admin user ID;
- event timestamps and final outcome;
- verification method code, such as in_person_visual_name_match;
- a bounded reason category, such as guest_lost_access_secret;
- challenge issue/consume/expiry state;
- old-credential revocation and new-credential activation timestamps.

Do not retain identity-document copies, document numbers, full identity details, raw phone numbers, challenge plaintext, secret plaintext, secret digests, or free-form sensitive notes. Audit access must be restricted to the main administrator and reviewed through the existing admin audit controls.

## 6. Failure and abuse controls

- Use generic public responses that do not reveal whether a booking reference exists.
- Apply atomic database-backed throttling to recovery initiation, challenge verification and failed challenge attempts.
- Challenge values must be high entropy, single-use, booking-bound, expiry-bound and stored as a digest only.
- Use constant-work digest comparison for fixed-format digests and avoid distinguishable error responses.
- A challenge cannot authorize status reads, payment upload, cancellation, or any other action. It can only complete the single credential-rotation transaction for which it was issued.
- Never accept a challenge or reset request based only on a booking reference, phone number, guest name, property or dates.
- If the administrator session is stale or the admin authorization check fails, deny the operation and require fresh authentication.
- If the database, limiter, or audit write is unavailable, fail closed; do not issue a challenge or activate a new credential.

## 7. Required tests before implementation

| ID | Scenario | Expected result |
|---|---|---|
| AR-01 | Authenticated main admin performs in-person verification and opens recovery | One transaction created; old credential revoked; challenge digest only stored |
| AR-02 | Owner attempts to open recovery | Denied; no mutation |
| AR-03 | Non-admin authenticated user attempts recovery | Denied; no mutation |
| AR-04 | Anon attempts recovery | Denied; no mutation |
| AR-05 | Admin tries to recover using only reference, phone, name or dates | Denied; no challenge |
| AR-06 | Identity-document displayed name does not match booking guest | Denied; no challenge |
| AR-07 | Valid challenge is scanned by guest device and new digest submitted | New credential activated; challenge consumed; old credential remains revoked |
| AR-08 | Raw new secret is submitted to the server | Rejected; API contract accepts digest only |
| AR-09 | Challenge is expired, malformed, unknown or already consumed | Generic denial; no credential change |
| AR-10 | Same challenge is submitted concurrently | At most one rotation succeeds |
| AR-11 | Two administrators/recovery attempts race | One active recovery transaction only |
| AR-12 | Challenge is replayed against another booking | Denied; no cross-booking mutation |
| AR-13 | Challenge expires or guest abandons after Stage A | Old secret remains revoked; new in-person verification required |
| AR-14 | Database, limiter or audit write fails | Fail closed; no partial credential rotation |
| AR-15 | Audit event is inspected | Contains actor, timestamps, method and outcome; no secrets or identity-document data |
| AR-16 | Recovery is completed | Booking dates, payment, cancellation, refund, owner and status fields remain unchanged |
| AR-17 | Guest reloads after replacement secret is generated and then lost | No server-side secret recovery; repeat in-person process |
| AR-18 | Existing registered traveler resets account credentials | Existing account recovery path is unaffected |

## 8. Decisions still required before implementation

The following must be explicitly approved or specified before code is written:

1. Whether the platform can operate a real, designated in-person verification point during the first release. If not, this recovery feature must remain unavailable; do not substitute weak remote checks.
2. The exact challenge expiry and cleanup policy.
3. Recovery rate-limit thresholds, temporary hold behavior and administrator notification/audit review.
4. The final legal/privacy review of visually checking an identity document without retaining its data.
5. The exact admin UI and guest QR handoff, including accessibility and a safe fallback if the guest device cannot scan QR.
6. The final private-schema tables, RPC signatures, Edge Function request/response DTOs and transaction semantics.

## 9. Release gate

This proposal is not an approved operational policy and is not implemented. Guest booking remains disabled until the user approves the recovery policy, the in-person verification capability is confirmed, the complete private-schema and Edge Function design is reviewed, and all tests pass in an isolated environment.

No Supabase migration, SQL, Storage change, Edge Function deployment, secret configuration, or frontend activation was performed while preparing this proposal.
