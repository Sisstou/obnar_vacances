# OBNAR VACANCES — Mobile app

This is the separate Android/iOS application. The existing GitHub Pages website is not replaced or modified by this folder.

## Stack

- Expo SDK 58 / React Native 0.88 / TypeScript.
- Supabase Auth and the existing OBNAR VACANCES Supabase project.
- Arabic (RTL) and French interface.
- No paid app-builder subscription is required for local development.

## Local setup

1. Install Node.js 22.13 or newer and npm.
2. From this directory, install dependencies: `npm install`.
3. Copy `.env.example` to `.env`.
4. Set the existing Supabase staging project URL and its public anon/publishable key in `.env`.
5. Start the development server with `npm start`, then open the project with Expo Go or a development build.

Only the public Supabase anon/publishable key belongs in the mobile app. Never add a `service_role` key, database password, or server secret.

## Current milestone

- Native app shell for Android and iOS.
- Arabic/French language switch.
- Main navigation for discovery, booking follow-up, and account.
- Supabase email/password sign-in and sign-up foundation.
- Guest-first browsing: viewing stays does not require an account.

## Read-only backend review

The staging database schema and RLS policies were inspected without changing the database:

- Anonymous and authenticated users can read approved properties, their public images and amenities; locations and amenities are publicly readable.
- The `properties` table currently has no `is_test` marker, while `bookings` does. Therefore the mobile app must not blindly display every approved staging property until test listings are identified and safely excluded.
- Booking, guest-access, cancellation, deposit, and commission flows must follow the approved policy documents. The mobile app must not add in-app payment collection.

## Not implemented yet

- Reading approved properties and availability from Supabase.
- Property details, booking requests, guest booking credentials, owner dashboard, and admin tools.
- Push notifications, payment processing, and store submission.

These will be added only after checking the existing database schema, RLS policies, and the already approved booking/deposit/commission rules. The app does not collect payments.

## Project boundaries

- Work on branch `mobile-app`; do not merge to `main` without explicit approval.
- Do not run migrations or alter Supabase policies as part of the mobile UI work.
- Existing test bookings are not real customer bookings and must not be changed or deleted.
