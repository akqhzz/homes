import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import { getBoundsFromPoints, getLocationBounds, getNeighborhoodBounds, listingMatchesLocation, mergeBounds, pointInPolygon } from '@/lib/geo';
import { Coordinates, Listing, SavedSearch, SearchFilters } from '@/lib/types';

export type AreaBoundaryInput = Coordinates[] | Coordinates[][];

export function normalizeAreaBoundaries(boundary: AreaBoundaryInput = []) {
  if (boundary.length === 0) return [];
  const first = boundary[0];
  if (Array.isArray(first)) {
    return (boundary as Coordinates[][]).filter((shape) => shape.length >= 3);
  }
  return (boundary as Coordinates[]).length >= 3 ? [boundary as Coordinates[]] : [];
}

export function applyFilters(listings: Listing[], filters: SearchFilters) {
  return listings.filter((listing) => {
    if (filters.minPrice && listing.price < filters.minPrice) return false;
    if (filters.maxPrice && listing.price > filters.maxPrice) return false;
    if (filters.minBeds && listing.beds < filters.minBeds) return false;
    if (filters.minBaths && listing.baths < filters.minBaths) return false;
    if (filters.minSqft && listing.sqft < filters.minSqft) return false;
    if (filters.maxSqft && listing.sqft > filters.maxSqft) return false;
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.propertyType)) return false;
    if (filters.maxDaysOnMarket && listing.daysOnMarket > filters.maxDaysOnMarket) return false;
    return true;
  });
}

export function filterListingsBySearchArea(
  listings: Listing[],
  selectedLocations: SavedSearch['locations'],
  boundary: AreaBoundaryInput,
  neighborhoodIds: Set<string>
) {
  const boundaries = normalizeAreaBoundaries(boundary);
  if (!hasActiveAreaScope(selectedLocations, boundaries, neighborhoodIds)) return listings;

  const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
  return listings.filter((listing) =>
    listingMatchesAnyAreaScope(listing, selectedLocations, boundaries, selectedNeighborhoods)
  );
}

export function getAreaScopeBounds(
  selectedLocations: SavedSearch['locations'],
  boundary: AreaBoundaryInput,
  neighborhoodIds: Set<string>
) {
  const boundaries = normalizeAreaBoundaries(boundary);
  const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
  const bounds = mergeBounds([
    ...boundaries.map((shape) => getBoundsFromPoints(shape)),
    ...selectedNeighborhoods.map((neighborhood) => getNeighborhoodBounds(neighborhood)),
    ...selectedLocations.map((location) => getLocationBounds(location)),
  ]);

  return bounds;
}

function hasActiveAreaScope(
  selectedLocations: SavedSearch['locations'],
  boundaries: Coordinates[][],
  neighborhoodIds: Set<string>
) {
  return boundaries.length > 0 || neighborhoodIds.size > 0 || selectedLocations.length > 0;
}

function listingMatchesAnyAreaScope(
  listing: Listing,
  selectedLocations: SavedSearch['locations'],
  boundaries: Coordinates[][],
  selectedNeighborhoods: typeof MOCK_NEIGHBORHOODS
) {
  const matchesCustomBoundary = boundaries.some((boundary) => pointInPolygon(listing.coordinates, boundary));
  const matchesNeighborhood = selectedNeighborhoods.some((neighborhood) =>
    pointInPolygon(listing.coordinates, neighborhood.boundary ?? [])
  );
  const matchesLocation = selectedLocations.some((location) => listingMatchesLocation(listing, location));

  return matchesCustomBoundary || matchesNeighborhood || matchesLocation;
}
