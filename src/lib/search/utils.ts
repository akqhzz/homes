import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import { Coordinates, Location, SavedSearch, SearchFilters } from '@/lib/types';

export interface SearchSnapshot {
  locations: SavedSearch['locations'];
  filters: SearchFilters;
  areaBoundaries: Coordinates[][];
  neighborhoodIds: string[];
}

function cloneBoundary(boundary: Coordinates[]) {
  return boundary.map((point) => ({ ...point }));
}

function getSearchBoundaries(search: SavedSearch) {
  return search.areaBoundaries?.map(cloneBoundary) ?? (search.areaBoundary ? [cloneBoundary(search.areaBoundary)] : []);
}

export function createSearchSnapshot(
  locations: SavedSearch['locations'],
  filters: SearchFilters,
  areaBoundaries: Coordinates[][],
  neighborhoods: Set<string>
): SearchSnapshot {
  return {
    locations: locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...filters, propertyTypes: [...filters.propertyTypes] },
    areaBoundaries: areaBoundaries.map(cloneBoundary),
    neighborhoodIds: [...neighborhoods].sort(),
  };
}

export function searchToSnapshot(search: SavedSearch): SearchSnapshot {
  return {
    locations: search.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...search.filters, propertyTypes: [...search.filters.propertyTypes] },
    areaBoundaries: getSearchBoundaries(search),
    neighborhoodIds: [...(search.neighborhoodIds ?? [])].sort(),
  };
}

export function areSearchSnapshotsEqual(a: SearchSnapshot, b: SearchSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeAreaName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function getCarryoverAliases(neighborhoodId: string) {
  const aliases: Record<string, string[]> = {
    'nbh-yorkville': ['Bay-Cloverhill'],
    'nbh-kensington': ['Kensington Market', 'Kensington-Chinatown'],
    'nbh-church-st': ['Church Street', 'Church-Wellesley', 'Church Wellesley'],
    'nbh-cabbagetown': ['Cabbagetown-South St.James Town', 'Cabbagetown South St James Town'],
    'nbh-queen-west': ['West Queen West'],
    'nbh-king-west': ['Wellington Place'],
    'nbh-grange-park': ['Discovery District', 'University'],
  };

  return aliases[neighborhoodId] ?? [];
}

export function getMatchingNeighborhoodId(location: Pick<Location, 'name' | 'boundary'>) {
  if ((location.boundary?.length ?? 0) < 3) return null;

  const normalizedLocationName = normalizeAreaName(location.name);
  const matchingNeighborhood = MOCK_NEIGHBORHOODS.find((neighborhood) => {
    const normalizedNeighborhoodName = normalizeAreaName(neighborhood.name);
    const normalizedAliases = getCarryoverAliases(neighborhood.id).map(normalizeAreaName);
    return (
      normalizedNeighborhoodName === normalizedLocationName ||
      normalizedNeighborhoodName.includes(normalizedLocationName) ||
      normalizedLocationName.includes(normalizedNeighborhoodName) ||
      normalizedAliases.includes(normalizedLocationName)
    );
  });

  return matchingNeighborhood?.id ?? null;
}

export function getNeighborhoodIdForLocation(location: Pick<Location, 'name' | 'boundary'>) {
  return getMatchingNeighborhoodId(location);
}

export function getCarryoverAreaSelection(locations: SavedSearch['locations']) {
  const matchedNeighborhoodIds = new Set<string>();
  let fallbackBoundary: { lat: number; lng: number }[] = [];

  for (const location of locations) {
    const matchingNeighborhoodId = getMatchingNeighborhoodId(location);
    if (matchingNeighborhoodId) {
      matchedNeighborhoodIds.add(matchingNeighborhoodId);
      continue;
    }

    if (fallbackBoundary.length === 0) fallbackBoundary = location.boundary ?? [];
  }

  return {
    matchedNeighborhoodIds,
    fallbackBoundary,
  };
}

export function removeLocationsMatchingNeighborhood(
  locations: SavedSearch['locations'],
  neighborhoodId: string
) {
  return locations.filter((location) => getMatchingNeighborhoodId(location) !== neighborhoodId);
}
