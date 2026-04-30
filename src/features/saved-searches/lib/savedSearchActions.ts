import type { Coordinates, Location, SavedSearch, SearchFilters } from '@/lib/types';

const EMPTY_FILTERS: SearchFilters = {
  propertyTypes: [],
};

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80';

export interface SaveSearchInput {
  name: string;
  locations: Location[];
  filters: SearchFilters;
  areaBoundary?: Coordinates[];
  areaBoundaries?: Coordinates[][];
  neighborhoodIds?: string[];
  thumbnail?: string;
}

export function normalizeSavedSearchFilters(filters: Partial<SearchFilters> | undefined): SearchFilters {
  return {
    ...EMPTY_FILTERS,
    ...filters,
    propertyTypes: [...(filters?.propertyTypes ?? [])],
  };
}

export function createSavedSearch(input: SaveSearchInput, id: string, createdAt: string): SavedSearch {
  return {
    id,
    name: input.name,
    locations: cloneLocations(input.locations),
    filters: normalizeSavedSearchFilters(input.filters),
    areaBoundary: cloneBoundary(input.areaBoundary),
    areaBoundaries: cloneBoundaries(input.areaBoundaries),
    neighborhoodIds: input.neighborhoodIds?.length ? [...input.neighborhoodIds] : undefined,
    createdAt,
    newListingsCount: 0,
    thumbnail: input.thumbnail ?? DEFAULT_THUMBNAIL,
  };
}

export function updateSavedSearch(search: SavedSearch, input: SaveSearchInput): SavedSearch {
  return {
    ...search,
    locations: cloneLocations(input.locations),
    filters: normalizeSavedSearchFilters(input.filters),
    areaBoundary: cloneBoundary(input.areaBoundary),
    areaBoundaries: cloneBoundaries(input.areaBoundaries),
    neighborhoodIds: input.neighborhoodIds?.length ? [...input.neighborhoodIds] : undefined,
    createdAt: search.createdAt,
  };
}

export function replaceSavedSearch(searches: SavedSearch[], id: string, input: SaveSearchInput) {
  return searches.map((search) => (search.id === id ? updateSavedSearch(search, input) : search));
}

export function renameSavedSearch(searches: SavedSearch[], id: string, name: string) {
  return searches.map((search) => (search.id === id ? { ...search, name } : search));
}

export function removeSavedSearch(searches: SavedSearch[], id: string) {
  return searches.filter((search) => search.id !== id);
}

function cloneLocations(locations: Location[]) {
  return locations.map((location) => ({
    ...location,
    coordinates: { ...location.coordinates },
  }));
}

function cloneBoundary(boundary?: Coordinates[]) {
  return boundary?.map((point) => ({ ...point }));
}

function cloneBoundaries(boundaries?: Coordinates[][]) {
  return boundaries?.map((boundary) => boundary.map((point) => ({ ...point })));
}
