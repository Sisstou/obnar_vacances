-- OBNAR VACANCES — Guest booking schema migration (DRAFT / NOT FOR EXECUTION)
-- Target: staging project rhxeclddohpwtpzkruzm
-- Branch: pwa-foundation
--
-- IMPORTANT:
-- This is the additive schema layer only. It is NOT a complete release migration.
-- Do not apply until the coordinated RPC/trigger replacement, Edge Functions,
-- receipt-access path, and regression suite are reviewed together.
-- No anonymous table access or anonymous RPC execution is introduced here.

begin;

-- 1) Allow registered bookings to keep their auth profile FK while permitting
--    NULL for guest bookings. Guest creation must be server-controlled only.
alter table public.bookings
  alter column traveler_id drop not null;

-- 2) Allow a guest cancellation to have no auth.users identity.
alter table public.booking_cancellations
  alter column requester_id drop not null;

alter table public.booking_cancellations
  drop constraint if exists booking_cancellations_requester_role_check;

alter table public.booking_cancellations
  add constraint booking_cancellations_requester_role_check
  check (requester_role = any (array['traveler'::text, 'owner'::text, 'guest'::text]));

-- Keep registered traveler/owner identity mandatory; guest identity is NULL.
alter table public.booking_cancellations
  add constraint booking_cancellations_requester_identity_check
  check (
    (requester_role in ('traveler', 'owner') and requester_id is not null)
    or
    (requester_role = 'guest' and requester_id is null)
  );

-- 3) Guest history uses an explicit guest role and NULL auth actor.
alter table public.booking_cancellation_history
  drop constraint if exists booking_cancellation_history_actor_role_check;

alter table public.booking_cancellation_history
  add constraint booking_cancellation_history_actor_role_check
  check (
    actor_role = any (array['traveler'::text, 'owner'::text, 'admin'::text, 'system'::text, 'guest'::text])
  );

alter table public.booking_cancellation_history
  add constraint booking_cancellation_history_guest_actor_check
  check (actor_role <> 'guest' or actor_id is null);

-- 4) Private, non-exposed schema for server-only guest credentials.
--    Staging currently has no private schema. Do not add it to Data API exposed schemas.
create schema if not exists private authorization postgres;
revoke all on schema private from public, anon, authenticated, service_role;

-- 5) Private credential registry. The secret itself is NEVER stored.
--    The reference is only a locator; the access secret is the authenticator.
--    Reference entropy/encoding must be finalized before an executable migration.
create table private.guest_booking_access (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  booking_reference text not null unique,
  secret_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint guest_booking_access_secret_hash_format
    check (secret_hash ~ '^[0-9a-f]{64}

-- Explicitly keep existing cancellation uniqueness and booking overlap
-- exclusion constraints unchanged. Do not add anon policies or public views.

commit;

-- FOLLOW-UP REQUIRED BEFORE THIS CAN BE AN EXECUTABLE RELEASE MIGRATION:
-- * Replace guest-incompatible notification and lifecycle routines with reviewed
--   NULL-safe definitions (including notify_new_booking, notify_booking_cancellation,
--   respond_to_booking, owner_respond_to_cancellation,
--   admin_review_owner_booking, admin_review_payment_receipt,
--   admin_review_booking_cancellation).
-- * Add the bidirectional deferred booking/credential integrity constraint triggers.
-- * Add server-only atomic guest booking, credential verification/rate-limit,
--   cancellation request, and receipt binding routines.
-- * Verify private schema is not Data API-exposed in Dashboard; verify effective
--   schema/table/function ACLs after migration. Explicitly revoke PUBLIC EXECUTE
--   on every private helper/trigger function.
-- * Recheck function EXECUTE ACLs and all effective table/view/Storage privileges.
-- * Implement and test the Edge Functions and one narrow owner/admin receipt access path.
-- * Run registered-user regression tests and guest concurrency/security tests.
)
);

create index guest_booking_access_expiry_idx
  on private.guest_booking_access (expires_at)
  where revoked_at is null;

-- 6) No direct access for Data API roles or service_role.
--    Future public SECURITY DEFINER wrappers must be individually reviewed,
--    have fixed search_path, and grant EXECUTE to service_role only.
alter table private.guest_booking_access enable row level security;
revoke all on table private.guest_booking_access
  from public, anon, authenticated, service_role;

-- Explicitly keep existing cancellation uniqueness and booking overlap
-- exclusion constraints unchanged. Do not add anon policies or public views.

commit;

-- FOLLOW-UP REQUIRED BEFORE THIS CAN BE AN EXECUTABLE RELEASE MIGRATION:
-- * Replace guest-incompatible notification and lifecycle routines with reviewed
--   NULL-safe definitions (including notify_new_booking, notify_booking_cancellation,
--   respond_to_booking, owner_respond_to_cancellation,
--   admin_review_owner_booking, admin_review_payment_receipt,
--   admin_review_booking_cancellation).
-- * Add server-only atomic guest booking, credential verification/rate-limit,
--   cancellation request, and receipt binding routines.
-- * Recheck function EXECUTE ACLs and all effective table/view/Storage privileges.
-- * Implement and test the Edge Functions and one narrow owner/admin receipt access path.
-- * Run registered-user regression tests and guest concurrency/security tests.
