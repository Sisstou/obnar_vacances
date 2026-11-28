import test from 'node:test';
import assert from 'node:assert/strict';
import { getCategoryAccessibilityLabel } from '../src/lib/category-accessibility.mjs';

test('Arabic category labels announce listing count', () => {
  assert.equal(getCategoryAccessibilityLabel('ar', 'شقق', 12), 'شقق، 12 إقامة');
});
test('French category labels announce listing count', () => {
  assert.equal(getCategoryAccessibilityLabel('fr', 'Appartements', 12), 'Appartements, 12 logements');
});
test('zero count is announced', () => {
  assert.equal(getCategoryAccessibilityLabel('ar', 'استوديوهات', 0), 'استوديوهات، 0 إقامة');
});
test('missing or invalid counts preserve the label', () => {
  assert.equal(getCategoryAccessibilityLabel('ar', 'منازل'), 'منازل');
  assert.equal(getCategoryAccessibilityLabel('fr', 'Maisons', -1), 'Maisons');
  assert.equal(getCategoryAccessibilityLabel('fr', 'Maisons', 1.5), 'Maisons');
});
