import assert from 'node:assert/strict';
import test from 'node:test';
import type { Listing } from '@/lib/types';
import { rankCardModeListings } from './listing-scope.ts';

const listing = (id: string) => ({ id }) as Listing;

test('rankCardModeListings prioritizes listings that are neither viewed nor saved', () => {
  const ranked = rankCardModeListings({
    filteredListings: [listing('viewed-saved'), listing('saved'), listing('fresh'), listing('viewed')],
    scopedListings: [listing('viewed-saved'), listing('saved'), listing('fresh'), listing('viewed')],
    visitedListingIds: ['viewed', 'viewed-saved'],
    savedListingIds: new Set(['saved', 'viewed-saved']),
    hasBoundaryScope: true,
  });

  assert.deepEqual(ranked.map((item) => item.id), ['fresh', 'saved', 'viewed', 'viewed-saved']);
});

test('rankCardModeListings applies freshness ranking to viewport and remaining listings', () => {
  const ranked = rankCardModeListings({
    filteredListings: [listing('scoped-fresh'), listing('remaining-fresh'), listing('remaining-saved')],
    scopedListings: [listing('scoped-fresh')],
    visitedListingIds: [],
    savedListingIds: ['remaining-saved'],
    hasBoundaryScope: false,
  });

  assert.deepEqual(ranked.map((item) => item.id), ['scoped-fresh', 'remaining-fresh', 'remaining-saved']);
});
