import { getBoundsFromPoints, pointInPolygon } from '@/lib/geo';
import type { Coordinates, Listing, Neighborhood } from '@/lib/types';

const STREET_NAMES = [
  'Adelaide',
  'Bathurst',
  'Bay',
  'Bloor',
  'Carlton',
  'College',
  'Davenport',
  'Dundas',
  'Front',
  'Harbord',
  'Jarvis',
  'King',
  'Niagara',
  'Ossington',
  'Parliament',
  'Queen',
  'Richmond',
  'Sherbourne',
  'Spadina',
  'Yonge',
];

const STREET_TYPES = ['St', 'Ave', 'Rd', 'Blvd', 'Lane', 'Cres'];
const UNIT_ELIGIBLE_PROPERTY_TYPES = new Set<Listing['propertyType']>(['condo', 'townhouse']);
const POSTAL_LETTERS = 'ABCEGHJKLMNPRSTVXY';
const PRICE_ROUNDING = 1000;
const MAX_POINT_ATTEMPTS = 32;

interface GeneratorOptions {
  count: number;
  neighborhoods: Neighborhood[];
  seed?: number;
}

export function generateTorontoMockListings(
  baseListings: Listing[],
  { count, neighborhoods, seed = 20260426 }: GeneratorOptions
) {
  if (count <= 0 || baseListings.length === 0 || neighborhoods.length === 0) return [];

  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    const baseListing = baseListings[index % baseListings.length];
    const neighborhood = neighborhoods[index % neighborhoods.length];
    const coordinates = generateNeighborhoodCoordinates(neighborhood, random);
    const streetNumber = randomInteger(random, 18, 980);
    const streetName = STREET_NAMES[randomInteger(random, 0, STREET_NAMES.length - 1)];
    const streetType = STREET_TYPES[randomInteger(random, 0, STREET_TYPES.length - 1)];
    const price = buildGeneratedPrice(baseListing.price, neighborhood.avgPrice, random);
    const listingDate = buildListingDate(index);
    const daysOnMarket = buildDaysOnMarket(listingDate);
    const postalCode = buildPostalCode(random);

    return {
      ...baseListing,
      id: `lst-gen-${String(index + 1).padStart(3, '0')}`,
      price,
      address: buildAddress(baseListing.propertyType, streetNumber, streetName, streetType, random),
      neighborhood: neighborhood.name,
      postalCode,
      listingDate,
      daysOnMarket,
      coordinates,
      mlsNumber: `C9${String(1200000 + index).padStart(7, '0')}`,
      taxes: Math.round(price * (0.0052 + random() * 0.0036)),
      maintenanceFee: buildMaintenanceFee(baseListing, random),
    };
  });
}

function buildGeneratedPrice(basePrice: number, averageNeighborhoodPrice: number, random: () => number) {
  const anchorPrice = averageNeighborhoodPrice * 0.7 + basePrice * 0.3;
  const variance = 0.88 + random() * 0.24;
  return roundToNearest(anchorPrice * variance, PRICE_ROUNDING);
}

function buildAddress(
  propertyType: Listing['propertyType'],
  streetNumber: number,
  streetName: string,
  streetType: string,
  random: () => number
) {
  const baseAddress = `${streetNumber} ${streetName} ${streetType}`;
  if (!UNIT_ELIGIBLE_PROPERTY_TYPES.has(propertyType)) return baseAddress;

  const unit = randomInteger(random, 205, 3708);
  return `${baseAddress}, Unit ${unit}`;
}

function buildPostalCode(random: () => number) {
  return `M${randomInteger(random, 4, 6)}${pickPostalLetter(random)} ${randomInteger(random, 1, 9)}${pickPostalLetter(random)}${randomInteger(random, 1, 9)}`;
}

function pickPostalLetter(random: () => number) {
  return POSTAL_LETTERS[randomInteger(random, 0, POSTAL_LETTERS.length - 1)];
}

function buildListingDate(index: number) {
  const day = 26 - (index % 12);
  return `2026-04-${String(day).padStart(2, '0')}`;
}

function buildDaysOnMarket(listingDate: string) {
  const listedOn = new Date(`${listingDate}T00:00:00`);
  const currentDate = new Date('2026-04-26T00:00:00');
  const differenceMs = currentDate.getTime() - listedOn.getTime();
  return Math.max(1, Math.floor(differenceMs / (1000 * 60 * 60 * 24)));
}

function buildMaintenanceFee(baseListing: Listing, random: () => number) {
  if (baseListing.maintenanceFee == null) return undefined;
  return roundToNearest(baseListing.maintenanceFee * (0.92 + random() * 0.2), 10);
}

function generateNeighborhoodCoordinates(neighborhood: Neighborhood, random: () => number): Coordinates {
  const boundary = neighborhood.boundary ?? [];
  const bounds = getBoundsFromPoints(boundary);
  if (!bounds || boundary.length < 3) return neighborhood.coordinates;

  const [west, south, east, north] = bounds;

  for (let attempt = 0; attempt < MAX_POINT_ATTEMPTS; attempt += 1) {
    const point = {
      lng: west + (east - west) * random(),
      lat: south + (north - south) * random(),
    };

    if (pointInPolygon(point, boundary)) return point;
  }

  return neighborhood.coordinates;
}

function randomInteger(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
