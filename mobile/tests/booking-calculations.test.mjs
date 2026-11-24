import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFullPaymentCommission,
  calculateRetainedDepositCommission,
  calculateStayPrice,
  getDisplayInitials,
} from '../src/lib/booking-calculations.mjs';

test('full-payment commission is 500 DZD for each paid night', () => {
  assert.equal(calculateFullPaymentCommission(5), 2500);
  assert.equal(calculateFullPaymentCommission(1), 500);
  assert.equal(calculateFullPaymentCommission(0), null);
  assert.equal(calculateFullPaymentCommission(Number.MAX_SAFE_INTEGER), null);
});

test('commission follows the number of full nights covered by a retained deposit', () => {
  assert.equal(calculateRetainedDepositCommission(5, 1), 500);
  assert.equal(calculateRetainedDepositCommission(5, 3), 1500);
  assert.equal(calculateRetainedDepositCommission(5, 5), 2500);
});

test('commission rejects missing, invalid, or excessive deposit nights', () => {
  assert.equal(calculateRetainedDepositCommission(5, 0), null);
  assert.equal(calculateRetainedDepositCommission(5, 6), null);
  assert.equal(calculateRetainedDepositCommission(0, 1), null);
  assert.equal(calculateRetainedDepositCommission(5, 1.5), null);
});

test('stay price computes subtotal and adds deposit separately', () => {
  assert.deepEqual(calculateStayPrice(4000, 3, 1000), {
    pricePerNight: 4000,
    nights: 3,
    depositAmount: 1000,
    accommodationSubtotal: 12000,
    total: 13000,
  });
});

test('stay price rejects invalid values and unsafe totals', () => {
  assert.equal(calculateStayPrice(-1, 2, 0), null);
  assert.equal(calculateStayPrice(1000, 1.5, 0), null);
  assert.equal(calculateStayPrice(Number.MAX_SAFE_INTEGER, 2, 0), null);
  assert.equal(calculateStayPrice(1000, 2, Number.POSITIVE_INFINITY), null);
});

test('host initials split on one or more whitespace characters', () => {
  assert.equal(getDisplayInitials('Sassi Khebbache'), 'SK');
  assert.equal(getDisplayInitials('  Sassi   Khebbache  '), 'SK');
  assert.equal(getDisplayInitials('Sassi'), 'S');
  assert.equal(getDisplayInitials('Sassi Khebbache', 'SKH'), 'SKH');
});
