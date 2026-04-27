'use client';
import { create } from 'zustand';
import { MOCK_SAVED_SEARCHES } from '@/lib/mock-data';
import { Coordinates, Location, SavedSearch, SearchFilters } from '@/lib/types';

const EMPTY_FILTERS: SearchFilters = {
  propertyTypes: [],
};

function normalizeFilters(filters: Partial<SearchFilters> | undefined): SearchFilters {
  return {
    ...EMPTY_FILTERS,
    ...filters,
    propertyTypes: [...(filters?.propertyTypes ?? [])],
  };
}

function cloneSearch(search: SavedSearch): SavedSearch {
  return {
    ...search,
    locations: search.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: normalizeFilters(search.filters),
    areaBoundary: search.areaBoundary?.map((point) => ({ ...point })),
    neighborhoodIds: search.neighborhoodIds ? [...search.neighborhoodIds] : undefined,
  };
}

const INITIAL_SEARCHES: SavedSearch[] = MOCK_SAVED_SEARCHES.map((search) =>
  cloneSearch({
    ...search,
    filters: normalizeFilters(search.filters),
  })
);

interface SaveSearchInput {
  name: string;
  locations: Location[];
  filters: SearchFilters;
  areaBoundary?: Coordinates[];
  neighborhoodIds?: string[];
  thumbnail?: string;
}

interface SavedSearchStore {
  searches: SavedSearch[];
  activeSearchId: string | null;
  activeSearchDirty: boolean;
  saveSearch: (input: SaveSearchInput) => string;
  updateSearch: (id: string, input: SaveSearchInput) => void;
  renameSearch: (id: string, name: string) => void;
  deleteSearch: (id: string) => void;
  setActiveSearchId: (id: string | null) => void;
  setActiveSearchDirty: (value: boolean) => void;
}

export const useSavedSearchStore = create<SavedSearchStore>((set) => ({
  searches: INITIAL_SEARCHES,
  activeSearchId: null,
  activeSearchDirty: false,
  saveSearch: (input) => {
    const id = `ss-${Date.now()}`;
    const search: SavedSearch = {
      id,
      name: input.name,
      locations: input.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
      filters: normalizeFilters(input.filters),
      areaBoundary: input.areaBoundary?.map((point) => ({ ...point })),
      neighborhoodIds: input.neighborhoodIds?.length ? [...input.neighborhoodIds] : undefined,
      createdAt: new Date().toISOString(),
      newListingsCount: 0,
      thumbnail: input.thumbnail ?? 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
    };
    set((state) => ({
      searches: [search, ...state.searches],
      activeSearchId: id,
      activeSearchDirty: false,
    }));
    return id;
  },
  updateSearch: (id, input) =>
    set((state) => ({
      searches: state.searches.map((search) =>
        search.id === id
          ? {
              ...search,
              locations: input.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
              filters: normalizeFilters(input.filters),
              areaBoundary: input.areaBoundary?.map((point) => ({ ...point })),
              neighborhoodIds: input.neighborhoodIds?.length ? [...input.neighborhoodIds] : undefined,
              createdAt: search.createdAt,
            }
          : search
      ),
      activeSearchDirty: false,
    })),
  renameSearch: (id, name) =>
    set((state) => ({
      searches: state.searches.map((search) => (search.id === id ? { ...search, name } : search)),
    })),
  deleteSearch: (id) =>
    set((state) => ({
      searches: state.searches.filter((search) => search.id !== id),
      activeSearchId: state.activeSearchId === id ? null : state.activeSearchId,
      activeSearchDirty: state.activeSearchId === id ? false : state.activeSearchDirty,
    })),
  setActiveSearchId: (activeSearchId) => set({ activeSearchId }),
  setActiveSearchDirty: (activeSearchDirty) => set({ activeSearchDirty }),
}));
