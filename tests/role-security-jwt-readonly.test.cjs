const assert = require('node:assert/strict');

const STAGING_PROJECT_REF = 'rhxeclddohpwtpzkruzm';
const FIXTURES = {
  traveler: 'c0a51947-db42-49f5-b215-74f8f6cc186b',
  owner: 'd4b045df-d356-4c25-be54-608bf76a17a2',
  admin: '7d223c09-1df3-4438-ab55-9caa92eaefc2',
  draftProperty: 'eff1fcb8-c2e3-42a2-ac88-dabfbe77b21e',
  draftImage: '10088f58-ad04-4aad-ae49-1c8c9a710dd3',
};

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TRAVELER_EMAIL',
  'TRAVELER_PASSWORD',
  'OWNER_EMAIL',
  'OWNER_PASSWORD',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

for (const name of REQUIRED) {
  assert.ok(process.env[name], `Missing required GitHub Actions secret: ${name}`);
}

const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
const parsedUrl = new URL(baseUrl);
assert.equal(
  parsedUrl.hostname,
  `${STAGING_PROJECT_REF}.supabase.co`,
  'Refusing to run: SUPABASE_URL is not the approved isolated Staging project.',
);

const anonKey = process.env.SUPABASE_ANON_KEY;

async function signIn(email, password, label) {
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  assert.equal(response.ok, true, `${label}: sign-in failed (HTTP ${response.status}).`);
  assert.ok(data.access_token, `${label}: auth response did not contain an access token.`);
  assert.ok(data.user?.id, `${label}: auth response did not contain a user ID.`);

  return { token: data.access_token, userId: data.user.id };
}

async function request(path, token, options = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  return { status: response.status, ok: response.ok, data };
}

async function rpc(token, name, args = {}) {
  return request(`rpc/${name}`, token, {
    method: 'POST',
    body: args,
  });
}

async function expectRows(label, result, expectedCount, predicate = () => true) {
  assert.equal(result.ok, true, `${label}: REST request failed (HTTP ${result.status}).`);
  assert.ok(Array.isArray(result.data), `${label}: expected an array response.`);
  assert.equal(result.data.length, expectedCount, `${label}: unexpected row count.`);
  assert.ok(result.data.every(predicate), `${label}: returned row did not match expected fixture.`);
}

