import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSavedSearch,
  normalizeSavedSearchFilters,
  removeSavedSearch,
  renameSavedSearch,
  replaceSavedSearch,
  type SaveSearchInput,
} from './savedSearchActions.ts';

const baseInput: SaveSearchInput = {
  name: 'Downtown condos',
  locations: [
    {
      id: 'loc-1',
      name: 'Downtown',
      type: 'neighborhood',
      coordinates: { lat: 43.65, lng: -79.38 },
      boundary: [
        { lat: 43.64, lng: -79.39 },
        { lat: 43.66, lng: -79.39 },
        { lat: 43.66, lng: -79.37 },
      ],
    },
  ],
  filters: {
    propertyTypes: ['condo'],
    minBeds: 2,
  },
  areaBoundary: [
    { lat: 43.64, lng: -79.39 },
    { lat: 43.66, lng: -79.39 },
    { lat: 43.66, lng: -79.37 },
  ],
  areaBoundaries: [
    [
      { lat: 43.64, lng: -79.39 },
      { lat: 43.66, lng: -79.39 },
      { lat: 43.66, lng: -79.37 },
    ],
  ],
  neighborhoodIds: ['waterfront'],
};

test('normalizeSavedSearchFilters preserves supplied filters and clones propertyTypes', () => {
  const filters = { propertyTypes: ['house'], minPrice: 900000 };
  const normalized = normalizeSavedSearchFilters(filters);

  assert.deepEqual(normalized, { propertyTypes: ['house'], minPrice: 900000 });
  assert.notEqual(normalized.propertyTypes, filters.propertyTypes);
});

test('createSavedSearch clones nested input data', () => {
  const search = createSavedSearch(baseInput, 'ss-1', '2026-04-29T00:00:00.000Z');

  assert.equal(search.id, 'ss-1');
  assert.equal(search.createdAt, '2026-04-29T00:00:00.000Z');
  assert.equal(search.newListingsCount, 0);
  assert.deepEqual(search.neighborhoodIds, ['waterfront']);
  assert.notEqual(search.locations[0], baseInput.locations[0]);
  assert.notEqual(search.locations[0].coordinates, baseInput.locations[0].coordinates);
  assert.notEqual(search.filters.propertyTypes, baseInput.filters.propertyTypes);
  assert.notEqual(search.areaBoundary, baseInput.areaBoundary);
  assert.notEqual(search.areaBoundaries?.[0], baseInput.areaBoundaries?.[0]);
});

test('replaceSavedSearch updates criteria while preserving name and createdAt', () => {
  const original = createSavedSearch(baseInput, 'ss-1', '2026-04-29T00:00:00.000Z');
  const other = createSavedSearch({ ...baseInput, name: 'Other' }, 'ss-2', '2026-04-28T00:00:00.000Z');

  const searches = replaceSavedSearch([original, other], 'ss-1', {
    ...baseInput,
    name: 'Updated',
    filters: { propertyTypes: ['townhouse'], maxPrice: 1200000 },
    neighborhoodIds: [],
  });

  assert.equal(searches[0].name, original.name);
  assert.equal(searches[0].createdAt, original.createdAt);
  assert.deepEqual(searches[0].filters, { propertyTypes: ['townhouse'], maxPrice: 1200000 });
  assert.equal(searches[0].neighborhoodIds, undefined);
  assert.equal(searches[1], other);
});

test('renameSavedSearch and removeSavedSearch only affect the requested id', () => {
  const first = createSavedSearch(baseInput, 'ss-1', '2026-04-29T00:00:00.000Z');
  const second = createSavedSearch({ ...baseInput, name: 'Second' }, 'ss-2', '2026-04-28T00:00:00.000Z');

  const renamed = renameSavedSearch([first, second], 'ss-2', 'Renamed');
  assert.equal(renamed[0], first);
  assert.equal(renamed[1].name, 'Renamed');

  const removed = removeSavedSearch(renamed, 'ss-1');
  assert.deepEqual(removed.map((search) => search.id), ['ss-2']);
});
