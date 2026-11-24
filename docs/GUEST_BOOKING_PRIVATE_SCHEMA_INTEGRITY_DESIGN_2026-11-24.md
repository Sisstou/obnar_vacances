# OBNAR VACANCES — Private Guest Credential Registry and Commit-Time Integrity Design

**Date:** 24 November 2026  
**Branch:** `pwa-foundation`  
**Status:** design artifact only — NOT a migration; NOT executed  
**Target reviewed:** staging project `rhxeclddohpwtpzkruzm`

## 1. Decision

The guest credential registry must not live in `public`. The current draft at `docs/sql-drafts/GUEST_BOOKING_SCHEMA_DRAFT_NOT_FOR_EXECUTION.sql` creates `public.guest_booking_access`; that placement is rejected.

The recommended design is:

- Create a dedicated `private` schema as part of a future coordinated migration.
- Keep `private` out of the Supabase Data API exposed-schema list.
- Keep the credential registry and internal rate-limit tables in `private`.
- Do not grant `USAGE` on `private`, or table privileges, to `anon`, `authenticated`, or `service_role` unless a later reviewed requirement proves it necessary. The Edge Functions must not query the registry directly through PostgREST.
- Let Edge Functions call narrowly scoped functions in `public` using the server-only service-role client. Those public wrappers must have `EXECUTE` revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `service_role`. They must be `SECURITY DEFINER` only where required to access private objects, have a fixed safe `search_path`, use fully qualified object names, and validate all inputs and state transactionally.
- The registry table must have RLS enabled as defense in depth, with no API-role policies and no direct API-role grants.
- Implement a deferred, bidirectional booking/credential integrity invariant before guest booking can be enabled.

This is a proposed architecture, not proof that the final SQL or wrappers are already implemented.

## 2. Read-only staging findings (24 November 2026)

The following were checked using read-only SQL against staging:

| Check | Observed result |
|---|---|
| `private` schema exists | No |
| `anon` has USAGE on `public` | Yes |
| `authenticated` has USAGE on `public` | Yes |
| `service_role` has USAGE on `public` | Yes |
| `anon`, `authenticated`, `service_role` have CREATE on `public` | No |
| `pgrst.db_schemas` visible through `current_setting` | NULL |
| `pgrst.db_extra_search_path` visible through `current_setting` | NULL |
| `pgrst.db_anon_role` visible through `current_setting` | NULL |

The NULL settings do **not** prove which schemas are exposed by the hosted Data API. The exact exposed-schema configuration must be checked in the Supabase Dashboard before release. SQL introspection from the current session was insufficient.

The absence of `private` means the future migration must create it. No schema, table, grant, policy, function, trigger, or other database object was changed during this review.

## 3. Registry table shape

The future private registry should contain only the minimum fields:

- `booking_id`: primary key and FK to `public.bookings(id)`, with `ON DELETE CASCADE`;
- `booking_reference`: unique opaque locator, independently generated with at least 128 bits of cryptographic randomness;
- `secret_hash`: digest of the 32-byte random access secret; never store plaintext;
- `expires_at`, `revoked_at`, and `created_at`.

Do not keep per-credential `failed_attempts` or `locked_until` columns as the main limiter. The credential design already requires a shared, database-backed atomic rate limiter keyed by server-generated HMAC digests. A per-row counter is insufficient for endpoint-wide and contact-based limits and creates inconsistent competing throttling models.

The booking reference is not an authenticator. The access secret is the authentication factor. Generate them independently. The secret is returned once only after the booking transaction commits; it must not appear in URLs, logs, analytics, notifications, database history, or persistent browser storage.

Use an explicit, reviewed reference format with sufficient entropy. The current draft's 8–16 character alphanumeric check is not an adequate specification of the required 128-bit entropy and must be replaced by a format that matches the chosen cryptographic encoding.

## 4. Schema and privilege boundary

The future migration should create `private` with a non-public owner and explicit ACLs. The migration must not add `private` to the Data API exposed schemas.

Required properties:

1. `private` is not exposed through PostgREST or GraphQL.
2. `anon`, `authenticated`, and `service_role` cannot directly select, insert, update, delete, or enumerate the credential registry.
3. RLS is enabled on private tables even though the schema is unexposed.
4. No broad default privileges silently grant API roles access to new private objects.
5. Internal routines use fully qualified names such as `private.guest_booking_access`; no reliance on caller-controlled search paths.
6. Only explicitly reviewed server-only wrappers are callable by `service_role`; no guest-facing function is executable by `anon` or `authenticated`.
7. The `service_role` key remains exclusively in Edge Function/server configuration and is never sent to the browser.

