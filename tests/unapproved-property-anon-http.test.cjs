#!/usr/bin/env node
'use strict';

// Read-only HTTP regression check. Uses only the public anon key.
// No sign-in, writes, service-role key, or database mutations.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const EXPECTED_PROJECT_HOST = 'rhxeclddohpwtpzkruzm.supabase.co';
const PROPERTY_ID = 'eff1fcb8-c2e3-42a2-ac88-dabfbe77b21e';
const IMAGE_ID = '10088f58-ad04-4aad-ae49-1c8c9a710dd3';
const STORAGE_PATH = 'd4b045df-d356-4c25-be54-608bf76a17a2/eff1fcb8-c2e3-42a2-ac88-dabfbe77b21e/1794943856628_1vyu1ub.jpg';

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Required GitHub secrets SUPABASE_URL and SUPABASE_ANON_KEY are not configured.');
  }

  const base = new URL(SUPABASE_URL);
  if (base.protocol !== 'https:' || base.hostname !== EXPECTED_PROJECT_HOST) {
    throw new Error('Safety stop: SUPABASE_URL does not point to the approved OBNAR VACANCES Staging project.');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
  };

  const propertyUrl = new URL('/rest/v1/properties', base);
  propertyUrl.search = new URLSearchParams({
    select: 'id,status',
    id: `eq.${PROPERTY_ID}`,
  }).toString();

  const propertyResponse = await fetch(propertyUrl, { headers });
  if (!propertyResponse.ok) {
    throw new Error(`Property REST check returned HTTP ${propertyResponse.status}; response body intentionally suppressed.`);
  }
  const propertyRows = await propertyResponse.json();
  if (!Array.isArray(propertyRows) || propertyRows.length !== 0) {
    fail('Anonymous REST request exposed the unapproved property or returned an unexpected response.');
  } else {
    console.log('PASS: anonymous REST read returned zero rows for the unapproved property.');
  }

  const imageUrl = new URL('/rest/v1/property_images', base);
  imageUrl.search = new URLSearchParams({
    select: 'id,storage_path',
    id: `eq.${IMAGE_ID}`,
    property_id: `eq.${PROPERTY_ID}`,
  }).toString();

  const imageResponse = await fetch(imageUrl, { headers });
  if (!imageResponse.ok) {
    throw new Error(`Property-image REST check returned HTTP ${imageResponse.status}; response body intentionally suppressed.`);
  }
  const imageRows = await imageResponse.json();
  if (!Array.isArray(imageRows) || imageRows.length !== 0) {
    fail('Anonymous REST request exposed the image metadata or returned an unexpected response.');
  } else {
    console.log('PASS: anonymous REST read returned zero rows for the image metadata.');
  }

  const encodedPath = STORAGE_PATH.split('/').map(encodeURIComponent).join('/');
  const signUrl = new URL(`/storage/v1/object/sign/property-images/${encodedPath}`, base);
  const signResponse = await fetch(signUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 60 }),
  });

  const signBody = await signResponse.text();
  let signJson = null;
  try { signJson = JSON.parse(signBody); } catch { /* Non-JSON error bodies are acceptable if access is denied. */ }

  const signedUrlFound =
    (signJson && (typeof signJson.signedURL === 'string' || typeof signJson.signedUrl === 'string')) ||
    /"signedURL"\s*:|"signedUrl"\s*:/.test(signBody);

  if (signResponse.ok || signedUrlFound) {
    fail('Anonymous Storage signing request unexpectedly succeeded or returned a signed URL.');
  } else {
    console.log(`PASS: anonymous Storage signing request was denied (HTTP ${signResponse.status}); no signed URL returned.`);
  }

  if (process.exitCode) {
    throw new Error('One or more anonymous-access checks failed.');
  }
  console.log('RESULT: all three anonymous-access checks passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
