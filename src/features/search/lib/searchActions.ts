import type { Coordinates, Location, SearchFilters } from '@/lib/types';

export const DEFAULT_FILTERS: SearchFilters = {
  searchType: 'buy',
  listingMode: undefined,
  listingStatus: 'active',
  propertyTypes: [],
  minPrice: undefined,
  maxPrice: undefined,
  minBeds: undefined,
  maxBeds: undefined,
  minBaths: undefined,
  minParking: undefined,
  minSqft: undefined,
  maxSqft: undefined,
  maxDaysOnMarket: undefined,
  amenities: [],
  locker: undefined,
  maxMaintenanceFee: undefined,
  hideNoImages: undefined,
};

export function addLocation(locations: Location[], location: Location) {
  return [location, ...locations.filter((selected) => selected.id !== location.id)];
}

export function removeLocation(locations: Location[], id: string) {
  return locations.filter((location) => location.id !== id);
}

export function mergeFilters(filters: SearchFilters, patch: Partial<SearchFilters>) {
  return { ...filters, ...patch };
}

export function cloneFilters(filters: SearchFilters): SearchFilters {
  return { ...filters, propertyTypes: [...filters.propertyTypes], amenities: [...(filters.amenities ?? [])] };
}

export function getActiveFilterCount(filters: SearchFilters) {
  let count = 0;
  if (filters.minPrice || filters.maxPrice) count++;
  if (filters.minBeds) count++;
  if (filters.minBaths) count++;
  if (filters.minParking) count++;
  if (filters.propertyTypes.length > 0) count++;
  if (filters.minSqft || filters.maxSqft) count++;
  if (filters.maxDaysOnMarket) count++;
  if (filters.searchType && filters.searchType !== DEFAULT_FILTERS.searchType) count++;
  if (filters.listingMode) count++;
  if (filters.listingStatus && filters.listingStatus !== DEFAULT_FILTERS.listingStatus) count++;
  if ((filters.amenities?.length ?? 0) > 0) count++;
  if (filters.locker) count++;
  if (filters.maxMaintenanceFee) count++;
  if (filters.hideNoImages) count++;
  return count;
}

export function cloneBoundary(boundary: Coordinates[]) {
  return boundary.map((point) => ({ ...point }));
}

export function cloneBoundaries(boundaries: Coordinates[][]) {
  return boundaries.filter((boundary) => boundary.length >= 3).map(cloneBoundary);
}

export function cloneNeighborhoods(neighborhoods: Set<string> | string[]) {
  return new Set(neighborhoods);
}
