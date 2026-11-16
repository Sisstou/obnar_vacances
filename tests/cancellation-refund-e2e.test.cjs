const assert = require('node:assert/strict');

const STAGING_PROJECT_REF = 'rhxeclddohpwtpzkruzm';
const USERS = {
  traveler: 'c0a51947-db42-49f5-b215-74f8f6cc186b',
  owner: 'd4b045df-d356-4c25-be54-608bf76a17a2',
  admin: '7d223c09-1df3-4438-ab55-9caa92eaefc2',
};

const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'TRAVELER_EMAIL', 'TRAVELER_PASSWORD',
  'OWNER_EMAIL', 'OWNER_PASSWORD',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
];
for (const name of required) {
  assert.ok(process.env[name], 'Missing required GitHub Actions secret: ' + name);
}

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const parsedUrl = new URL(base);

// Fail closed before any write unless this is the dedicated Staging project.
assert.equal(parsedUrl.hostname, STAGING_PROJECT_REF + '.supabase.co',
  'Refusing to run: SUPABASE_URL is not the dedicated Staging project');

const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.notEqual(serviceKey, anonKey, 'Service key must not be the publishable/anon key');
assert.ok(!serviceKey.startsWith('sb_publishable_'),
  'Service key secret contains a publishable key, not a server secret');

function hasServiceRoleClaim(key) {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}
assert.ok(hasServiceRoleClaim(serviceKey),
  'SUPABASE_SERVICE_ROLE_KEY must be an sb_secret_ key or a service_role JWT');

const created = { properties: [], bookings: [], cancellations: [] };

