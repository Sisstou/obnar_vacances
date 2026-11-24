import assert from 'node:assert/strict';
import test from 'node:test';

import { toAppError } from '../src/lib/errors.ts';

test('uses a safe fallback for unknown values', () => {
  const result = toAppError('unexpected');
  assert.equal(result.code, 'unknown_error');
  assert.equal(result.message, 'حدث خطأ غير متوقع. حاول مرة أخرى.');
  assert.equal(result.retryable, false);
});

test('marks transient HTTP server responses as retryable', () => {
  const result = toAppError({ status: 503, message: 'Service unavailable' });
  assert.equal(result.code, '503');
  assert.equal(result.retryable, true);
});

test('does not mark ordinary client validation errors as retryable', () => {
  const result = toAppError({ status: 400, message: 'Invalid request' });
  assert.equal(result.retryable, false);
});

test('recognizes common network failure messages', () => {
  const result = toAppError(new TypeError('Failed to fetch'));
  assert.equal(result.retryable, true);
});

test('preserves a supplied service error code', () => {
  const result = toAppError({ code: 'invalid_credentials', message: 'Invalid login' });
  assert.equal(result.code, 'invalid_credentials');
  assert.equal(result.message, 'Invalid login');
  assert.equal(result.retryable, false);
});