A public-schema wrapper is an API surface even if it is intended only for server use. Therefore its function ACL is a hard boundary, not a documentation convention. Revoke default `PUBLIC` execution explicitly for every wrapper signature and grant only the exact role that must call it. Review the resulting effective ACL, not only the explicit grants.

The public wrapper must not return a registry row, secret hash, raw booking row, internal UUID, limiter key, or internal error. Return only a narrow result needed by the Edge Function.

## 5. Bidirectional commit-time integrity invariant

The invariant is:

- Every booking with `traveler_id IS NULL` must have exactly one credential-registry row at transaction commit.
- Every credential-registry row must reference an existing booking whose `traveler_id IS NULL`.
- A registered booking (`traveler_id IS NOT NULL`) must have no guest credential row.
- Deleting a booking and its cascading credential row in the same transaction is allowed.
- A guest booking must not be converted into a registered booking by simply setting `traveler_id`; a future conversion/recovery flow would need a separate atomic and reviewed operation.

A primary key on registry `booking_id` guarantees at most one credential row per booking. A deferred constraint trigger is needed to enforce the other direction and the existence condition at commit.

### Proposed trigger coverage

Use two `AFTER ROW` constraint triggers, both `DEFERRABLE INITIALLY DEFERRED`:

1. On `public.bookings`: after INSERT, UPDATE of `traveler_id`, and DELETE.
2. On `private.guest_booking_access`: after INSERT, UPDATE of `booking_id` if that column is mutable, and DELETE.

Both triggers call one private assertion routine. For each affected booking ID (the NEW ID for insert/update, OLD ID for delete), the routine queries the final transaction-visible state:

- If the booking no longer exists, the registry row must also no longer exist. This permits the FK cascade when a booking is deleted.
- If the booking exists and `traveler_id IS NULL`, exactly one registry row must exist.
- If the booking exists and `traveler_id IS NOT NULL`, zero registry rows must exist.

If any condition fails, raise a constraint violation so the whole transaction rolls back.

The routine must handle OLD and NEW IDs if a key update is ever allowed. Prefer making registry `booking_id` immutable and not granting arbitrary UPDATE access. The trigger function must use a fixed `search_path`, fully qualified relation names, and a narrowly owned execution context. If `SECURITY DEFINER` is required for the trigger to inspect the private registry under restricted table ACLs, document that reason and revoke direct EXECUTE from API roles; trigger invocation itself must not create a public callable endpoint.

### Transaction contract

Guest creation must insert the booking and credential row in one database transaction. The deferred checks run at commit, after both rows have been written. If either insert fails, or if the transaction attempts to commit with only one side present, the entire transaction must roll back.

Registered booking creation remains unchanged: it writes a non-NULL `traveler_id` and no credential row, so the invariant passes.

The constraint triggers must be tested for:
- successful guest booking insert pair;
- guest booking inserted without a credential;
- credential inserted without a guest booking;
- credential attached to a registered booking;
- guest booking changed to a registered traveler while the credential remains;
- credential deletion while the guest booking remains;
- booking deletion with FK cascade;
- rollback after an intermediate insert failure;
- two concurrent guest booking attempts for overlapping dates.

## 6. Rate-limit table separation

The credential registry is not the rate limiter. A separate private table should persist atomic throttling state using:

- bounded endpoint/action scope;
- HMAC-derived key digest, never raw phone, raw reference, or untrusted IP;
- window start and request count;
- optional block-until timestamp;
- expiry/cleanup timestamp.

The HMAC secret belongs only in Edge Function secrets. Normalize reference/contact values before deriving purpose-separated digests. The increment/check operation must be atomic and fail closed for credential-guessing and state-changing guest endpoints if the limiter is unavailable.

Do not trust arbitrary caller-provided `X-Forwarded-For`, `Forwarded`, or IP fields. Only use network-source limits if a documented platform-provided client identity is verified. Exact thresholds and retention windows remain explicit product/security decisions and must not be invented in this schema design.

## 7. Edge Function access pattern

Expected call sequence:

1. Guest submits reference + secret to an HTTPS Edge Function in a POST body.
2. Edge Function validates payload shape and applies coarse throttling.
3. Edge Function derives HMAC throttle keys using server-held secrets.
4. Edge Function calls a server-only public RPC wrapper using its server-side service-role client.
5. The wrapper checks the credential digest, expiry/revocation and requested booking state transactionally, using the private registry.
6. The wrapper returns only a minimal allowlisted result.
7. Edge Function returns a guest-safe DTO; it never forwards database rows or internal errors.

For mutations (cancellation request, receipt attachment, secret revocation), authorization and state re-check must occur in the same transaction as the mutation. Do not perform an application-side read followed by an unprotected later write.

