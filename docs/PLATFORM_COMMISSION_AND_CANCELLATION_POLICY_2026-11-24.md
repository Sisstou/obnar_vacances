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
- **No-show exception:** if the guest does not arrive and the owner retains the deposit, the owner must manually transfer **500 DZD** to the platform for the one night covered by that deposit. This exception does not require full payment of the entire booking.
- Example: five paid nights produce a 2,500 DZD platform commission after full payment. If the guest is a no-show and the owner retains the one-night deposit, the commission due is 500 DZD.

## 2. Deposit amount, recipient, and no-show

- The property owner sets the accommodation price per night.
- The booking flow automatically sets the deposit to **exactly the price of one night** at the property. The deposit is additional; it is not deducted from or included within the owner's accommodation price.
- The deposit must always cover exactly one full night: it is neither a partial-night amount nor an amount covering multiple nights.
- The guest pays the accommodation amount plus the additional one-night deposit to the **property owner**. The deposit is not paid to the platform.
- If the guest does not arrive and the owner retains the deposit under the no-show rule, the owner manually transfers **500 DZD** platform commission to the platform.
- The deposit is not refunded under the user's stated no-show rule.
- There is no in-app payment or automatic commission collection in the current phase.

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
- owner's accommodation price and the additional deposit amount (exactly one nightly price);
- total amount paid by the guest and the recipient of each component;
- verified payment status;
- no-show outcome and whether the owner retained the one-night deposit;
- refunded amount and affected nights;
- owner-initiated versus guest-initiated cancellation;
- commission accrued, manually collected, reversed, or not due;
- the policy event that made commission due (full payment, or retained no-show deposit).

Commission must not be marked as collected merely because a booking request was submitted. The applicable payment and outcome conditions must be satisfied first. In the current phase, commission collection is manual; do not implement in-app payment, automatic transfers, or payment-gateway integration.

## 6. Compatibility findings and unresolved rules

- The current database design records booking totals, payment state, deposit amount, and nightly price components, but the reviewed design does **not** define a commission ledger or a field that records whether the owner retained a no-show deposit. A separate accounting design is required before implementation; do not infer commission collection from the deposit amount alone.
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
