-- OBNAR VACANCES — Guest booking deferred integrity triggers
-- DRAFT ONLY — NOT FOR EXECUTION
-- Branch: pwa-foundation
--
-- Prerequisites (not created here):
--   * schema private exists and is not exposed through Supabase Data API;
--   * private.guest_booking_access exists with booking_id UUID PRIMARY KEY
--     REFERENCES public.bookings(id) ON DELETE CASCADE;
--   * registry table has RLS enabled and no direct grants to API roles;
--   * all registry writes are restricted to reviewed server-only routines.
--
-- This file contains ONLY the final-state constraint trigger layer.
-- It does not create guest booking RPCs, Edge Functions, rate limiting,
-- credential verification, receipt access, or notification/RPC patches.
--
-- Locking contract:
--   * Never take a generic advisory lock from BEFORE ROW triggers on both
--     tables. That can invert lock order and deadlock against FK cascades.
--   * Every trusted routine that mutates the registry must first lock the
--     parent booking row with SELECT ... FOR UPDATE, then mutate the registry.
--   * Guest creation inserts booking + registry row in one transaction.
--   * Booking UPDATE/DELETE naturally locks the target booking row.
--   * No other workflow may change traveler_id or registry membership.
--   * Initial isolation contract is READ COMMITTED; test the real path.
--
-- Security:
--   * The trigger function reads a private table. SECURITY DEFINER may be
--     required because API roles have no registry privileges.
--   * Create/own this function under a trusted role that can read both tables.
--     Verify the actual owner and effective ACLs after creation.
--   * search_path is empty; all relations are schema-qualified.
--   * Revoke direct EXECUTE from PUBLIC and all Supabase API roles.
--
-- Invariant at transaction commit:
--   1. traveler_id IS NULL => exactly one registry row (PK gives at most one).
--   2. traveler_id IS NOT NULL => no registry row.
--   3. registry row => referenced booking exists and is a guest booking.
--   4. deleting a booking and its FK-cascaded registry row is valid.

begin;

create or replace function private.enforce_guest_booking_access_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_booking_id uuid;
  v_booking_exists boolean := false;
  v_traveler_id uuid;
  v_access_exists boolean := false;
begin
  if tg_table_schema = 'public' and tg_table_name = 'bookings' then
    if tg_op = 'DELETE' then
      v_booking_id := old.id;
    else
      v_booking_id := new.id;
    end if;

    if tg_op = 'UPDATE' and old.id is distinct from new.id then
      raise exception using
        errcode = '23514',
        message = 'Booking primary key is immutable';
    end if;
  elsif tg_table_schema = 'private' and tg_table_name = 'guest_booking_access' then
    if tg_op = 'DELETE' then
      v_booking_id := old.booking_id;
    else
      v_booking_id := new.booking_id;
    end if;

    if tg_op = 'UPDATE' and old.booking_id is distinct from new.booking_id then
      raise exception using
        errcode = '23514',
        message = 'Guest credential booking_id is immutable';
    end if;
  else
    raise exception using
      errcode = '22023',
      message = 'Unexpected table for guest booking integrity trigger';
  end if;

  select b.traveler_id
    into v_traveler_id
    from public.bookings as b
   where b.id = v_booking_id;

  v_booking_exists := found;

  select exists (
    select 1
      from private.guest_booking_access as a
     where a.booking_id = v_booking_id
  )
  into v_access_exists;

  if not v_booking_exists and v_access_exists then
    raise exception using
      errcode = '23514',
      message = 'Guest credential references a missing booking';
  elsif v_booking_exists and v_traveler_id is null and not v_access_exists then
    raise exception using
      errcode = '23514',
      message = 'Guest booking requires exactly one credential record';
  elsif v_booking_exists and v_traveler_id is not null and v_access_exists then
    raise exception using
      errcode = '23514',
      message = 'Registered booking cannot have a guest credential record';
  end if;

  -- AFTER triggers ignore the returned row value.
  return null;
end;
$function$;

revoke all on function private.enforce_guest_booking_access_integrity()
  from public, anon, authenticated, service_role;

create constraint trigger guest_booking_access_integrity_on_booking
after insert or update of traveler_id or delete
on public.bookings
deferrable initially deferred
for each row
execute function private.enforce_guest_booking_access_integrity();

create constraint trigger guest_booking_access_integrity_on_registry
after insert or update or delete
on private.guest_booking_access
deferrable initially deferred
for each row
execute function private.enforce_guest_booking_access_integrity();

commit;

-- REQUIRED BEFORE ANY EXECUTABLE MIGRATION:
-- 1. Parse and execute in a disposable PostgreSQL instance matching staging.
-- 2. Verify the function owner is trusted and has the required table privileges.
-- 3. Verify effective EXECUTE ACLs (including inherited PUBLIC privileges).
-- 4. Test all invariant cases in GUEST_BOOKING_DEFERRED_INTEGRITY_TRIGGER_REVIEW_2026-11-24.md.
-- 5. Test FK cascade ordering and both trigger queues at commit.
-- 6. Test concurrent guest creation, registry mutation, and booking deletion.
-- 7. Verify actual transaction isolation and retry behavior.
-- 8. Preserve existing payment, test-booking, availability, and notification triggers.
-- 9. Do not apply to staging or production without separate explicit approval.
