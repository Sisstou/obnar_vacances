const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');

function scriptBlocks(source) {
  return [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.trim().length > 0);
}

test('all inline JavaScript parses without syntax errors', () => {
  const scripts = scriptBlocks(html);
  assert.ok(scripts.length > 0, 'Expected at least one inline script');
  scripts.forEach((source, index) => {
    assert.doesNotThrow(
      () => new vm.Script(source, { filename: 'index.html:inline-script-' + (index + 1) }),
      'Inline script ' + (index + 1) + ' must parse'
    );
  });
});

test('signup exposes the three supported account types', () => {
  assert.match(html, /option value="traveler"/);
  assert.match(html, /option value="owner"/);
  assert.match(html, /option value="activity_provider"/);
});

test('main admin dashboard is gated by the main-admin RPC', () => {
  assert.match(html, /db\.rpc\('is_main_admin'\)/);
  assert.match(html, /if\(isAdmin!==true\)/);
});

test('test bookings are separated from launch booking statistics', () => {
  assert.match(html, /b\.is_test !== true/);
  assert.match(html, /b\.is_test === true/);
});

test('owner cancellation UI states the full-deposit refund rule', () => {
  assert.match(html, /إلغاء المالك مع الدفع المؤكد والعربون الموجب يستوجب استرداد العربون كاملاً/);
  assert.doesNotMatch(html, /يشترط إعادة تأجير العقار نفسه للتواريخ نفسها/);
});

test('mandatory material-mismatch refund cannot be rejected in admin UI', () => {
  assert.match(html, /mandatoryMismatchRefund/);
  assert.match(html, /'water_unavailable'/);
  assert.match(html, /'electricity_unavailable'/);
  assert.match(html, /'gas_unavailable'/);
  assert.match(html, /'missing_furniture'/);
  assert.match(html, /'location_mismatch'/);
  assert.match(html, /'property_mismatch'/);
  assert.match(html, /'description_mismatch'/);
  assert.match(html, /const refundOptions = mandatoryMismatchRefund\s*\?\s*\[\s*\['none'[\s\S]*?\['approve'/);
});

test('traveler cancellation and payment receipt use server-side RPCs', () => {
  assert.match(html, /db\.rpc\('request_booking_cancellation'/);
  assert.match(html, /db\.rpc\('submit_payment_receipt'/);
});

test('public business directory only loads approved businesses', () => {
  assert.match(html, /from\('local_businesses'\)[\s\S]{0,250}eq\('status','approved'\)/);
});
