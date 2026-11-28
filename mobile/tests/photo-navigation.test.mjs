import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhotoNavigationText } from '../src/lib/photo-navigation.mjs';

test('Arabic photo navigation labels match previous and next actions', () => {
  assert.deepEqual(getPhotoNavigationText('ar'), {
    previous: '← السابقة',
    next: 'التالية →',
  });
});

test('French photo navigation labels preserve the existing wording', () => {
  assert.deepEqual(getPhotoNavigationText('fr'), {
    previous: '← Précédente',
    next: 'Suivante →',
  });
});

test('photo navigation defaults to Arabic labels', () => {
  assert.deepEqual(getPhotoNavigationText(), getPhotoNavigationText('ar'));
});