async function main() {
  const [traveler, owner, admin] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD, 'TRAVELER'),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD, 'OWNER'),
    signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'ADMIN'),
  ]);

  assert.equal(traveler.userId, FIXTURES.traveler, 'TRAVELER credentials do not match the approved Staging fixture.');
  assert.equal(owner.userId, FIXTURES.owner, 'OWNER credentials do not match the approved Staging fixture.');
  assert.equal(admin.userId, FIXTURES.admin, 'ADMIN credentials do not match the approved Staging fixture.');

  // Confirm each account's effective profile visibility without reading other users' data.
  const [travelerProfile, ownerProfile, adminProfile] = await Promise.all([
    request(`profiles?select=id,role&id=eq.${FIXTURES.traveler}`, traveler.token),
    request(`profiles?select=id,role&id=eq.${FIXTURES.owner}`, owner.token),
    request(`profiles?select=id&id=eq.${FIXTURES.admin}`, admin.token),
  ]);
  await expectRows('Traveler self-profile', travelerProfile, 1,
    row => row.id === FIXTURES.traveler && row.role === 'traveler');
  await expectRows('Owner self-profile', ownerProfile, 1,
    row => row.id === FIXTURES.owner && row.role === 'owner');
  await expectRows('Admin self-profile', adminProfile, 1,
    row => row.id === FIXTURES.admin);

  // Non-admin users must not read another account's profile.
  const [travelerReadsOwner, ownerReadsTraveler] = await Promise.all([
    request(`profiles?select=id&id=eq.${FIXTURES.owner}`, traveler.token),
    request(`profiles?select=id&id=eq.${FIXTURES.traveler}`, owner.token),
  ]);
  await expectRows('Traveler cross-profile isolation', travelerReadsOwner, 0);
  await expectRows('Owner cross-profile isolation', ownerReadsTraveler, 0);

  // Main-admin status is derived from platform_admins, not the profile role label.
  const [travelerAdminFlag, ownerAdminFlag, adminFlag] = await Promise.all([
    rpc(traveler.token, 'is_main_admin'),
    rpc(owner.token, 'is_main_admin'),
    rpc(admin.token, 'is_main_admin'),
  ]);
  assert.equal(travelerAdminFlag.ok, true, 'Traveler could not query the admin-status helper.');
  assert.equal(ownerAdminFlag.ok, true, 'Owner could not query the admin-status helper.');
  assert.equal(adminFlag.ok, true, 'Admin could not query the admin-status helper.');
  assert.equal(travelerAdminFlag.data, false, 'Traveler unexpectedly has main-admin status.');
  assert.equal(ownerAdminFlag.data, false, 'Owner unexpectedly has main-admin status.');
  assert.equal(adminFlag.data, true, 'Configured ADMIN account is not the main administrator.');

  // The same draft property and image fixture must be visible to its owner/admin,
  // but not to a different authenticated traveler.
  const propertyPath = `properties?select=id,status,owner_id&id=eq.${FIXTURES.draftProperty}`;
  const imagePath = `property_images?select=id,property_id&id=eq.${FIXTURES.draftImage}`;
  const [travelerProperty, ownerProperty, adminProperty] = await Promise.all([
    request(propertyPath, traveler.token),
    request(propertyPath, owner.token),
    request(propertyPath, admin.token),
  ]);
  await expectRows('Traveler cannot read another owner\'s draft property', travelerProperty, 0);
  await expectRows('Owner can read own draft property', ownerProperty, 1,
    row => row.id === FIXTURES.draftProperty && row.status === 'draft' && row.owner_id === FIXTURES.owner);
  await expectRows('Admin can read draft property', adminProperty, 1,
    row => row.id === FIXTURES.draftProperty && row.status === 'draft');

  const [travelerImage, ownerImage, adminImage] = await Promise.all([
    request(imagePath, traveler.token),
    request(imagePath, owner.token),
    request(imagePath, admin.token),
  ]);
  await expectRows('Traveler cannot read another owner\'s draft image metadata', travelerImage, 0);
  await expectRows('Owner can read own draft image metadata', ownerImage, 1,
    row => row.id === FIXTURES.draftImage && row.property_id === FIXTURES.draftProperty);
  await expectRows('Admin can read draft image metadata', adminImage, 1,
    row => row.id === FIXTURES.draftImage && row.property_id === FIXTURES.draftProperty);

  // These admin RPCs must fail at their explicit authorization guard for non-admin JWTs.
  // The function checks admin status before looking up the supplied booking ID.
  const forbiddenCalls = [
    ['Traveler', traveler.token],
    ['Owner', owner.token],
  ];
  for (const [label, token] of forbiddenCalls) {
    const result = await rpc(token, 'admin_review_owner_booking', {
      p_booking_id: '00000000-0000-0000-0000-000000000000',
      p_action: 'approve',
      p_reason: 'read-only JWT authorization check',
    });
    assert.equal(result.ok, false, `${label}: unauthorized admin RPC unexpectedly succeeded.`);
    assert.equal(
      result.data?.message,
      'Main admin access required',
      `${label}: RPC failed for a reason other than the explicit main-admin authorization guard.`,
    );
  }

  console.log('PASS: all three credentials resolve to the expected Staging test accounts.');
  console.log('PASS: traveler and owner can read only their own profile; cross-profile reads return zero rows.');
  console.log('PASS: only the configured admin account has main-admin status.');
  console.log('PASS: draft property and image metadata are visible only to the owner and main admin.');
  console.log('PASS: traveler and owner are rejected by the explicit admin RPC authorization guard.');
  console.log('RESULT: all read-only authenticated role checks passed.');
}

main().catch(error => {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
});