async function request(path, { method = 'GET', token, service = false, body, prefer } = {}) {
  const headers = {
    apikey: service ? serviceKey : anonKey,
  };
  if (service && serviceKey.startsWith('eyJ')) {
    // Legacy service_role keys are JWTs; send them as both the API key
    // and bearer credential so PostgREST receives the service_role claim.
    headers.Authorization = 'Bearer ' + serviceKey;
  } else if (!service && token) {
    headers.Authorization = 'Bearer ' + token;
  }
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(base + '/rest/v1/' + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const message = data && typeof data === 'object' ? (data.message || data.error || JSON.stringify(data)) : String(data);
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
  assert.equal(response.ok, true, 'Sign-in failed for a configured Staging test account (HTTP ' + response.status + ')');
  assert.ok(data.access_token, 'Auth response did not contain an access token');
  return data.access_token;
}

async function rpc(token, name, args = {}) {
  return request('rpc/' + name, { method: 'POST', token, body: args });
}

function localDatePlus(days) {
  // Algeria is UTC+1. Use a date-only value so RPC date comparisons match local business dates.
  const now = new Date(Date.now() + 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + days);
  return now.toISOString().slice(0, 10);
}

async function createFixture(label, checkInOffset, travelerId, ownerId) {
  const suffix = Date.now().toString(36) + '-' + label;
  const propertyRows = await request('properties?select=id', {
    method: 'POST',
    service: true,
    prefer: 'return=representation',
    body: [{
      owner_id: ownerId,
      title_ar: 'CI test fixture ' + suffix,
      title_fr: 'CI test fixture ' + suffix,
      description_ar: 'Temporary automated test fixture; must be deleted.',
      description_fr: 'Temporary automated test fixture; must be deleted.',
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      capacity: 4,
      price_per_night: 5000,
      currency: 'DZD',
      status: 'approved',
    }],
  });
  assert.ok(Array.isArray(propertyRows) && propertyRows[0]?.id, 'Could not create temporary Staging property');
  const propertyId = propertyRows[0].id;
  created.properties.push(propertyId);

  const checkIn = localDatePlus(checkInOffset);
  const checkOut = localDatePlus(checkInOffset + 1);
  const bookingRows = await request('bookings?select=id', {
    method: 'POST',
    service: true,
    prefer: 'return=representation',
    body: [{
      property_id: propertyId,
      traveler_id: travelerId,
      check_in: checkIn,
      check_out: checkOut,
      guests: 2,
      total_price: 5500,
      status: 'confirmed',
      deposit_amount: 1000,
      payment_receipt_path: 'ci-fixtures/' + suffix + '.txt',
      payment_status: 'verified',
      payment_verified_at: new Date().toISOString(),
      refund_status: 'not_applicable',
      is_test: false,
    }],
  });
  assert.ok(Array.isArray(bookingRows) && bookingRows[0]?.id, 'Could not create temporary Staging booking');
  const bookingId = bookingRows[0].id;
  created.bookings.push(bookingId);
  return { propertyId, bookingId, checkIn, checkOut };
}

async function readCancellation(id) {
  const rows = await request(
    'booking_cancellations?select=id,request_status,requester_role,refund_eligibility,refund_amount,refund_execution_status&id=eq.' + id,
    { service: true }
  );
  assert.equal(rows.length, 1, 'Cancellation record was not found');
  return rows[0];
}

async function readBooking(id) {
  const rows = await request(
    'bookings?select=id,status,refund_status,payment_status,deposit_amount&id=eq.' + id,
    { service: true }
  );
  assert.equal(rows.length, 1, 'Booking record was not found');
  return rows[0];
}

async function cleanup() {
  // Discover cancellations by booking as well as by captured id, so cleanup still works
  // if an assertion fails immediately after a successful RPC response.
  const cancellationIds = new Set(created.cancellations);
  for (const bookingId of created.bookings) {
    const rows = await request('booking_cancellations?select=id&booking_id=eq.' + bookingId, { service: true });
    for (const row of rows) cancellationIds.add(row.id);
  }
  // History and notifications are written by the real RPCs; remove dependent rows first.
  for (const id of cancellationIds) {
    await request('booking_cancellation_history?cancellation_id=eq.' + id, {
      method: 'DELETE', service: true,
    });
    await request('notifications?entity_type=eq.booking_cancellation&entity_id=eq.' + id, {
      method: 'DELETE', service: true,
    });
    await request('booking_cancellations?id=eq.' + id, { method: 'DELETE', service: true });
  }
  for (const id of created.bookings) {
    await request('bookings?id=eq.' + id, { method: 'DELETE', service: true });
  }
  for (const id of created.properties) {
    await request('properties?id=eq.' + id, { method: 'DELETE', service: true });
  }
}

async function main() {
  // Validate the privileged key and known Staging identities before creating any fixtures.
  const adminRows = await request('platform_admins?select=user_id,is_main_admin&user_id=eq.' + USERS.admin, { service: true });
  assert.equal(adminRows.length, 1, 'Configured Staging admin row is missing');
  assert.equal(adminRows[0].is_main_admin, true, 'Configured Staging admin is not marked as main admin');
  const profileRows = await request('profiles?select=id&id=in.(' + [USERS.traveler, USERS.owner, USERS.admin].join(',') + ')', { service: true });
  assert.equal(profileRows.length, 3, 'Expected all three known Staging test profiles');

  const [traveler, owner, admin] = await Promise.all([
    signIn(process.env.TRAVELER_EMAIL, process.env.TRAVELER_PASSWORD),
    signIn(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD),
    signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD),
  ]);

  const adminFlag = await rpc(admin, 'is_main_admin');
  assert.equal(adminFlag, true, 'Configured admin test account is not the main administrator');
  assert.equal(await rpc(traveler, 'is_main_admin'), false, 'Traveler unexpectedly has main-admin privileges');
  assert.equal(await rpc(owner, 'is_main_admin'), false, 'Owner unexpectedly has main-admin privileges');

  // 1. Traveler cancellation at least five days before arrival: immediate cancellation + eligible refund.
  {
    const fixture = await createFixture('traveler-early', 10, USERS.traveler, USERS.owner);
    const result = await rpc(traveler, 'request_booking_cancellation', {
      p_booking_id: fixture.bookingId,
      p_reason_category: 'traveler_change',
      p_reason_details: 'Automated Staging test: early traveler cancellation.',
    });
    assert.equal(result.request_status, 'approved');
    assert.equal(result.booking_cancelled, true);
    assert.equal(result.refund_eligibility, 'eligible');
    created.cancellations.push(result.cancellation_id);

    const cancellation = await readCancellation(result.cancellation_id);
    const booking = await readBooking(fixture.bookingId);
    assert.equal(cancellation.refund_amount, 1000);
    assert.equal(cancellation.refund_execution_status, 'pending');
    assert.equal(booking.status, 'cancelled');
    assert.equal(booking.refund_status, 'pending');
    assert.notEqual(booking.refund_status, 'refunded');
    console.log('PASS: traveler early cancellation grants eligibility; no payment is marked as transferred.');
  }

  // 2. Traveler cancellation within five days: owner review, then admin decides refund eligibility.
  {
    const fixture = await createFixture('traveler-exception', 2, USERS.traveler, USERS.owner);
    const result = await rpc(traveler, 'request_booking_cancellation', {
      p_booking_id: fixture.bookingId,
      p_reason_category: 'family_emergency',
      p_reason_details: 'Automated Staging test: exceptional short-notice cancellation.',
    });
    assert.equal(result.request_status, 'owner_review');
    assert.equal(result.booking_cancelled, false);
    created.cancellations.push(result.cancellation_id);

    const ownerResult = await rpc(owner, 'owner_respond_to_cancellation', {
      p_cancellation_id: result.cancellation_id,
      p_action: 'approve',
      p_notes: 'Automated Staging owner approval.',
    });
    assert.ok(ownerResult && ownerResult.success !== false, 'Owner approval did not succeed');

    const afterOwner = await readCancellation(result.cancellation_id);
    const bookingAfterOwner = await readBooking(fixture.bookingId);
    assert.equal(afterOwner.request_status, 'approved');
    assert.equal(afterOwner.refund_eligibility, 'admin_review');
    assert.equal(bookingAfterOwner.status, 'cancelled');

    const forbidden = await request('rpc/admin_review_booking_cancellation', {
      method: 'POST',
      token: traveler,
      body: {
        p_cancellation_id: result.cancellation_id,
        p_cancel_action: 'none',
        p_refund_action: 'approve',
        p_notes: 'Must be denied for traveler.',
      },
    }).then(() => false, () => true);
    assert.equal(forbidden, true, 'Traveler unexpectedly executed admin refund review');

    const adminResult = await rpc(admin, 'admin_review_booking_cancellation', {
      p_cancellation_id: result.cancellation_id,
      p_cancel_action: 'none',
      p_refund_action: 'approve',
      p_notes: 'Automated Staging admin refund eligibility approval.',
    });
    assert.equal(adminResult.refund_eligibility, 'eligible');
    assert.equal(adminResult.refund_execution_status, 'pending');

    const finalCancellation = await readCancellation(result.cancellation_id);
    const finalBooking = await readBooking(fixture.bookingId);
    assert.equal(finalCancellation.refund_amount, 1000);
    assert.equal(finalCancellation.refund_execution_status, 'pending');
    assert.equal(finalBooking.refund_status, 'pending');
    assert.notEqual(finalBooking.refund_status, 'refunded');
    console.log('PASS: exceptional cancellation requires owner review and main-admin refund decision.');
  }

  // 3. Owner cancellation: full verified deposit becomes eligible without a re-rental condition.
  {
    const fixture = await createFixture('owner-cancel', 8, USERS.traveler, USERS.owner);
    const result = await rpc(owner, 'request_booking_cancellation', {
      p_booking_id: fixture.bookingId,
      p_reason_category: 'owner_cancellation',
      p_reason_details: 'Automated Staging test: owner initiated cancellation.',
    });
    assert.equal(result.request_status, 'approved');
    assert.equal(result.booking_cancelled, true);
    assert.equal(result.refund_eligibility, 'eligible');
    created.cancellations.push(result.cancellation_id);

    const cancellation = await readCancellation(result.cancellation_id);
    const booking = await readBooking(fixture.bookingId);
    assert.equal(cancellation.refund_amount, 1000);
    assert.equal(cancellation.refund_execution_status, 'pending');
    assert.equal(booking.status, 'cancelled');
    assert.equal(booking.refund_status, 'pending');
    console.log('PASS: owner cancellation grants full-deposit eligibility without asserting an actual transfer.');
  }

  // 4. Material property mismatch at arrival: urgent admin review and mandatory full refund eligibility.
  {
    const fixture = await createFixture('arrival-mismatch', 0, USERS.traveler, USERS.owner);
    const result = await rpc(traveler, 'request_booking_cancellation', {
      p_booking_id: fixture.bookingId,
      p_reason_category: 'water_unavailable',
      p_reason_details: 'Automated Staging test: material water-service mismatch at arrival.',
    });
    assert.equal(result.request_status, 'admin_review');
    assert.equal(result.booking_cancelled, false);
    created.cancellations.push(result.cancellation_id);

    const forbidden = await request('rpc/admin_review_booking_cancellation', {
      method: 'POST',
      token: owner,
      body: {
        p_cancellation_id: result.cancellation_id,
        p_cancel_action: 'approve',
        p_refund_action: 'approve',
        p_notes: 'Must be denied for owner.',
      },
    }).then(() => false, () => true);
    assert.equal(forbidden, true, 'Owner unexpectedly executed main-admin cancellation review');

    const adminResult = await rpc(admin, 'admin_review_booking_cancellation', {
      p_cancellation_id: result.cancellation_id,
      p_cancel_action: 'approve',
      p_refund_action: 'approve',
      p_notes: 'Automated Staging approval for material arrival mismatch.',
    });
    assert.equal(adminResult.request_status, 'approved');
    assert.equal(adminResult.refund_eligibility, 'eligible');
    assert.equal(adminResult.refund_execution_status, 'pending');

    const cancellation = await readCancellation(result.cancellation_id);
    const booking = await readBooking(fixture.bookingId);
    assert.equal(cancellation.refund_amount, 1000);
    assert.equal(booking.status, 'cancelled');
    assert.equal(booking.refund_status, 'pending');
    console.log('PASS: material mismatch at arrival is escalated to admin and grants full-refund eligibility.');
  }

  console.log('PASS: all 4 cancellation/refund JWT end-to-end scenarios completed against Staging.');
}

main()
  .catch((error) => {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log('CLEANUP: temporary Staging fixtures and related history/notifications deleted.');
    } catch (error) {
      console.error('CLEANUP FAILURE: manual Staging cleanup may be required:', error.message);
      process.exitCode = 1;
    }
  });
