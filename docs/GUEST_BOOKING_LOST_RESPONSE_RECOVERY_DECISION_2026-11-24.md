# OBNAR VACANCES — Guest Lost-Response Recovery Decision Review

**Date:** 24 November 2026  
**Branch:** `pwa-foundation`  
**Status:** Option A approved as the design direction; support/reissue procedure remains to be specified; no implementation  
**Scope:** prevent duplicate guest bookings and handle a committed booking whose creation response is lost.

## 1. The exact failure

The proposed flow creates a booking and stores only a digest of a 256-bit guest access secret. The Edge Function returns the plaintext secret only after the database transaction commits.

A failure can occur after commit but before the browser receives the response. In that case:

- the booking exists;
- the database has no plaintext secret to return;
- a blind retry may create a second booking unless the request is idempotent;
- the guest may have neither the booking reference nor the access secret;
- reference, name, phone, property and dates alone are not sufficient proof to disclose or reset access.

This is a release blocker. Do not solve it by storing plaintext, exposing a lookup endpoint, or treating public booking details as authentication.

## 2. Requirements shared by every option

1. The booking and its guest credential record are committed atomically.
2. A retry of the same logical create request must not create a second booking.
3. A reused idempotency key with a different request payload must be rejected.
4. Idempotency keys and recovery capabilities are sensitive: never put them in URLs, logs, analytics or error reports.
5. No guest Data API table access or direct guest Storage access is introduced.
6. The registered-traveler flow and `create_booking()` remain unchanged.
7. No SMS/OTP dependency is assumed.
8. A lost or expired recovery capability must not be bypassed using booking reference, phone, name or dates alone.
9. Any recovery mechanism must have bounded lifetime, atomic use/replay semantics, rate limiting and audit-safe handling.
10. No implementation, migration or deployment is authorized by this review.

## 3. Option A — Client-generated secret, server-stored digest, idempotent replay

### Protocol

- Before the first request, the browser generates a 32-byte access secret and a separate high-entropy idempotency key using Web Crypto.
- The browser keeps the access secret only in page memory. It may retain the idempotency key in `sessionStorage` for retry continuity in the same tab; the idempotency key is not accepted as guest booking authentication.
- The browser sends the secret digest and idempotency key to the Edge Function over HTTPS POST.
- The server stores the secret digest and a digest of the idempotency key, together with a canonical request fingerprint and the created booking reference.
- A retry with the same idempotency key and same request fingerprint returns the same booking reference and a replay outcome; it never creates another booking. The client still has to possess the original secret in memory to access the booking.
- A retry with the same key but a different request fingerprint is rejected.
- If the page reloads or closes and the in-memory secret is lost, the server cannot reconstruct it. The guest must use a separately approved support/reissue process.

### Advantages

- No recoverable secret is stored server-side.
- The server stores only digests.
- A same-tab retry can safely recover the original reference without creating a duplicate.
- No SMS or email provider is required.

### Limitations

- If the page reloads after the response is lost, the secret is gone even if the idempotency key survives in `sessionStorage`.
- If browser storage is cleared, the idempotency key is lost and a newly generated key cannot prove that a prior request was the same logical attempt.
- This option reduces duplicate risk for retries that reuse the same key; it cannot guarantee deduplication after all client-side attempt state is lost.
- A support/reissue process is still required for lost secrets.

## 4. Option B — Short-lived encrypted response escrow

### Protocol

- The browser generates and retains a high-entropy idempotency key for the pending create operation; it is not the guest's booking authentication secret.
- The server creates the booking and guest secret in one transaction.
- In addition to the irreversible secret digest, the server stores a short-lived authenticated-encryption ciphertext of the secret in a tightly restricted private record. The encryption key exists only in Edge Function secrets, never in Postgres or the browser.
- The idempotency record binds the ciphertext to the booking ID, idempotency-key digest, canonical request fingerprint, creation timestamp and expiry using authenticated associated data.
- If the first response is lost, the same idempotency key and same request fingerprint may replay the original response within a short approved window. The Edge Function decrypts the secret transiently and returns the same reference/secret; it does not mint a second booking.
- The replay must be atomic and rate-limited. The ciphertext is deleted or rendered unusable after the replay window, while the irreversible digest remains for normal guest authentication.
- A mismatched key or payload receives a generic failure. The endpoint must not become a general credential-retrieval API.

### Advantages

- Supports reliable replay after a network interruption or page reload, provided the idempotency key remains available.
- Avoids storing plaintext secret.
- Preserves same-secret/same-booking semantics and prevents duplicate creation for the same idempotency key.

### Risks and costs

- The secret becomes recoverable by the server during the short replay window. This is a material change from the current strict digest-only design.
- Compromise of the Edge Function encryption key plus access to ciphertext could expose credentials within the replay window.
- Requires key rotation/versioning, authenticated encryption, strict access grants, expiry cleanup, replay limits, and tests for concurrent replay and deletion.
- The idempotency key itself becomes a sensitive recovery capability and must be protected in the browser and server.
- This is more complex than Option A and requires a dedicated threat-model review.

### Minimum safeguards if selected

