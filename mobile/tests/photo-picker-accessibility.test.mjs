import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhotoRemoveAccessibilityLabel } from '../src/lib/photo-picker-accessibility.mjs';

test('Arabic photo removal labels identify the photo number', () => {
  assert.equal(
    getPhotoRemoveAccessibilityLabel('ar', 1),
    'حذف الصورة رقم 1 من المعاينة',
  );
  assert.equal(
    getPhotoRemoveAccessibilityLabel('ar', 3),
    'حذف الصورة رقم 3 من المعاينة',
  );
});

test('French photo removal labels identify the photo number', () => {
  assert.equal(
    getPhotoRemoveAccessibilityLabel('fr', 2),
    'Retirer la photo 2 de l’aperçu',
  );
});

test('invalid photo numbers do not produce misleading indices', () => {
  assert.equal(
    getPhotoRemoveAccessibilityLabel('ar', 0),
    'حذف الصورة رقم من المعاينة',
  );
  assert.equal(
    getPhotoRemoveAccessibilityLabel('fr', -1),
    'Retirer la photo de l’aperçu',
  );
});
