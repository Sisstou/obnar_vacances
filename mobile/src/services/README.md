# Mobile service layer

Services in this folder isolate application workflows from screen components.

## Current service

- `auth.service.ts`: email/password sign-in and sign-up, current-session retrieval,
  sign-out, and auth-state subscription.
- All request methods return `AppResult<T>`; callers should inspect `ok` before
  reading `data` or `error`.
- Error normalization is centralized in `src/lib/errors.ts`.

## Boundaries

- This layer does not change the Supabase schema, RLS, Storage, Edge Functions,
  Auth dashboard settings, or environment secrets.
- It does not implement guest OTP, property discovery, bookings, payment receipts,
  owner operations, or admin workflows.
- Do not treat the current staging property catalogue as public inventory.
- Screens are not wired to these services in this phase; integration requires a
  separately coordinated UI change.
- Do not log passwords, access tokens, refresh tokens, or full session objects.
