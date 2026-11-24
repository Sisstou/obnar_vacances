# OBNAR VACANCES — Guest Credential, Rate-Limit and Privacy Security Design

**Status:** design/review artifact only — NOT deployed  
**Branch:** pwa-foundation  
**Date:** 24 November 2026

## 1. Scope and hard boundaries

This document closes design gaps around guest booking credentials, enumeration resistance, abuse throttling, expiry, revocation and privacy. It does not create or apply SQL, deploy Edge Functions, configure secrets, alter Storage, or enable guest UI.

The registered-traveler flow remains unchanged. Guest access remains server-mediated through HTTPS Edge Functions. No anonymous Data API or Storage access is introduced.

## 2. Credential model

### 2.1 Independent reference and client-generated secret

Generate two independent values using cryptographically secure randomness:

- **Booking reference:** generated server-side with at least 128 bits of randomness, encoded as a human-readable opaque identifier. It is a locator, not an authenticator.
- **Access secret:** generated in the browser before the first create request using Web Crypto; 32 random bytes (256 bits), Base64URL encoded as 43 characters. It is the authentication factor.
- **Idempotency key:** generated separately in the browser using Web Crypto with high entropy. It prevents duplicate creation for a repeated logical request; it is not an authentication factor and must never authorize booking reads or mutations.

Do not derive any value from another, from booking ID, timestamp, phone number, property ID, or sequential database values. Do not use a timestamp-derived UUID as the guest secret.

The browser keeps plaintext access secret only in page memory. It sends the SHA-256 digest of that secret and the idempotency key to the Edge Function over HTTPS POST. The idempotency key may be retained in sessionStorage for same-tab retry continuity; the access secret must never be written to browser storage.

The database stores:
- a unique server-generated booking reference;
- only the SHA-256 digest of the client-generated access secret (one consistent representation, preferably 32-byte bytea or 64 lowercase hex);
- a digest of the idempotency key and a canonical request fingerprint, under a bounded expiry policy;
- credential expiry and revocation timestamps.

A same-key retry with the identical canonical request fingerprint returns the original booking reference and does not create a second booking. The browser still needs the original secret in page memory to authenticate. A same key with a different fingerprint is rejected. If the response is lost and the page reloads/closes, the secret is not recoverable; do not retrieve, reconstruct or encrypt-escrow it. Use the separately approved administrator-assisted reissue process, after a strong verification procedure is defined.

### 2.2 Handling rules

- Never place the secret or idempotency key in a URL, query string, route parameter, analytics event, crash report, application log, notification, or database history.
- Do not persist the access secret in localStorage, sessionStorage, IndexedDB, cookies, or service-worker caches. Keep it only in transient page memory and clear it when the guest leaves the flow or explicitly ends access.
- The idempotency key may be kept in sessionStorage only to support same-tab retry continuity; it is not accepted by any guest status or mutation endpoint.
- Use HTTPS and POST request bodies. Apply request-size limits and strict JSON/multipart parsing.
- Redact credential fields at the Edge Function logging boundary before logging errors or request metadata.
- Never return the stored hash, internal booking UUID, guest phone, owner private contact details, or internal review notes from guest endpoints.

A reference alone, secret alone, malformed pair, unknown reference, wrong secret, expired credential and revoked credential must all produce the same public failure status and response shape.

## 3. Authorization and timing

1. Validate input types and exact credential formats before database access.
2. Apply coarse endpoint throttling before credential lookup.
3. Apply keyed-digest throttling for the normalized reference and, where appropriate, a separately keyed contact digest during creation.
4. Resolve the reference and compare the supplied secret digest using a fixed-format constant-time comparison.
5. Re-check expiry, revocation, booking identity and action-specific state inside the same controlled database operation that performs a mutation.
6. Return an allowlisted projection only; never serialize a raw booking row.

Do not rely on application-side checks followed by an unprotected later update. Cancellation and receipt attachment must lock/re-check the relevant booking and state transactionally.

The system must not reveal whether a reference exists. Avoid materially different response timing for unknown references and incorrect secrets where practical; use a dummy fixed-format digest comparison for the unknown-reference branch.

## 4. Rate limiting — required design

### 4.1 Persistence and atomicity

In-memory counters inside an Edge Function are insufficient: requests can reach different isolates and instances, and restarts reset the counters.