No browser client may call the service-only wrappers. No service-role credential may be bundled into the static site or PWA.

## 8. Release gates

Before any executable migration is prepared:

- Confirm the exact Data API exposed-schema list in the Dashboard.
- Review all default privileges for the migration owner and future objects.
- Design the private schema owner and exact ACLs.
- Implement the private registry and separate atomic limiter.
- Implement and review the deferred bidirectional constraint triggers.
- Implement narrowly scoped service-role wrappers and inspect effective EXECUTE ACLs.
- Verify the Edge Function uses service-role credentials only server-side.
- Test the invariant and all guest workflows in a disposable local/isolated environment.
- Run registered-user regression tests.
- Run Security Advisor and inspect every new finding.
- Obtain explicit approval before staging migration. Production requires a separate approval.

The existing SQL draft must remain labelled **NOT FOR EXECUTION** until all coordinated database routines, triggers, Edge Functions, receipt access and tests are complete.

## 9. Current status

No staging or production database changes were made. No Edge Functions were deployed. No secrets or Storage policies were changed. Guest booking remains disabled.

## 10. References

- Supabase custom schemas: https://supabase.com/docs/guides/api/using-custom-schemas
- Supabase API security and grants/RLS: https://supabase.com/docs/guides/api/securing-your-api
- Supabase Security Advisor: https://supabase.com/docs/guides/observability/advisors
- Supabase changelog: https://supabase.com/changelog?types=breaking-change

Relevant current platform note: Supabase announced that new tables would stop being automatically exposed through the Data and GraphQL APIs, with enforcement across projects from 30 October 2026. This does not remove the need to inspect effective grants and the Dashboard's exposed-schema configuration; never infer safety from automatic-exposure defaults alone.


## 11. Existing staging trigger and constraint compatibility audit

A read-only catalog inspection was run after this design was committed. The relevant existing objects are:

### Existing booking triggers

- `bookings_require_verified_payment`: BEFORE INSERT OR UPDATE OF status, payment_status, deposit_amount, payment_receipt_path, payment_verified_at.
- `guard_test_booking_mutation`: BEFORE DELETE OR UPDATE.
- `sync_property_public_booking_dates`: AFTER INSERT OR DELETE OR UPDATE.
- `trg_notify_new_booking`: AFTER INSERT.

### Existing cancellation triggers

- `guard_test_booking_cancellation_mutation`: BEFORE INSERT OR DELETE OR UPDATE.
- `trg_notify_booking_cancellation`: AFTER INSERT.
- `protect_cancellation_history`: BEFORE UPDATE OR DELETE on history.

### Existing relevant constraints

- `bookings.traveler_id` references `profiles(id)`; it is not a direct FK to `auth.users`.
- Booking primary key is `bookings_pkey`.
- Both `no_overlapping_bookings` and `no_overlapping_confirmed_bookings` are present. The first excludes overlaps for pending, awaiting_admin_approval, awaiting_payment and confirmed rows using half-open date ranges. Preserve both until a separate test-backed cleanup decision.
- `booking_cancellations.booking_id` is both an FK to bookings and UNIQUE, enforcing the existing first-release single cancellation lifecycle.
- Current cancellation role CHECK allows only traveler/owner.
- Current history actor role CHECK allows traveler/owner/admin/system; actor_id is an FK to auth.users and nullable.
- Booking checks still require valid dates, positive guest count, nonnegative prices, and verified payment for confirmed status.

### Compatibility consequences

1. The deferred integrity trigger must be additive and read-only with respect to the booking row; it must not interfere with the existing payment, test-booking, availability-sync or notification triggers.
2. Existing BEFORE triggers still run before the deferred commit-time assertion. Guest creation must therefore preserve their existing checks and transaction semantics.
3. The immediate `trg_notify_new_booking` remains a release blocker until its NULL-traveler path is patched: it currently inserts a traveler notification using `NEW.traveler_id`, while `notifications.user_id` is NOT NULL. The deferred integrity trigger does not fix this.
4. The availability-sync trigger runs on all booking updates and must be regression-tested when a new guest row is inserted or when booking state changes. Its previously audited logic does not depend on traveler_id; keep its implementation unchanged unless a test demonstrates otherwise.
5. Do not drop or weaken the existing booking exclusion constraints, test-booking guards, payment-confirmation guard, cancellation uniqueness, or history immutability trigger as part of the guest credential work.
6. Guest cancellation support still requires the coordinated requester-role and history-role constraint changes already identified in the schema draft, plus NULL-safe cancellation notifications and the reviewed owner/admin RPC changes.

This catalog review did not execute a write statement. It does not establish that the proposed deferred triggers have been implemented or tested; it only records the existing objects that the future migration must coexist with.
