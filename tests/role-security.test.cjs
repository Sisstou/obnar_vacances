const assert = require('node:assert/strict');

const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY',
  'TRAVELER_EMAIL', 'TRAVELER_PASSWORD',
  'OWNER_EMAIL', 'OWNER_PASSWORD',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
];
for (const key of required) {
  assert.ok(process.env[key], `Missing GitHub Actions secret: ${key}`);
}

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY;

async function signIn(email, password) {
  const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  assert.equal(response.ok, true, `Sign-in failed for a configured test account (HTTP ${response.status})`);
  assert.ok(data.access_token, 'Auth response did not contain an access token');
  return data.access_token;
}

async function rest(token, path, options = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  return { status: response.status, ok: response.ok, data };
}

async function rpc(token, name, args = {}) {
  return rest(token, `rpc/${name}`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

async function main() {
  const [traveler, owner, admin] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD),
    signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD),
  ]);

  // Confirm the configured administrator really has the main-admin flag.
  const adminFlag = await rpc(admin, 'is_main_admin');
  assert.equal(adminFlag.ok, true, 'Admin is_main_admin RPC failed');
  assert.equal(adminFlag.data, true, 'ADMIN test account is not the main administrator');

  for (const [label, token] of [['traveler', traveler], ['owner', owner]]) {
    const flag = await rpc(token, 'is_main_admin');
    assert.equal(flag.ok, true, `${label}: is_main_admin RPC failed`);
    assert.equal(flag.data, false, `${label}: account unexpectedly has main-admin privilege`);
  }

  // Test bookings are intentionally hidden from non-admin accounts.
  for (const [label, token] of [['traveler', traveler], ['owner', owner]]) {
    const rows = await rest(token, 'bookings?select=id,is_test&is_test=eq.true');
    assert.equal(rows.ok, true, `${label}: could not query test-booking visibility`);
    assert.deepEqual(rows.data, [], `${label}: test bookings are visible outside the admin account`);
  }

  const adminTests = await rest(admin, 'bookings?select=id,is_test&is_test=eq.true');
  assert.equal(adminTests.ok, true, 'Admin could not read test bookings');
  assert.ok(Array.isArray(adminTests.data), 'Admin test-booking response is not an array');

  // Non-admin roles must be denied at the RPC authorization guard.
  const forbiddenCalls = [
    ['traveler', traveler, 'admin_review_owner_booking',
      { p_booking_id: '00000000-0000-0000-0000-000000000000', p_action: 'approve', p_reason: 'security test' }],
    ['owner', owner, 'admin_review_payment_receipt',
      { p_booking_id: '00000000-0000-0000-0000-000000000000', p_action: 'verify', p_reason: 'security test' }],
  ];
  for (const [label, token, name, args] of forbiddenCalls) {
    const result = await rpc(token, name, args);
    assert.equal(result.ok, false, `${label}: unauthorized admin RPC unexpectedly succeeded`);
  }

  console.log('PASS: traveler and owner are not main admins');
  console.log('PASS: test bookings are hidden from traveler and owner');
  console.log(`PASS: main admin can read test bookings (${adminTests.data.length} rows)`);
  console.log('PASS: traveler and owner cannot execute tested admin operations');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
