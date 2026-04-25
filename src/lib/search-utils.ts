import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import { SavedSearch, SearchFilters } from '@/lib/types';

export interface SearchSnapshot {
  locations: SavedSearch['locations'];
  filters: SearchFilters;
  areaBoundary: { lat: number; lng: number }[];
  neighborhoodIds: string[];
}

export function createSearchSnapshot(
  locations: SavedSearch['locations'],
  filters: SearchFilters,
  areaBoundary: { lat: number; lng: number }[],
  neighborhoods: Set<string>
): SearchSnapshot {
  return {
    locations: locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...filters, propertyTypes: [...filters.propertyTypes] },
    areaBoundary: areaBoundary.map((point) => ({ ...point })),
    neighborhoodIds: [...neighborhoods].sort(),
  };
}

export function searchToSnapshot(search: SavedSearch): SearchSnapshot {
  return {
    locations: search.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...search.filters, propertyTypes: [...search.filters.propertyTypes] },
    areaBoundary: search.areaBoundary?.map((point) => ({ ...point })) ?? [],
    neighborhoodIds: [...(search.neighborhoodIds ?? [])].sort(),
  };
}

export function areSearchSnapshotsEqual(a: SearchSnapshot, b: SearchSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeAreaName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getCarryoverAliases(neighborhoodId: string) {
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

export function getCarryoverAreaSelection(locations: SavedSearch['locations']) {
  const matchedNeighborhoodIds = new Set<string>();
  let fallbackBoundary: { lat: number; lng: number }[] = [];

  for (const location of locations) {
    if ((location.boundary?.length ?? 0) < 3) continue;
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

    if (matchingNeighborhood) {
      matchedNeighborhoodIds.add(matchingNeighborhood.id);
      continue;
    }

    if (fallbackBoundary.length === 0) fallbackBoundary = location.boundary ?? [];
  }

  return {
    matchedNeighborhoodIds,
    fallbackBoundary,
  };
}
