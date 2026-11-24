# OBNAR VACANCES — Guest Booking Readiness Checkpoint

**Date:** 24 November 2026  
**Branch:** `pwa-foundation`  
**Environment:** staging project `rhxeclddohpwtpzkruzm`  
**Scope:** read-only verification; documentation only

## Current verified state

- Staging project is `ACTIVE_HEALTHY`.
- Staging currently has **0 bookings**, **0 bookings with NULL traveler_id**, **0 cancellation requests**, and **0 cancellation-history rows**.
- Staging has 32 notification rows.
- No Edge Functions are currently deployed in staging.
- The guest security helper exists in the development branch at `supabase/functions/_shared/guest-security.ts`; it generates 256-bit random secrets, validates their Base64URL format, hashes them with SHA-256, and compares fixed-length hashes.
- The current `index.html` remains the existing application. It contains the registered-user booking flow and does not yet contain an operational guest booking flow.
- The current guest API and database documents remain design contracts only. They are not deployed endpoints or executable migrations.

## Consequences

1. Guest booking cannot safely be enabled yet: the current schema still requires `bookings.traveler_id`, and there are no deployed guest endpoints.
2. The registered booking flow must continue using its existing authenticated RPCs and Storage path rules.
3. No browser-side anonymous access to booking/cancellation tables or private receipt storage is permitted.
4. Guest receipt support remains blocked until a server-side upload/attachment route and owner/admin-only receipt read path are implemented and tested.
5. No staging or production database changes, policy changes, Storage changes, Edge Function deployments, or secret changes were made during this checkpoint.

## Required implementation sequence

1. Finish the dependency inventory for all booking-related routines, triggers, views, frontend queries, grants, and Storage rules.
2. Design and implement the private guest database routines and the single reviewed schema migration.
3. Add Edge Functions for guest creation, authenticated status/cancellation, and receipt upload; keep all service credentials server-side.
4. Add automated tests for credential handling, throttling, overlap races, cancellation deadlines, payment receipt access, and registered-user regression.
5. Add the guest UI only after the backend is deployed to staging and passes those tests.
6. Run end-to-end staging verification with test data and confirm the registered-user flow still works.
7. Obtain explicit approval before applying the migration to staging. Production requires a separate explicit approval.

## Release gate

The guest booking feature must remain hidden/disabled until all backend and security tests pass. This checkpoint authorizes documentation and read-only inspection only; it does not authorize applying migrations, deploying functions, changing secrets, or modifying production.
