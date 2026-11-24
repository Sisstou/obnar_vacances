# OBNAR VACANCES — Platform Commission and Related Booking Rules

**Status:** Approved business-policy direction; documentation only  
**Date:** 2026-11-24  
**Branch:** `pwa-foundation`  
**Implementation status:** Not implemented. This document does not authorize database migrations, Edge Function deployment, payment automation, or production changes.

## 1. Platform commission

- The platform commission is a fixed **500 DZD per paid night**.
- The **property owner** bears the commission. It is not added to the guest-facing accommodation price.
- The commission is calculated per night, not as a percentage of the booking value.
- For a normally completed booking, the commission for all paid nights is due after the guest has paid the booking in full. The operational collection method must remain manual in the current phase unless separately approved.
- **No-show exception:** if the guest does not arrive and the owner retains the deposit, the owner must manually transfer the platform commission to the platform. The commission is 500 DZD for each whole night whose full nightly price is covered by the retained deposit. This exception does not require full payment of the entire booking.
- Example: five paid nights produce a 2,500 DZD platform commission after full payment. If a no-show deposit covers only one whole 5,000 DZD night and is retained, the commission is 500 DZD, not 2,500 DZD.

## 2. Deposit amount, recipient, and no-show

- The property owner sets the accommodation price.
- The booking flow automatically adds the configured deposit amount **on top of** the owner's accommodation price. The deposit is additional; it is not deducted from or included within the owner's nightly accommodation price.
- The guest pays the accommodation amount plus the additional deposit to the **property owner**. The deposit is not paid to the platform.
- If the guest does not arrive and the owner retains the deposit under the no-show rule, the owner manually transfers the platform commission due from that retained deposit to the platform. There is no in-app payment or automatic commission collection in the current phase.
- The deposit is not refunded under the user's stated no-show rule.
- The platform commission is **500 DZD only for each whole night whose full nightly price is covered by the deposit actually retained**.
- No commission is charged for a partial night amount or for remaining unpaid nights. If the deposit is less than the full price of one night, no commission is due.
- Example: if one night costs 5,000 DZD:
  - a 3,000 DZD deposit covers no whole night: commission is 0 DZD;
  - a 5,000 DZD deposit covers one whole night: commission is 500 DZD;
  - a 10,000 DZD deposit covers two whole nights: commission is 1,000 DZD.

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
- owner's accommodation price and the additional deposit amount;
- total amount paid by the guest and the recipient of each component;
- verified payment status;
- the number/value of whole nights fully covered by a retained deposit;
- refunded amount and affected nights;
- owner-initiated versus guest-initiated cancellation;
- commission accrued, manually collected, reversed, or not due;
- the policy event that made commission due (full payment, or retained no-show deposit).

Commission must not be marked as collected merely because a booking request was submitted. The applicable payment and outcome conditions must be satisfied first. In the current phase, commission collection is manual; do not implement in-app payment, automatic transfers, or payment-gateway integration.

## 6. Compatibility findings and unresolved rules

- The current database design records booking totals, payment state, deposit amount, and nightly price components, but the reviewed design does **not** define a commission ledger or a field that records which whole nights a deposit covers. A separate accounting design is required before implementation; do not infer this from the deposit amount without an explicit, deterministic rule.
- Existing guest-initiated cancellation/refund rules remain in force, including the previously approved five-day threshold and exceptional admin review. This document does not replace or silently modify them.
- If a guest cancellation receives a full deposit refund, no commission should be treated as earned on the refunded deposit. The exact accounting reversal event must be specified in the implementation design.
- Partial refunds, shortening a booking by mutual agreement, and disputes about whether a night was paid/retained require explicit rules before implementation.
- The exact operational method for manually collecting/settling commission on normally completed bookings still needs a technical and operational design.
- Any conflict between this policy and current database constraints, payment workflows, or existing cancellation rules must be surfaced for review; do not silently change existing behavior.

## 7. Change control

This is a policy record only. Do not:
- apply SQL migrations to staging or production;
- deploy or configure Edge Functions/secrets;
- change payment or Storage policies;
- activate guest booking/recovery UI;
- merge `pwa-foundation` into `main`;

without separate explicit approval for the relevant action.