Use a database-backed atomic limiter. A proposed internal table shape is:

- scope — bounded endpoint/action identifier;
- key_digest — keyed HMAC digest, not raw reference, phone, or IP;
- window_started_at — fixed window boundary;
- request_count — nonnegative counter;
- blocked_until — optional timestamp;
- expires_at — cleanup timestamp.

The key should be a versioned HMAC digest generated server-side with a dedicated secret, so the database does not retain raw contact values or easily reversible plain hashes. Use domain separation per purpose (for example, distinct prefixes for reference, contact and network-source keys). Keep the HMAC secret only in Edge Function secrets; never send it to the browser.

The increment/check must be one atomic database operation (for example, a transaction with row locking or a carefully designed upsert). Concurrent attempts must not bypass the threshold. The routine returns only allow/deny and retry timing; it must not disclose counters or key digests.

### 4.2 Rate-limit dimensions

Use layered limits rather than a single IP-only rule:

- endpoint-wide coarse limits to protect expensive functions;
- per-reference digest limits for status, cancellation and receipt operations;
- per-contact digest limits for guest booking creation to reduce repeated automated submissions;
- network-source limits only if the Edge platform provides a verified client network identity that cannot be spoofed by caller-controlled forwarding headers.

Do not trust arbitrary X-Forwarded-For, Forwarded, or client-supplied IP fields. If trusted network identity cannot be established from documented platform metadata, omit the IP dimension rather than treating an untrusted header as authoritative. Shared NATs mean IP limits must not be the sole protection.

Do not let a caller reset a counter by changing letter case or formatting: normalize references and phone values before deriving the keyed digest.

### 4.3 Thresholds and operations

Exact thresholds, window lengths and block durations remain configuration decisions. They must be conservative enough to limit guessing while allowing ordinary users on shared networks. Do not hard-code arbitrary thresholds in this design document.

Before release, define and test separate limits for:
- booking creation;
- credential verification/status polling;
- cancellation requests;
- receipt uploads, including upload byte limits.

Add bounded retention and scheduled cleanup for expired limiter rows. Cleanup must never remove active blocks prematurely. Ensure the cleanup mechanism has bounded work and does not require a paid service.

The limiter must fail closed for credential-guessing and state-changing guest endpoints if its backing store is unavailable. For non-sensitive status polling, product behavior may choose a short controlled outage response, but must never bypass throttling.

## 5. Credential expiry, revocation and rotation

- A credential must not expire while the booking is still active or a cancellation/refund/payment review remains unresolved.
- The final expiry period after the booking lifecycle is not yet specified. It must be selected through an explicit data-retention decision that considers support, dispute and privacy needs. Do not invent a retention duration in code.
- Revocation must take effect immediately and be checked on every guest endpoint.
- Any secret rotation must invalidate the previous secret atomically; do not allow two active secrets unless a separately reviewed recovery design explicitly requires it.
- Do not offer weak self-service recovery based only on booking reference, phone number, dates, or guest name. A lost secret requires a separately approved support/identity-verification procedure.
- Deletion or anonymization of guest personal data must follow an approved retention policy and preserve legally/operationally necessary booking and financial records without retaining unnecessary contact data.

## 6. Guest creation abuse controls

The create endpoint must:
- validate bounded name and normalized phone inputs;
- reject malformed dates, unreasonable booking horizons and invalid guest counts before expensive operations;
- calculate availability, capacity, price, commission, deposit and owner identity server-side;
- apply creation throttles before database booking work;
- preserve the existing property advisory lock and both exclusion constraints;
- create booking, reference, client-supplied secret digest, idempotency record and expiry in one transaction;
- accept only the browser-generated SHA-256 secret digest in its strict 64-character lowercase-hex format; never accept a raw access secret from the browser;
- never accept caller-supplied traveler ID, owner ID, price, commission, status, reference, or Storage path.

Avoid storing contact data in rate-limit rows or logs. A keyed digest can support abuse controls without copying raw phone numbers into another table.

## 7. Guest status response allowlist

The response may include only the minimum information needed to follow the guest's own reservation, such as:
- booking reference;
- property display name and public location/address fields already intended for travelers;
- check-in/check-out dates and guest count;
- booking status and guest-safe status explanation;
- payment status, amount due/paid and due date where relevant;
- cancellation request state and next guest action;
- receipt-submission state.

