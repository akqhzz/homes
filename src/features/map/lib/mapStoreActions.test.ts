import assert from 'node:assert/strict';
import test from 'node:test';
import {
  markListingVisited,
  setMobileCarouselSelection,
} from './mapStoreActions.ts';

test('setMobileCarouselSelection sets id/source and increments version', () => {
  const next = setMobileCarouselSelection(
    {
      mobileCarouselListingId: null,
      mobileCarouselSelectionSource: null,
      mobileCarouselSelectionVersion: 4,
    },
    'lst-1',
    'marker'
  );

  assert.deepEqual(next, {
    mobileCarouselListingId: 'lst-1',
    mobileCarouselSelectionSource: 'marker',
    mobileCarouselSelectionVersion: 5,
  });
});

test('setMobileCarouselSelection defaults source to null when clearing selection', () => {
  const next = setMobileCarouselSelection(
    {
      mobileCarouselListingId: 'lst-1',
      mobileCarouselSelectionSource: 'carousel',
      mobileCarouselSelectionVersion: 1,
    },
    null
  );

  assert.deepEqual(next, {
    mobileCarouselListingId: null,
    mobileCarouselSelectionSource: null,
    mobileCarouselSelectionVersion: 2,
  });
});

test('markListingVisited appends new ids and preserves array identity for duplicates', () => {
  const existing = ['lst-1'];
  const appended = markListingVisited(existing, 'lst-2');
  const duplicate = markListingVisited(appended, 'lst-2');

  assert.deepEqual(appended, ['lst-1', 'lst-2']);
  assert.notEqual(appended, existing);
  assert.equal(duplicate, appended);
});
