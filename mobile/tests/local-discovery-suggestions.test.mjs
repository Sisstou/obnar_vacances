import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDiscoverySuggestions } from '../src/lib/local-discovery-suggestions.mjs';

test('returns four Arabic discovery categories with stable identifiers', () => {
  const items = getLocalDiscoverySuggestions('ar');
  assert.equal(items.length, 4);
  assert.deepEqual(items.map((item) => item.id), ['coast', 'nature', 'heritage', 'activities']);
  assert.ok(items.every((item) => item.title.length > 0 && item.description.length > 0));
});

test('returns French discovery categories', () => {
  const items = getLocalDiscoverySuggestions('fr');
  assert.equal(items.length, 4);
  assert.equal(items[0].title, 'Plages et littoral');
  assert.ok(items.every((item) => item.title.length > 0 && item.description.length > 0));
});

test('defaults to Arabic', () => {
  assert.equal(getLocalDiscoverySuggestions()[0].title, 'الشواطئ والساحل');
});
