import assert from 'node:assert/strict';
import test from 'node:test';
import type { Listing } from '../../../lib/types/index.ts';
import {
  CARD_MODE_IMAGE_COUNT,
  FALLBACK_LISTING_IMAGES,
  getCardsModeListingImages,
  sortCardsModeListings,
} from './cardsModeData.ts';

const baseListing: Listing = {
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
  propertyType: 'condo',
  listingDate: '2026-04-29',
  daysOnMarket: 7,
  images: ['a.jpg', 'b.jpg'],
  coordinates: { lat: 43.65, lng: -79.38 },
  description: '',
  features: [],
  mlsNumber: 'A',
  brokerage: 'Test',
  parkingSpaces: 1,
  yearBuilt: 2010,
  taxes: 3000,
};

function listing(overrides: Partial<Listing>): Listing {
  return { ...baseListing, ...overrides };
}

test('sortCardsModeListings sorts without mutating input', () => {
  const source = [
    listing({ id: 'expensive-old', price: 900000, daysOnMarket: 12 }),
    listing({ id: 'cheap-new', price: 700000, daysOnMarket: 2 }),
  ];

  assert.deepEqual(sortCardsModeListings(source, 'recommended').map((item) => item.id), ['expensive-old', 'cheap-new']);
  assert.notEqual(sortCardsModeListings(source, 'recommended'), source);
  assert.deepEqual(sortCardsModeListings(source, 'price-asc').map((item) => item.id), ['cheap-new', 'expensive-old']);
  assert.deepEqual(sortCardsModeListings(source, 'price-desc').map((item) => item.id), ['expensive-old', 'cheap-new']);
  assert.deepEqual(sortCardsModeListings(source, 'newest').map((item) => item.id), ['cheap-new', 'expensive-old']);
});

test('getCardsModeListingImages repeats listing images and falls back when empty', () => {
  assert.deepEqual(
    getCardsModeListingImages(baseListing),
    Array.from({ length: CARD_MODE_IMAGE_COUNT }, (_, index) => baseListing.images[index % baseListing.images.length])
  );

  assert.deepEqual(
    getCardsModeListingImages({ images: [] }),
    Array.from({ length: CARD_MODE_IMAGE_COUNT }, (_, index) => FALLBACK_LISTING_IMAGES[index % FALLBACK_LISTING_IMAGES.length])
  );
});
