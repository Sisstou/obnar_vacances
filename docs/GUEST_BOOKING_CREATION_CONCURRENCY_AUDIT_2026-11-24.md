# OBNAR VACANCES — Guest booking creation and concurrency audit

**Date:** 24 November 2026  
**Environment:** staging `rhxeclddohpwtpzkruzm`  
**Branch:** `pwa-foundation`  
**Scope:** read-only review of the registered booking RPC, booking columns, triggers and exclusion constraints. No database or Storage changes.

## 1. Live registered booking routine

The current `public.create_booking(uuid,date,date,integer)` definition was inspected directly on staging. It is a `SECURITY DEFINER` routine with fixed search path:

```sql
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
```

Its current sequence is:

1. Requires non-NULL `auth.uid()`.
2. Validates property ID, dates, future check-in, checkout after check-in, and positive guest count.
3. Reads property owner, nightly price, capacity and approval status under `FOR SHARE`.
4. Requires approved property, valid positive price/capacity, and guest count within capacity.
5. Prevents the owner from booking their own property.
6. Serializes attempts for the same property using:

```sql
PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_property_id::text, 0)
);
```

7. Checks overlapping active non-test bookings using half-open date overlap logic.
8. Calculates nights as `p_check_out - p_check_in`.
9. Calculates platform commission per night as 500 when owner price is below 6000, otherwise 300.
10. Stores owner price, commission, final nightly price, total price and status `pending`.
11. Returns the new booking UUID.

The registered-user routine must remain unchanged and authenticated-only.

## 2. Required guest creation parity

A separate server-only guest routine must mirror the business rules above, rather than call or weaken `create_booking`.

It must:
- Validate all inputs and approved property state.
- Read the same owner, price and capacity fields under the same locking discipline.
- Apply the same owner-self-booking prohibition where a guest has no account identity (the caller cannot be an authenticated property owner through the guest endpoint; the server must still reject invalid property state).
- Use the same property-scoped advisory transaction lock and the same date-overlap predicate.
- Use the same commission threshold and arithmetic without accepting client-supplied prices.
- Insert a booking with `traveler_id = NULL`, `is_test = false`, and the same initial status/payment defaults as the registered flow.
- Insert the guest access record in the same database transaction.
- Return the booking reference and one-time secret only after both rows have been committed successfully; store only the secret hash.
- Never return internal booking IDs, owner IDs, private notes, or other guest credentials through public status data.
- Be executable only by `service_role` or a narrowly scoped server-only role; never by `anon` or `authenticated`.

Do not create an alternative pricing or overlap implementation that can drift from the registered routine. Before implementation, factor shared calculation/validation into a private helper or keep a line-by-line parity test against the registered routine.

## 3. Live booking columns and triggers

The live `public.bookings` table has the following relevant properties:

- `traveler_id`: UUID, currently NOT NULL, FK to registered profile.
- `property_id`, `check_in`, `check_out`, `guests`, `total_price`, `status`: required.
- `payment_status`: required, default `unpaid`.
- `refund_status`: required, default `not_applicable`.
- `is_test`: required, default false.
- Price snapshots `owner_price_per_night`, `platform_commission_per_night`, and `final_price_per_night` are nullable at the column level, but the booking routine fills them.

The live triggers include:
- `bookings_require_verified_payment` — before insert or relevant updates.
- `guard_test_booking_mutation` — before update/delete.
- `sync_property_public_booking_dates` — after insert/delete/update.
- `trg_notify_new_booking` — after insert.

Consequences:
- Guest booking insertion will execute the existing `notify_new_booking()` trigger. It must be made NULL-safe before guest creation can be enabled.
- The payment-confirmation trigger must continue to enforce verified payment requirements for guest bookings too.
- Public date synchronization must remain independent of `traveler_id` and must not expose guest identity.
- Guest booking must not bypass the test-booking guard or any booking-state trigger.

## 4. Live exclusion constraints — important test-fixture finding

The staging definitions are:

```sql
no_overlapping_bookings:
EXCLUDE USING gist (
  property_id WITH =,
  daterange(check_in, check_out, '[)') WITH &&
)
WHERE (status IN (
  'pending',
  'awaiting_admin_approval',
  'awaiting_payment',
  'confirmed'
));

no_overlapping_confirmed_bookings:
EXCLUDE USING gist (
  property_id WITH =,
  daterange(check_in, check_out, '[)') WITH &&
)
WHERE (status = 'confirmed');
```

Neither exclusion constraint includes `is_test` in its predicate. Therefore, even a row marked `is_test = true` can conflict with a real booking if it uses the same property and overlapping dates while in an included status.

Test policy:
- Use dedicated test properties, not live properties.
- Do not create overlapping active fixtures on the same property.
- Never assume `is_test = true` exempts a fixture from exclusion constraints.
- Cleanup only the exact fixture IDs created by a test run, and only in a controlled test environment.

## 5. Credential integrity design requirement

The guest credential registry must be inaccessible to `anon` and `authenticated` at both privilege and RLS levels.

A database invariant is required so a booking with NULL `traveler_id` cannot be committed without exactly one corresponding guest credential record. The implementation must account for the fact that booking and credential rows are inserted in the same transaction.

Preferred implementation is a deferred constraint trigger or an equivalent transaction-safe design that validates the relationship at commit time. Validate both directions:
- A NULL-traveler booking must have a credential row.
- A credential row must reference a NULL-traveler booking.

The invariant must not reject registered bookings, and must handle cascaded deletion cleanly. Do not rely only on the Edge Function or frontend to maintain this relationship.

## 6. Blocking conditions before release

Guest booking remains blocked until all of the following are complete:
- A reviewed guest creation routine with pricing, capacity, date and concurrency parity.
- A transaction-safe booking/credential integrity invariant.
- NULL-safe notification triggers and RPCs.
- Guest status/cancellation endpoints with reference-plus-secret verification, expiry, revocation and rate limiting.
- Private receipt upload and an owner/admin-only retrieval path.
- Automated tests for concurrency, duplicate requests, invalid credentials, expiry, rate limits, cancellation and payment.
- Registered-user regression tests proving the existing authenticated booking flow remains unchanged.

## Release status

This was a read-only audit. No migration was applied, no Edge Function deployed, no Storage policy changed and no guest booking feature enabled. Staging and production changes remain separate explicit approval gates.
