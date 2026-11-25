const assert = require('node:assert/strict');

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TRAVELER_EMAIL',
  'TRAVELER_PASSWORD',
  'OWNER_EMAIL',
  'OWNER_PASSWORD',
  'SECURITY_TEST_BOOKING_ID',
];
for (const name of required) {
  assert.ok(process.env[name], `Missing required GitHub Actions secret/variable: ${name}`);
}

const base = process.env.SUPABASE_URL.replace(/\\/$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bookingId = process.env.SECURITY_TEST_BOOKING_ID;
assert.match(bookingId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  'SECURITY_TEST_BOOKING_ID must be a UUID');

function serviceHeaders() {
  const headers = { apikey: serviceKey };
  if (serviceKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + serviceKey;
  return headers;
}

async function signIn(email, password) {
  const response = await fetch(base + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  assert.equal(response.ok, true, 'Staging test-account sign-in failed (HTTP ' + response.status + ')');
  assert.ok(data.access_token, 'Auth response did not contain an access token');
  return data.access_token;
}

async function authUser(token) {
  const response = await fetch(base + '/auth/v1/user', {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + token },
  });
  const data = await response.json();
  assert.equal(response.ok, true, 'Could not identify signed-in test account');
  return data;
}

async function getJson(path, { token, service = false } = {}) {
  const headers = service
    ? serviceHeaders()
    : { apikey: anonKey, ...(token ? { Authorization: 'Bearer ' + token } : {}) };
  const response = await fetch(base + '/rest/v1/' + path, { headers });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  assert.equal(response.ok, true, 'REST read failed (HTTP ' + response.status + ')');
  return data;
}

async function assertHidden(label, token) {
  const result = await getJson(
    'bookings?select=id&id=eq.' + encodeURIComponent(bookingId),
    { token },
  );
  assert.ok(Array.isArray(result), label + ': booking response was not an array');
  assert.equal(result.length, 0, label + ': a non-participant can read the protected booking');
  console.log('PASS: ' + label + ' cannot read the protected booking');
}

async function main() {
  const parsed = new URL(base);
  assert.equal(parsed.hostname, 'rhxeclddohpwtpzkruzm.supabase.co',
    'Refusing to run outside the configured isolated Staging project');

  const [travelerToken, ownerToken] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD),
  ]);
  const [traveler, owner] = await Promise.all([
    authUser(travelerToken),
    authUser(ownerToken),
  ]);

  // Service role is used only to verify fixture ownership; this script performs no writes.
  const rows = await getJson(
    'bookings?select=id,traveler_id,property_id&id=eq.' + encodeURIComponent(bookingId),
    { service: true },
  );
  assert.equal(rows.length, 1, 'Protected fixture booking was not found');
  const fixture = rows[0];
  assert.notEqual(fixture.traveler_id, traveler.id,
    'Fixture booking belongs to the configured traveler; choose a different booking');
  assert.notEqual(fixture.traveler_id, owner.id,
    'Fixture booking unexpectedly belongs to the configured owner');

  const properties = await getJson(
    'properties?select=id,owner_id&id=eq.' + encodeURIComponent(fixture.property_id),
    { service: true },
  );
  assert.equal(properties.length, 1, 'Fixture property was not found');
  assert.notEqual(properties[0].owner_id, owner.id,
    'Fixture property belongs to the configured owner; choose another booking');

  // No Authorization header: anonymous access must not reveal the booking.
  await assertHidden('Anonymous visitor', null);
  await assertHidden('Configured traveler (not a participant)', travelerToken);
  await assertHidden('Configured owner (not the property owner)', ownerToken);

  console.log('PASS: read-only booking isolation checks completed. No database rows or storage objects were changed.');
}

main().catch(error => {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
});