- Use a modern AEAD construction (for example AES-256-GCM) with a unique nonce per ciphertext.
- Keep the encryption key only in Edge Function secrets; version it for rotation.
- Bind booking ID, idempotency record ID and expiry as authenticated associated data.
- Never log key, plaintext, ciphertext, nonce, digest or full request body.
- Limit replay to the same idempotency key and exact canonical payload.
- Enforce a short, explicit replay window; do not choose a duration silently.
- Delete ciphertext after expiry or successful finalization according to the approved replay contract.
- Keep the ordinary guest secret hash as the only long-lived authentication verifier.

## 5. Option C — No automatic secret replay; support-assisted reissue

### Protocol

- Keep the current digest-only credential model and do not persist the secret or an encrypted copy.
- Use a server-side idempotency key to prevent a same-key retry from creating another booking.
- If the response is lost and the secret cannot be recovered, show a generic “request may have been received” result and direct the guest to a documented support channel.
- A trained administrator follows a separately approved verification procedure before revoking the inaccessible credential and issuing a new one-time secret.
- Every reissue is rate-limited and audited without recording the secret.

### Advantages

- Preserves the strictest form of digest-only credential storage.
- Avoids an encrypted secret vault and its key-management risks.
- No SMS/OTP dependency is required.

### Limitations

- Recovery is manual and slower.
- Without a reliable identity-verification channel, support may be unable to distinguish the real guest from someone who knows public booking details.
- A safe verification process, administrator permissions, reissue RPC and audit trail still need to be designed.
- The guest experience is weaker during support hours or when support cannot verify the requester.

## 6. Comparison

| Criterion | Option A: client secret | Option B: encrypted escrow | Option C: support reissue |
|---|---|---|---|
| Plaintext secret stored in DB | No | No; encrypted ciphertext only | No |
| Server can replay original secret | No | Yes, only within approved window | No |
| Same-key duplicate prevention | Yes | Yes | Yes |
| Survives page reload | Reference/idempotency only; secret may be lost | Yes, while recovery key remains and window is open | No automatic recovery |
| Server key-management complexity | Low | High | Low to medium |
| Manual support needed | For lost secret | After replay window/key loss | Always for lost secret |
| Main trade-off | Lowest recoverability | Better recovery, larger server compromise impact | Strong storage model, weaker UX |

## 7. Approved decision

**The user approved Option A as the guest credential/retry design direction on 24 November 2026.** The approved direction is:

- The browser generates a 32-byte access secret and a separate high-entropy idempotency key using Web Crypto before the first create request.
- The plaintext access secret remains only in page memory. It is never written to localStorage, sessionStorage, IndexedDB, cookies, service-worker caches, URLs, logs or analytics.
- The browser sends the access-secret digest and idempotency key over HTTPS POST. The server stores only the secret digest, an idempotency-key digest and a canonical request fingerprint.
- The idempotency key may be retained in sessionStorage for same-tab retry continuity; it is not a booking authentication credential and cannot read or mutate a booking.
- A retry with the same idempotency key and identical canonical payload returns the original booking reference and never creates another booking. A key reused with a different payload is rejected.
- If the page reloads/closes and the access secret is lost, the server must not reconstruct it. A separate administrator-assisted reissue process is required after strong, documented verification and revocation of the old credential.
- Option B encrypted escrow is not selected. Do not store a recoverable encrypted copy of the access secret.

### Explicitly not yet decided

The approval selects the security direction, not every operational parameter. Before implementation, specify and review: idempotency-key expiry and cleanup; canonical request fingerprint fields; handling of different idempotency keys with identical booking inputs; support identity-verification evidence; administrator authorization and audit; reissue transaction semantics; and guest-facing failure wording. Do not invent these values or procedures in code.

The administrator recovery process must not accept booking reference, phone, name, property or dates alone as proof. If adequate verification cannot be established, do not reissue the credential.

## 8. Required tests before implementation

## 8. Required tests before implementation

- Same idempotency key + same canonical payload, sequential retry: one booking only.
- Same idempotency key + same payload, concurrent retry: one booking only.
- Same idempotency key + different payload: generic conflict; no second booking.
- Different idempotency keys + identical payload: behavior follows a separately approved duplicate-submission policy; do not silently merge two intentional bookings.
- Transaction rollback: no booking, idempotency record or credential escrow remains.
- Commit succeeds, response lost, retry arrives: behavior matches the selected option.
- Idempotency key malformed, expired, reused or guessed: no credential disclosure.
- Rate limit applies atomically to replay attempts.
- No secret, idempotency key, digest or ciphertext appears in logs, analytics, URLs or public DTOs.
- For approved Option A: same-tab retry, page reload, tab close, cleared session storage and browser restart behavior are explicitly tested; no retry creates a duplicate.
- For the approved support fallback: verification failure never discloses or reissues credentials; successful reissue requires administrator authorization, immediate old-secret revocation, one-time new-secret delivery and a sanitized audit trail.
- Verify no encrypted or plaintext copy of the original access secret is persisted.
- Existing registered booking and cancellation/payment regression suites continue to pass.

## 9. Current disposition

- Lost-response failure analyzed.
- Three recovery patterns documented.
- Option A approved as the design direction; administrator-assisted recovery is required but its verification procedure remains an implementation gate.
- No SQL or Edge Function implementation produced; approval is for design direction only.
- No database, Storage, secrets or deployment changed.
- Guest UI remains disabled.
- Staging migration and production changes still require separate explicit approvals.
