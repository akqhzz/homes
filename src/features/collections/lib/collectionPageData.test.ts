import assert from 'node:assert/strict';
import test from 'node:test';
import type { Collection } from '../../../lib/types/index.ts';
import {
  getCollectionListings,
  getCollectionViewport,
  sortCollectionListings,
} from './collectionPageData.ts';

const listings = [
  {
    id: 'lst-a',
    price: 900000,
    address: '1 A St',
    city: 'Toronto',
    neighborhood: 'A',
    province: 'ON',
    postalCode: 'A1A 1A1',
    beds: 2,
    baths: 2,
    sqft: 900,
    propertyType: 'condo' as const,
    listingDate: '2026-04-29',
    daysOnMarket: 3,
    images: [],
    coordinates: { lat: 43.65, lng: -79.38 },
    description: '',
    features: [],
    mlsNumber: 'A',
    brokerage: 'Test',
    parkingSpaces: 1,
    yearBuilt: 2010,
    taxes: 3000,
  },
  {
    id: 'lst-b',
    price: 700000,
    address: '2 B St',
    city: 'Toronto',
    neighborhood: 'B',
    province: 'ON',
    postalCode: 'B2B 2B2',
    beds: 1,
    baths: 1,
    sqft: 700,
    propertyType: 'condo' as const,
    listingDate: '2026-04-29',
    daysOnMarket: 5,
    images: [],
    coordinates: { lat: 43.67, lng: -79.4 },
    description: '',
    features: [],
    mlsNumber: 'B',
    brokerage: 'Test',
    parkingSpaces: 1,
    yearBuilt: 2012,
    taxes: 2500,
  },
];

const collection: Collection = {
  id: 'col-test',
  name: 'Test',
  listings: [
    { listingId: listings[1].id, order: 2, savedAt: '2026-04-29T00:00:00.000Z', tags: ['b'] },
    { listingId: listings[0].id, order: 1, savedAt: '2026-04-29T00:00:00.000Z', tags: ['a'] },
    { listingId: 'missing', order: 3, savedAt: '2026-04-29T00:00:00.000Z', tags: [] },
  ],
  tags: ['a', 'b'],
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-29T00:00:00.000Z',
};

test('getCollectionListings sorts by manual order and skips missing listings', () => {
  const result = getCollectionListings(collection, listings);

  assert.deepEqual(result.map((listing) => listing.id), [listings[0].id, listings[1].id]);
  assert.deepEqual(result.map((listing) => listing.collectionData.tags), [['a'], ['b']]);
});

test('sortCollectionListings preserves manual order reference and sorts price variants immutably', () => {
  const collectionListings = getCollectionListings(collection, listings);

  assert.equal(sortCollectionListings(collectionListings, 'manual'), collectionListings);
  assert.deepEqual(
    sortCollectionListings(collectionListings, 'price-asc').map((listing) => listing.price),
    [...collectionListings].sort((a, b) => a.price - b.price).map((listing) => listing.price)
  );
  assert.deepEqual(
    sortCollectionListings(collectionListings, 'price-desc').map((listing) => listing.price),
    [...collectionListings].sort((a, b) => b.price - a.price).map((listing) => listing.price)
  );
});

test('getCollectionViewport returns default, single, and averaged collection viewports', () => {
  assert.deepEqual(getCollectionViewport([]), { longitude: -79.3832, latitude: 43.6532, zoom: 11.8 });

  assert.equal(getCollectionViewport([listings[0]]).zoom, 13.8);

  const viewport = getCollectionViewport([listings[0], listings[1]]);
  assert.equal(viewport.zoom, 12.7);
  assert.equal(
    viewport.latitude,
    (listings[0].coordinates.lat + listings[1].coordinates.lat) / 2
  );
  assert.equal(
    viewport.longitude,
    (listings[0].coordinates.lng + listings[1].coordinates.lng) / 2
  );
});
