import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import { getBoundsFromPoints, getLocationBounds, getNeighborhoodBounds, listingMatchesLocation, mergeBounds, pointInPolygon } from '@/lib/geo';
import { Listing, SavedSearch, SearchFilters } from '@/lib/types';

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
  boundary: { lat: number; lng: number }[],
  neighborhoodIds: Set<string>
) {
  if (!hasActiveAreaScope(selectedLocations, boundary, neighborhoodIds)) return listings;

  const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
  return listings.filter((listing) =>
    listingMatchesAnyAreaScope(listing, selectedLocations, boundary, selectedNeighborhoods)
  );
}

export function getAreaScopeBounds(
  selectedLocations: SavedSearch['locations'],
  boundary: { lat: number; lng: number }[],
  neighborhoodIds: Set<string>
) {
  const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
  const bounds = mergeBounds([
    boundary.length >= 3 ? getBoundsFromPoints(boundary) : null,
    ...selectedNeighborhoods.map((neighborhood) => getNeighborhoodBounds(neighborhood)),
    ...selectedLocations.map((location) => getLocationBounds(location)),
  ]);

  return bounds;
}

function hasActiveAreaScope(
  selectedLocations: SavedSearch['locations'],
  boundary: { lat: number; lng: number }[],
  neighborhoodIds: Set<string>
) {
  return boundary.length >= 3 || neighborhoodIds.size > 0 || selectedLocations.length > 0;
}

function listingMatchesAnyAreaScope(
  listing: Listing,
  selectedLocations: SavedSearch['locations'],
  boundary: { lat: number; lng: number }[],
  selectedNeighborhoods: typeof MOCK_NEIGHBORHOODS
) {
  const matchesCustomBoundary = boundary.length >= 3 && pointInPolygon(listing.coordinates, boundary);
  const matchesNeighborhood = selectedNeighborhoods.some((neighborhood) =>
    pointInPolygon(listing.coordinates, neighborhood.boundary ?? [])
  );
  const matchesLocation = selectedLocations.some((location) => listingMatchesLocation(listing, location));

  return matchesCustomBoundary || matchesNeighborhood || matchesLocation;
}