The exact response schema must be reviewed against the current frontend and public-property fields. Exclude:
- internal booking/property UUIDs unless strictly needed internally (prefer not to return them);
- guest secret or hash;
- guest phone except where a masked display is demonstrably necessary;
- owner private phone/email;
- other traveler or guest information;
- admin notes, internal fraud/rate-limit flags, raw SQL errors, and storage object paths.

Use explicit response DTOs; do not return select * or raw database records.

## 8. Receipt upload and retrieval boundary

- The Edge Function verifies reference + secret and current payment state before accepting a file.
- Enforce the existing 5 MiB maximum and JPEG/PNG/WebP/PDF allowlist; validate file signatures, not only browser MIME metadata or filename extension.
- Generate the object path on the server, for example guest/<booking_id>/<random-object-id>.<validated-extension>. Reject any caller-supplied path.
- Upload only to the existing private payment-receipts bucket using a server-only credential.
- Attach the object to the booking through a private routine that rechecks authorization and payment state transactionally.
- For owner/admin retrieval, prefer a server endpoint that checks the caller's authenticated owner/admin relationship and returns a short-lived signed URL. Do not add broad guest Storage policies or public URLs.
- Keep the registered-traveler upload and read policies unchanged.

## 9. Required adversarial tests

| Test | Required result |
|---|---|
| Reference only | Generic denial; no booking fields |
| Secret only | Generic denial; no booking fields |
| Unknown reference + syntactically valid secret | Same public failure shape as wrong secret |
| Wrong secret | Generic denial; no booking fields |
| Expired or revoked secret | Generic denial; no booking fields |
| Concurrent guesses against one reference | Atomic limiter enforces the configured threshold |
| Same phone with formatting variations | Normalizes to the same contact throttle key |
| Spoofed forwarding headers | Cannot reset or evade trusted network limits |
| Edge Function cold start / second instance | Existing limiter state remains effective |
| Limiter database unavailable | Sensitive guest operations fail closed |
| Secret in URL/log/analytics/error | Automated test or log inspection finds none |
| Secret rotation | Old secret immediately fails; new secret works |
| Booking still under review | Credential remains usable until the approved lifecycle end |
| Guest status response | Contains only explicitly allowlisted fields |
| Caller-supplied Storage path | Rejected; server-generated path used |
| Unrelated owner/admin | Cannot obtain receipt URL |
| Signed URL expiry | URL stops working after configured short lifetime |

## 10. Decisions still required before implementation

1. Final post-booking credential expiry/retention period.
2. Exact per-endpoint rate-limit thresholds, windows and temporary block durations.
3. Documented trusted network-identity source, if an IP-based dimension is to be used.
4. Strong support identity-verification evidence, administrator authorization, reissue RPC semantics and audit trail for lost credentials; see the proposed in-person-only flow in [GUEST_BOOKING_ADMIN_ASSISTED_CREDENTIAL_REISSUE_DESIGN_2026-11-24.md](GUEST_BOOKING_ADMIN_ASSISTED_CREDENTIAL_REISSUE_DESIGN_2026-11-24.md).
5. Idempotency-key expiry/cleanup, canonical request fingerprint fields and behavior for different keys with identical booking inputs.
6. Final guest status response DTO and owner/admin signed-URL endpoint contract.
7. Verified database connectivity/grant model for calling private routines and atomic limiter operations from Edge Functions.

These are implementation gates, not reasons to weaken the credential model.

## 11. Approved retry design direction — 24 November 2026

Option A is approved: client-generated access secret, digest-only persistence, same-key idempotent retry, and administrator-assisted reissue if the secret is lost. No encrypted secret escrow is permitted. The idempotency key is not guest authentication. The support verification procedure and operational parameters listed above remain release gates.

## 12. Release gate

Guest booking remains disabled until the schema migration, private database routines, atomic limiter, Edge Functions, receipt retrieval path, adversarial tests and registered-user regression tests are reviewed and verified in staging. A separate explicit user approval is required before applying any staging migration; production requires separate approval.

No database or Storage change, secret configuration, Edge Function deployment, or frontend activation was performed while preparing this document.
