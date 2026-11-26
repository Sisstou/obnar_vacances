const assert = require('node:assert/strict');

const STAGING_PROJECT_REF = 'rhxeclddohpwtpzkruzm';
const OWNER_ID = 'd4b045df-d356-4c25-be54-608bf76a17a2';
const OTHER_USER_ID = 'c0a51947-db42-49f5-b215-74f8f6cc186b';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a4sAAAAASUVORK5CYII=',
  'base64',
);

for (const name of [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'OWNER_EMAIL', 'OWNER_PASSWORD',
]) {
  assert.ok(process.env[name], 'Missing GitHub Actions secret: ' + name);
}

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
assert.equal(
  new URL(base).hostname,
  STAGING_PROJECT_REF + '.supabase.co',
  'Refusing to run: target is not the isolated Staging project',
);

const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.notEqual(serviceKey, anonKey, 'Service key must not be the anon key');

function headers({ token, service = false, contentType } = {}) {
  const key = service ? serviceKey : anonKey;
  const h = { apikey: key, Authorization: 'Bearer ' + (service ? serviceKey : token) };
  if (contentType) h['content-type'] = contentType;
  return h;
}

async function rest(path, { method = 'GET', token, service = false, body, prefer } = {}) {
  const h = headers({ token, service, contentType: body === undefined ? undefined : 'application/json' });
  if (prefer) h.Prefer = prefer;
  const response = await fetch(base + '/rest/v1/' + path, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
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

async function uploadFixture(path) {
  const response = await fetch(base + '/storage/v1/object/owner-documents/' + path, {
    method: 'POST',
    headers: headers({ service: true, contentType: 'image/png' }),
    body: PNG,
  });
  assert.equal(response.ok, true, 'Could not seed synthetic Storage fixture ' + path + ' (' + response.status + '): ' + await response.text());
}

async function denied(action, label) {
  let failure;
  try { await action(); } catch (error) { failure = error; }
  assert.ok(failure, label);
  assert.match(
    failure.message,
    /failed \((400|401|403|409)\)/,
    label + ' (expected an authorization or constraint rejection, not an infrastructure error)',
  );
}

const fixture = { propertyId: null, paths: [] };
const suffix = Date.now().toString(36);

async function main() {
  const owner = await signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD);

  const profile = await rest('profiles?select=id,role&id=eq.' + OWNER_ID, { service: true });
  assert.equal(profile.length, 1, 'Configured owner profile was not found');
  assert.equal(profile[0].role, 'owner', 'Configured test account must already be an approved owner');

  const created = await rest('properties?select=id', {
    method: 'POST',
    service: true,
    prefer: 'return=representation',
    body: [{
      owner_id: OWNER_ID,
      title_ar: 'CI property verification document fixture ' + suffix,
      title_fr: 'CI property verification document fixture ' + suffix,
      description_ar: 'Temporary Staging-only fixture.',
      description_fr: 'Temporary Staging-only fixture.',
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      capacity: 2,
      price_per_night: 1000,
      currency: 'DZD',
      status: 'draft',
    }],
  });
  assert.ok(created?.[0]?.id, 'Could not create temporary Staging property');
  fixture.propertyId = created[0].id;

  const validPath = OWNER_ID + '/properties/' + fixture.propertyId + '/ci-property-verification-' + suffix + '.png';
  const foreignOwnerPath = OTHER_USER_ID + '/properties/' + fixture.propertyId + '/ci-foreign-owner-' + suffix + '.png';
  const wrongPropertyPath = OWNER_ID + '/properties/00000000-0000-0000-0000-000000000000/ci-wrong-property-' + suffix + '.png';
  const missingPath = OWNER_ID + '/properties/' + fixture.propertyId + '/ci-missing-' + suffix + '.png';

  for (const path of [validPath, foreignOwnerPath, wrongPropertyPath]) {
    await uploadFixture(path);
    fixture.paths.push(path);
  }

  const submit = (documentPath) => rest('property_verifications?select=id,property_id,status,document_path', {
    method: 'POST',
    token: owner,
    prefer: 'return=representation',
    body: [{
      property_id: fixture.propertyId,
      document_path: documentPath,
      status: 'pending',
    }],
  });

  await denied(
    () => submit(missingPath),
    'A verification request referencing a missing Storage object was accepted',
  );
  console.log('PASS: missing document object is rejected.');

  await denied(
    () => submit(foreignOwnerPath),
    'A verification request referencing another user folder was accepted',
  );
  console.log('PASS: document path must be inside the authenticated owner UID folder.');

  await denied(
    () => submit(wrongPropertyPath),
    'A verification request referencing a different property folder was accepted',
  );
  console.log('PASS: document path must be bound to the exact property ID.');

  const accepted = await submit(validPath);
  assert.equal(accepted.length, 1, 'Owner could not submit a valid property verification document');
  assert.equal(accepted[0].status, 'pending');
  assert.equal(accepted[0].property_id, fixture.propertyId);
  assert.equal(accepted[0].document_path, validPath);
  console.log('PASS: owner can submit a pending request referencing an existing document for their own property.');

  await denied(
    () => submit(validPath),
    'A second pending verification request for the same property was accepted',
  );
  console.log('PASS: existing one-pending-request-per-property constraint remains effective.');
  console.log('PASS: property verification document binding scenarios completed against isolated Staging.');
}

main()
  .catch(error => {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (fixture.propertyId) {
      try {
        await rest('notifications?entity_id=eq.' + fixture.propertyId, { method: 'DELETE', service: true });
        await rest('properties?id=eq.' + fixture.propertyId, { method: 'DELETE', service: true });
        console.log('CLEANUP: temporary Staging property and related verification rows deleted.');
      } catch (error) {
        console.error('CLEANUP FAILURE: manual Staging property cleanup may be required:', error.message);
        process.exitCode = 1;
      }
    }

    if (fixture.paths.length) {
      try {
        const response = await fetch(base + '/storage/v1/object/owner-documents', {
          method: 'DELETE',
          headers: headers({ service: true, contentType: 'application/json' }),
          body: JSON.stringify({ prefixes: fixture.paths }),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + await response.text());
        console.log('CLEANUP: synthetic Storage fixtures deleted.');
      } catch (error) {
        console.error('CLEANUP FAILURE: manual Storage cleanup may be required:', error.message);
        process.exitCode = 1;
      }
    }
  });
