import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import { listingMatchesLocation, pointInPolygon } from '@/lib/geo';
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
  if (boundary.length >= 3) {
    return listings.filter((listing) => pointInPolygon(listing.coordinates, boundary));
  }

  if (neighborhoodIds.size > 0) {
    const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
    return listings.filter((listing) =>
      selectedNeighborhoods.some((neighborhood) =>
        pointInPolygon(listing.coordinates, neighborhood.boundary ?? [])
      )
    );
  }

  if (selectedLocations.length > 0) {
    return listings.filter((listing) =>
      selectedLocations.some((location) => listingMatchesLocation(listing, location))
    );
  }

  return listings;
}
