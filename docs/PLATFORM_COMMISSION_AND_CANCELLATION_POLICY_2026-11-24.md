# OBNAR VACANCES — Platform Commission and Related Booking Rules

**Status:** Approved business-policy direction; documentation only  
**Date:** 2026-11-24  
**Branch:** `pwa-foundation`  
**Implementation status:** Not implemented. This document does not authorize database migrations, Edge Function deployment, payment automation, or production changes.

## 1. Platform commission

- The platform commission is a fixed **500 DZD per paid night**.
- The **property owner** bears the commission. It is not added to the guest-facing accommodation price.
- The commission is calculated per night, not as a percentage of the booking value.
- For a normally completed booking, the commission for all paid nights is settled when the guest has paid the booking in full.
- **No-show exception:** if the guest paid only a deposit, does not arrive, and the deposit is retained under the no-show rule, the platform commission is 500 DZD for each whole night whose price is covered by that retained deposit. This exception does not require full payment of the entire booking.
- Example: five nights at 5,000 DZD per night produce a 2,500 DZD platform commission after full payment. If a no-show deposit covers only one whole 5,000 DZD night and is retained, the commission is 500 DZD, not 2,500 DZD.

## 2. Deposit-only no-show

If the guest pays a deposit and does not arrive:

- The deposit is not refunded under the user's stated no-show rule.
- The platform commission is **500 DZD only for each whole night whose full nightly price is covered by the deposit actually retained**.
- No commission is charged for the remaining unpaid nights.
- The deposit amount and the number/value of whole nights it covers must be recorded clearly. If the deposit does not cover a whole night, the commission treatment is not yet defined; do not round up or infer a covered night.

## 3. Early departure after full payment

If the guest paid the full booking amount and leaves before the booked end date:

- No refund is made for the unused booked nights under the user's stated early-departure rule.
- The commission remains **500 DZD for every night paid for**, not only the nights physically occupied.

## 4. Owner-initiated cancellation

If the property owner cancels a booking:

- The guest receives a full refund of the amount paid.
- No cancellation penalty is charged to the owner under this agreed policy.
- The platform charges no commission for the cancelled booking/nights.

## 5. Collection and accounting requirements

Before implementation, the booking/payment ledger must distinguish at least:
- booked nights;
- paid amount and verified payment status;
- deposit amount and the number/value of whole nights it covers;
- refunded amount and affected nights;
- owner-initiated versus guest-initiated cancellation;
- commission accrued, collected, reversed, or not due;
- the policy event that made commission due (full payment, or retained no-show deposit).

Commission must not be marked as collected merely because a booking request was submitted. The applicable payment and outcome conditions must be satisfied first.

## 6. Compatibility findings and unresolved rules

- The current database design records booking totals, payment state, deposit amount, and nightly price components, but the reviewed design does **not** define a commission ledger or a field that records which whole nights a deposit covers. A separate accounting design is required before implementation; do not infer this from the deposit amount.
- Existing guest-initiated cancellation/refund rules remain in force, including the previously approved five-day threshold and exceptional admin review. This document does not replace or silently modify them.
- If a guest cancellation receives a full deposit refund, no commission should be treated as earned on the refunded deposit. The exact accounting reversal event must be specified in the implementation design.
- Partial refunds, shortening a booking by mutual agreement, no-show deposits that do not cover a whole night, and disputes about whether a night was paid/retained require explicit rules before implementation.
- The exact operational method for collecting/settling the owner's commission at full payment or after a retained no-show deposit still needs a technical and operational design.
- Any conflict between this policy and current database constraints, payment workflows, or existing cancellation rules must be surfaced for review; do not silently change existing behavior.

## 7. Change control

This is a policy record only. Do not:
- apply SQL migrations to staging or production;
- deploy or configure Edge Functions/secrets;
- change payment or Storage policies;
- activate guest booking/recovery UI;
- merge `pwa-foundation` into `main`;

without separate explicit approval for the relevant action.
