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

test('owner booking exports fetch fresh data scoped to the signed-in owner', () => {
  const start = html.indexOf('async function exportOwnerBookings(format){');
  const end = html.indexOf('window.exportOwnerBookings = exportOwnerBookings;', start);
  assert.ok(start >= 0 && end > start, 'Owner export handler must be globally available');
  const source = html.slice(start, end);
  assert.match(source, /\.eq\('owner_id',currentUser\.id\)/);
  assert.match(source, /\.in\('property_id',propertyIds\)/);
  assert.match(source, /check_in\|\|''\)\.slice\(0,4\)===String\(year\)/);
  assert.match(source, /window\.open\('','_blank'\)/);
  assert.match(source, /if\(format==='xlsx'\s*&&\s*window\.XLSX\)/);
  assert.match(source, /text\/csv;charset=utf-8/);
});

test('owner booking export buttons invoke the public export handler', () => {
  assert.match(html, /onclick="exportOwnerBookings\('xlsx'\)"/);
  assert.match(html, /onclick="exportOwnerBookings\('pdf'\)"/);
  assert.match(html, /window\.exportOwnerBookings\s*=\s*exportOwnerBookings/);
});


test('visitor pages provide a keyboard skip link to the primary content', () => {
  assert.match(html, /<a class="skip-link" href="#home" onclick="showAppPage\('home'\)">انتقل إلى بداية المحتوى<\/a>/);
  assert.match(html, /<section id="home" class="app-page active" tabindex="-1">/);
  assert.match(html, /\.skip-link:focus\s*\{/);
});


test('destination carousel supports manual touch scrolling without auto-motion', () => {
  assert.match(html, /@media\(prefers-reduced-motion:reduce\),\(hover:none\)/);
  assert.match(html, /\.destination-marquee\{[^}]*overflow-x:auto/);
  assert.match(html, /\.destination-marquee-track\{animation:none;transform:none;will-change:auto\}/);
  assert.match(html, /\.destination-marquee-group\[aria-hidden="true"\]\{display:none\}/);
});


test('static destination images use lazy loading and async decoding', () => {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  assert.equal(images.length, 18);
  images.forEach((image) => {
    assert.match(image, /\bloading="lazy"/);
    assert.match(image, /\bdecoding="async"/);
    assert.match(image, /\balt="/);
  });
});
