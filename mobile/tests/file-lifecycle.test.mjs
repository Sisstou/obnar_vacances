import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildVersionedStoragePath,
  getStorageBucketPolicy,
  validateStorageUpload,
} from '../src/services/file-lifecycle.ts';

test('builds a versioned property image path with two folders', () => {
  const result = buildVersionedStoragePath({
    bucket: 'property-images',
    primaryId: 'owner-123',
    secondaryId: 'property-456',
    fileName: 'front.jpg',
    version: 2,
  });

  assert.deepEqual(result, {
    ok: true,
    data: 'owner-123/property-456/front_v2.jpg',
  });
});

test('builds a payment receipt path with exactly two folders', () => {
  const result = buildVersionedStoragePath({
    bucket: 'payment-receipts',
    primaryId: 'traveler-123',
    secondaryId: 'booking-456',
    fileName: 'receipt.pdf',
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data, 'traveler-123/booking-456/receipt_v1.pdf');
});

test('rejects a payment receipt path with an extra folder', () => {
  const result = validateStorageUpload({
    bucket: 'payment-receipts',
    path: 'traveler-123/booking-456/archive/receipt_v1.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1000,
  });

  assert.equal(result.ok, false);
});

test('rejects a file larger than the five-megabyte bucket limit', () => {
  const policy = getStorageBucketPolicy('owner-documents');
  assert.ok(policy);

  const result = validateStorageUpload({
    bucket: 'owner-documents',
    path: 'owner-123/document_v1.pdf',
    contentType: 'application/pdf',
    sizeBytes: policy.maxBytes + 1,
  });

  assert.equal(result.ok, false);
});

test('rejects a MIME type that is not allowed in image buckets', () => {
  const result = validateStorageUpload({
    bucket: 'property-images',
    path: 'owner-123/property-456/photo_v1.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1000,
  });

  assert.equal(result.ok, false);
});

test('rejects path traversal segments', () => {
  const result = validateStorageUpload({
    bucket: 'owner-documents',
    path: 'owner-123/../document_v1.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1000,
  });

  assert.equal(result.ok, false);
});

test('rejects unsafe identifiers and filenames when generating paths', () => {
  const result = buildVersionedStoragePath({
    bucket: 'refund-proofs',
    primaryId: '../cancellation',
    fileName: 'proof.pdf',
  });

  assert.equal(result.ok, false);
});
