const assert = require('node:assert/strict');

const STAGING_PROJECT_REF = 'rhxeclddohpwtpzkruzm';
const USERS = {
  traveler: 'c0a51947-db42-49f5-b215-74f8f6cc186b',
  owner: 'd4b045df-d356-4c25-be54-608bf76a17a2',
  admin: '7d223c09-1df3-4438-ab55-9caa92eaefc2',
};
const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'TRAVELER_EMAIL', 'TRAVELER_PASSWORD', 'OWNER_EMAIL', 'OWNER_PASSWORD',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
];
for (const name of required) assert.ok(process.env[name], 'Missing GitHub Actions secret: ' + name);

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const parsedUrl = new URL(base);
assert.equal(parsedUrl.hostname, STAGING_PROJECT_REF + '.supabase.co',
  'Refusing to run: target is not the isolated Staging project');
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.notEqual(serviceKey, anonKey, 'Service key must not be the anon key');
assert.ok(!serviceKey.startsWith('sb_publishable_'), 'A publishable key cannot be used as service key');

function serviceHeaders(extra = {}) {
  const headers = { apikey: serviceKey, ...extra };
  if (serviceKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + serviceKey;
  return headers;
}
async function request(path, { method = 'GET', token, service = false, body, headers = {}, prefer } = {}) {
  const h = { apikey: service ? serviceKey : anonKey, ...headers };
  if (service && serviceKey.startsWith('eyJ')) h.Authorization = 'Bearer ' + serviceKey;
  else if (!service && token) h.Authorization = 'Bearer ' + token;
  if (body !== undefined && !h['content-type']) h['content-type'] = 'application/json';
  if (prefer) h.Prefer = prefer;
  const response = await fetch(base + '/rest/v1/' + path, {
    method, headers: h, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const message = data && typeof data === 'object'
      ? (data.message || data.error || JSON.stringify(data)) : String(data);
    throw new Error(method + ' ' + path + ' failed (' + response.status + '): ' + message);
  }
  return data;
}
async function signIn(email, password) {
  const response = await fetch(base + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  assert.equal(response.ok, true, 'Staging sign-in failed (HTTP ' + response.status + ')');
  assert.ok(data.access_token, 'Auth response has no access token');
  return data.access_token;
}
async function rpc(token, name, args = {}) {
  return request('rpc/' + name, { method: 'POST', token, body: args });
}
async function expectDenied(action, message) {
  let denied = false;
  try { await action(); } catch { denied = true; }
  assert.equal(denied, true, message);
}
function localDatePlus(days) {
  const now = new Date(Date.now() + 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + days);
  return now.toISOString().slice(0, 10);
}
const created = { properties: [], bookings: [], storage: [] };
const suffix = Date.now().toString(36);
let traveler, owner, admin;
async function createProperty() {
  const rows = await request('properties?select=id', {
    method: 'POST', service: true, prefer: 'return=representation',
    body: [{
      owner_id: USERS.owner,
      title_ar: 'CI test fixture booking lifecycle ' + suffix,
      title_fr: 'CI test fixture booking lifecycle ' + suffix,
      description_ar: 'Temporary Staging-only automated test fixture.',
      description_fr: 'Temporary Staging-only automated test fixture.',
      property_type: 'apartment', bedrooms: 2, bathrooms: 1, capacity: 4,
      price_per_night: 5000, currency: 'DZD', status: 'approved',
    }],
  });
  assert.ok(rows?.[0]?.id, 'Could not create Staging fixture property');
  created.properties.push(rows[0].id);
  return rows[0].id;
}
async function readBooking(id) {
  const rows = await request(
    'bookings?select=id,property_id,traveler_id,status,payment_status,deposit_amount,total_price,owner_price_per_night,platform_commission_per_night,final_price_per_night,payment_receipt_path,payment_rejection_reason,payment_verified_at&id=eq.' + id,
    { service: true },
  );
  assert.equal(rows.length, 1, 'Booking not found: ' + id);
  return rows[0];
}
async function createBooking(propertyId, startOffset, guests = 2) {
  const id = await rpc(traveler, 'create_booking', {
    p_property_id: propertyId,
    p_check_in: localDatePlus(startOffset),
    p_check_out: localDatePlus(startOffset + 2),
    p_guests: guests,
  });
  assert.ok(typeof id === 'string' && id.length > 20, 'create_booking did not return a booking UUID');
  created.bookings.push(id);
  return id;
}
async function uploadSyntheticReceipt(bookingId, attempt) {
  const path = USERS.traveler + '/' + bookingId + '/ci-synthetic-receipt-' + attempt + '-' + suffix + '.pdf';
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
  const response = await fetch(base + '/storage/v1/object/payment-receipts/' + path, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + traveler,
      'content-type': 'application/pdf',
    },
    body: pdf,
  });
  const raw = await response.text();
  assert.equal(response.ok, true, 'Synthetic Staging receipt upload failed: HTTP ' + response.status + ' ' + raw);
  created.storage.push(path);
  return path;
}
async function cleanup() {
  for (const path of created.storage) {
    const response = await fetch(base + '/storage/v1/object/payment-receipts/' + path, {
      method: 'DELETE', headers: serviceHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error('Could not delete temporary receipt object ' + path + ' (HTTP ' + response.status + ')');
    }
  }
  for (const id of created.bookings) {
    await request('notifications?entity_id=eq.' + id, { method: 'DELETE', service: true });
    await request('bookings?id=eq.' + id, { method: 'DELETE', service: true });
  }
  for (const id of created.properties) {
    await request('notifications?entity_id=eq.' + id, { method: 'DELETE', service: true });
    await request('properties?id=eq.' + id, { method: 'DELETE', service: true });
  }
}
async function main() {
  const admins = await request('platform_admins?select=user_id,is_main_admin&user_id=eq.' + USERS.admin, { service: true });
  assert.equal(admins.length, 1);
  assert.equal(admins[0].is_main_admin, true);
  const profiles = await request('profiles?select=id,role&id=in.(' + Object.values(USERS).join(',') + ')', { service: true });
  assert.equal(profiles.length, 3, 'All three Staging test profiles must exist');
  const roles = Object.fromEntries(profiles.map(p => [p.id, p.role]));
  assert.equal(roles[USERS.traveler], 'traveler');
  assert.equal(roles[USERS.owner], 'owner');

  [traveler, owner, admin] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD),
    signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD),
  ]);
  assert.equal(await rpc(admin, 'is_main_admin'), true);
  assert.equal(await rpc(traveler, 'is_main_admin'), false);
  assert.equal(await rpc(owner, 'is_main_admin'), false);

  const propertyId = await createProperty();

  // Validation: self-booking and over-capacity requests must be rejected without inserts.
  await expectDenied(
    () => rpc(owner, 'create_booking', {
      p_property_id: propertyId, p_check_in: localDatePlus(45),
      p_check_out: localDatePlus(47), p_guests: 2,
    }),
    'Owner was able to book their own property',
  );
  await expectDenied(
    () => rpc(traveler, 'create_booking', {
      p_property_id: propertyId, p_check_in: localDatePlus(45),
      p_check_out: localDatePlus(47), p_guests: 5,
    }),
    'Over-capacity booking was accepted',
  );
  console.log('PASS: booking validation rejects owner self-booking and guest capacity violations.');

  // Create a pending booking and verify pricing snapshots and overlap protection.
  const bookingId = await createBooking(propertyId, 10);
  let booking = await readBooking(bookingId);
  assert.equal(booking.status, 'pending');
  assert.equal(Number(booking.owner_price_per_night), 5000);
  assert.equal(Number(booking.platform_commission_per_night), 500);
  assert.equal(Number(booking.final_price_per_night), 5500);
  assert.equal(Number(booking.total_price), 11000);
  await expectDenied(
    () => rpc(traveler, 'create_booking', {
      p_property_id: propertyId, p_check_in: localDatePlus(11),
      p_check_out: localDatePlus(13), p_guests: 2,
    }),
    'Overlapping active booking dates were accepted',
  );
  console.log('PASS: traveler booking creation snapshots price and blocks overlapping active dates.');

  // Only the property owner can respond; owner acceptance requires main-admin approval.
  await expectDenied(
    () => rpc(traveler, 'respond_to_booking', { p_booking_id: bookingId, p_status: 'confirmed' }),
    'Traveler was able to respond as property owner',
  );
  await rpc(owner, 'respond_to_booking', { p_booking_id: bookingId, p_status: 'confirmed' });
  booking = await readBooking(bookingId);
  assert.equal(booking.status, 'awaiting_admin_approval');
  await expectDenied(
    () => rpc(owner, 'admin_review_owner_booking', {
      p_booking_id: bookingId, p_action: 'approve', p_reason: null,
    }),
    'Owner was able to perform main-admin booking review',
  );
  await rpc(admin, 'admin_review_owner_booking', {
    p_booking_id: bookingId, p_action: 'approve', p_reason: null,
  });
  booking = await readBooking(bookingId);
  assert.equal(booking.status, 'awaiting_payment');
  assert.equal(Number(booking.deposit_amount), 5500);
  assert.equal(booking.payment_status, 'unpaid');
  console.log('PASS: owner acceptance moves booking to main-admin review; admin approval opens deposit payment.');

  // Upload a synthetic receipt object (not a real transfer), reject it, then resubmit and verify.
  const firstReceipt = await uploadSyntheticReceipt(bookingId, 1);
  await rpc(traveler, 'submit_payment_receipt', {
    p_booking_id: bookingId, p_storage_path: firstReceipt,
  });
  booking = await readBooking(bookingId);
  assert.equal(booking.status, 'awaiting_payment');
  assert.equal(booking.payment_status, 'receipt_submitted');
  assert.equal(booking.payment_receipt_path, firstReceipt);
  await expectDenied(
    () => rpc(owner, 'admin_review_payment_receipt', {
      p_booking_id: bookingId, p_action: 'verify', p_reason: null,
    }),
    'Owner was able to verify a payment receipt',
  );
  await rpc(admin, 'admin_review_payment_receipt', {
    p_booking_id: bookingId, p_action: 'reject', p_reason: 'Synthetic test rejection.',
  });
  booking = await readBooking(bookingId);
  assert.equal(booking.status, 'awaiting_payment');
  assert.equal(booking.payment_status, 'rejected');
  assert.equal(booking.payment_rejection_reason, 'Synthetic test rejection.');

  const secondReceipt = await uploadSyntheticReceipt(bookingId, 2);
  await rpc(traveler, 'submit_payment_receipt', {
    p_booking_id: bookingId, p_storage_path: secondReceipt,
  });
  await rpc(admin, 'admin_review_payment_receipt', {
    p_booking_id: bookingId, p_action: 'verify', p_reason: null,
  });
  booking = await readBooking(bookingId);
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.payment_status, 'verified');
  assert.ok(booking.payment_verified_at);
  console.log('PASS: receipt submission, admin rejection, resubmission, and verification complete; no real payment was made.');

  // Owner rejection must close a separate pending booking without entering payment.
  const rejectedBookingId = await createBooking(propertyId, 25);
  await rpc(owner, 'respond_to_booking', {
    p_booking_id: rejectedBookingId, p_status: 'rejected',
  });
  const rejectedBooking = await readBooking(rejectedBookingId);
  assert.equal(rejectedBooking.status, 'rejected');
  assert.equal(rejectedBooking.payment_status, 'unpaid');
  console.log('PASS: owner rejection closes a pending booking without opening payment.');

  console.log('PASS: all booking lifecycle JWT end-to-end scenarios completed against isolated Staging.');
}
main()
  .catch(error => {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log('CLEANUP: temporary Staging properties, bookings, notifications, and synthetic receipts deleted.');
    } catch (error) {
      console.error('CLEANUP FAILURE: manual Staging cleanup may be required:', error.message);
      process.exitCode = 1;
    }
  });
