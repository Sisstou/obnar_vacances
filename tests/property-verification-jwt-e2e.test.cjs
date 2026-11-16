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
assert.equal(new URL(base).hostname, STAGING_PROJECT_REF + '.supabase.co',
  'Refusing to run: target is not the isolated Staging project');
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.notEqual(serviceKey, anonKey, 'Service key must not be the anon key');
assert.ok(!serviceKey.startsWith('sb_publishable_'), 'A publishable key cannot be used as service key');

function headers({ token, service = false, extra = {} } = {}) {
  const h = { apikey: service ? serviceKey : anonKey, ...extra };
  if (service && serviceKey.startsWith('eyJ')) h.Authorization = 'Bearer ' + serviceKey;
  else if (!service && token) h.Authorization = 'Bearer ' + token;
  return h;
}
async function rest(path, { method = 'GET', token, service = false, body, prefer } = {}) {
  const h = headers({ token, service });
  if (body !== undefined) h['content-type'] = 'application/json';
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
async function denied(action, label) {
  let rejected = false;
  try { await action(); } catch { rejected = true; }
  assert.equal(rejected, true, label);
}
const fixtures = { propertyId: null };
const suffix = Date.now().toString(36);
let traveler, owner, admin;

async function main() {
  const adminRows = await rest(
    'platform_admins?select=user_id,is_main_admin&user_id=eq.' + USERS.admin,
    { service: true },
  );
  assert.equal(adminRows.length, 1);
  assert.equal(adminRows[0].is_main_admin, true);

  [traveler, owner, admin] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD),
    signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD),
  ]);

  const profileRows = await rest(
    'profiles?select=id,role&id=eq.' + USERS.owner,
    { service: true },
  );
  assert.equal(profileRows.length, 1);
  assert.equal(profileRows[0].role, 'owner', 'Test owner account must already be approved');

  const created = await rest('properties?select=id', {
    method: 'POST', service: true, prefer: 'return=representation',
    body: [{
      owner_id: USERS.owner,
      title_ar: 'CI test fixture property verification ' + suffix,
      title_fr: 'CI test fixture property verification ' + suffix,
      description_ar: 'Temporary Staging-only verification test fixture.',
      description_fr: 'Temporary Staging-only verification test fixture.',
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      capacity: 2,
      price_per_night: 1000,
      currency: 'DZD',
      status: 'draft',
    }],
  });
  assert.ok(created?.[0]?.id, 'Could not create Staging fixture property');
  fixtures.propertyId = created[0].id;

  const table = 'property_verifications?select=id,property_id,status,reviewed_by,reviewed_at';
  const submit = (token, status = 'pending', documentPath = 'ci-fixtures/' + suffix + '.pdf') =>
    rest(table, {
      method: 'POST', token, prefer: 'return=representation',
      body: [{ property_id: fixtures.propertyId, document_path: documentPath, status }],
    });

  // Only the authenticated owner of the property may submit, and submissions must start pending.
  await denied(() => submit(traveler), 'Non-owner was able to submit a property verification');
  await denied(() => submit(owner, 'approved'), 'Owner was able to self-approve a property verification');
  const first = await submit(owner, 'pending', 'ci-fixtures/' + suffix + '-first.pdf');
  assert.equal(first.length, 1);
  assert.equal(first[0].status, 'pending');
  assert.equal(first[0].reviewed_by, null);
  assert.equal(first[0].reviewed_at, null);
  console.log('PASS: property owner can submit pending verification; non-owner and owner self-approval are denied.');

  // A second pending request must be rejected by the partial unique index.
  await denied(
    () => submit(owner, 'pending', 'ci-fixtures/' + suffix + '-duplicate.pdf'),
    'Duplicate pending verification request was accepted',
  );
  console.log('PASS: duplicate pending verification is rejected.');

  // Only main admin can review; owner must not be able to alter the submitted status.
  await denied(
    () => rest('property_verifications?id=eq.' + first[0].id, {
      method: 'PATCH', token: owner, body: { status: 'approved' },
    }),
    'Owner was able to approve their own verification',
  );
  await denied(
    () => rest('property_verifications?id=eq.' + first[0].id, {
      method: 'PATCH', token: traveler, body: { status: 'approved' },
    }),
    'Traveler was able to review a property verification',
  );
  await rest('property_verifications?id=eq.' + first[0].id, {
    method: 'PATCH', token: admin,
    body: { status: 'approved', reviewed_by: USERS.admin, reviewed_at: new Date().toISOString() },
  });
  const approved = await rest('property_verifications?id=eq.' + first[0].id, { service: true });
  assert.equal(approved.length, 1);
  assert.equal(approved[0].status, 'approved');
  assert.equal(approved[0].reviewed_by, USERS.admin);
  console.log('PASS: only main admin can approve a property verification.');

  // Once the prior request is reviewed, the owner may submit a new pending request.
  const second = await submit(owner, 'pending', 'ci-fixtures/' + suffix + '-resubmission.pdf');
  assert.equal(second.length, 1);
  assert.equal(second[0].status, 'pending');
  await rest('property_verifications?id=eq.' + second[0].id, {
    method: 'PATCH', token: admin,
    body: { status: 'rejected', reviewed_by: USERS.admin, reviewed_at: new Date().toISOString() },
  });
  const finalRows = await rest('property_verifications?select=id,status&property_id=eq.' + fixtures.propertyId, {
    service: true,
  });
  assert.equal(finalRows.length, 2);
  assert.deepEqual(finalRows.map(row => row.status).sort(), ['approved', 'rejected']);
  console.log('PASS: owner can resubmit after review; admin rejection is persisted.');
  console.log('PASS: all property verification JWT end-to-end scenarios completed against isolated Staging.');
}

main()
  .catch(error => {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (fixtures.propertyId) {
      try {
        await rest('notifications?entity_id=eq.' + fixtures.propertyId, { method: 'DELETE', service: true });
        await rest('properties?id=eq.' + fixtures.propertyId, { method: 'DELETE', service: true });
        console.log('CLEANUP: temporary Staging property and cascading verification rows deleted.');
      } catch (error) {
        console.error('CLEANUP FAILURE: manual Staging cleanup may be required:', error.message);
        process.exitCode = 1;
      }
    }
  });
