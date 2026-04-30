import assert from 'node:assert/strict';
import test from 'node:test';
import type { Location, SearchFilters } from '@/lib/types';
import {
  DEFAULT_FILTERS,
  addLocation,
  cloneBoundaries,
  cloneFilters,
  cloneNeighborhoods,
  getActiveFilterCount,
  mergeFilters,
  removeLocation,
} from './searchActions.ts';

const locationA: Location = {
  id: 'loc-a',
  name: 'A',
  type: 'city',
  coordinates: { lat: 43.65, lng: -79.38 },
};

const locationB: Location = {
  id: 'loc-b',
  name: 'B',
  type: 'neighborhood',
  coordinates: { lat: 43.66, lng: -79.39 },
};

test('addLocation moves matching location to the front without duplicates', () => {
  const locations = addLocation([locationA, locationB], { ...locationA, name: 'A updated' });

  assert.deepEqual(locations.map((location) => location.id), ['loc-a', 'loc-b']);
  assert.equal(locations[0].name, 'A updated');
  assert.equal(locations.length, 2);
});

test('removeLocation removes by id', () => {
  assert.deepEqual(removeLocation([locationA, locationB], 'loc-a'), [locationB]);
});

test('mergeFilters and cloneFilters preserve existing filter shape', () => {
  const filters: SearchFilters = {
    ...DEFAULT_FILTERS,
    propertyTypes: ['condo'],
    minPrice: 500000,
  };

  const merged = mergeFilters(filters, { maxPrice: 900000 });
  assert.deepEqual(merged, {
    ...DEFAULT_FILTERS,
    propertyTypes: ['condo'],
    minPrice: 500000,
    maxPrice: 900000,
  });

  const cloned = cloneFilters(merged);
  assert.deepEqual(cloned, merged);
  assert.notEqual(cloned.propertyTypes, merged.propertyTypes);
});

test('getActiveFilterCount groups paired range filters by category', () => {
  assert.equal(getActiveFilterCount(DEFAULT_FILTERS), 0);
  assert.equal(getActiveFilterCount({ ...DEFAULT_FILTERS, minPrice: 500000, maxPrice: 900000 }), 1);
  assert.equal(getActiveFilterCount({ ...DEFAULT_FILTERS, minBeds: 2, minBaths: 2 }), 2);
  assert.equal(getActiveFilterCount({ ...DEFAULT_FILTERS, propertyTypes: ['house'], minSqft: 800, maxDaysOnMarket: 14 }), 3);
});

test('cloneBoundaries drops invalid boundaries and clones points', () => {
  const boundary = [
    { lat: 1, lng: 1 },
    { lat: 2, lng: 2 },
    { lat: 3, lng: 3 },
  ];
  const cloned = cloneBoundaries([boundary, boundary.slice(0, 2)]);

  assert.equal(cloned.length, 1);
  assert.deepEqual(cloned[0], boundary);
  assert.notEqual(cloned[0], boundary);
  assert.notEqual(cloned[0][0], boundary[0]);
});

test('cloneNeighborhoods accepts arrays and sets', () => {
  const fromArray = cloneNeighborhoods(['a', 'b']);
  const fromSet = cloneNeighborhoods(new Set(['c', 'd']));

  assert.deepEqual([...fromArray], ['a', 'b']);
  assert.deepEqual([...fromSet], ['c', 'd']);
});
