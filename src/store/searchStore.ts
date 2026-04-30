'use client';
import { create } from 'zustand';
import { Location, SearchFilters } from '@/lib/types';
import {
  DEFAULT_FILTERS,
  addLocation,
  cloneFilters,
  getActiveFilterCount,
  mergeFilters,
  removeLocation,
} from '@/features/search/lib/searchActions';

interface SearchStore {
  selectedLocations: Location[];
  addLocation: (loc: Location) => void;
  setLocations: (locations: Location[]) => void;
  removeLocation: (id: string) => void;
  clearLocations: () => void;

  filters: SearchFilters;
  setFilters: (f: Partial<SearchFilters>) => void;
  replaceFilters: (f: SearchFilters) => void;
  resetFilters: () => void;

  activeFilterCount: () => number;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  selectedLocations: [],
  addLocation: (loc) =>
    set((s) => ({
      selectedLocations: addLocation(s.selectedLocations, loc),
    })),
  setLocations: (selectedLocations) => set({ selectedLocations }),
  removeLocation: (id) =>
    set((s) => ({ selectedLocations: removeLocation(s.selectedLocations, id) })),
  clearLocations: () => set({ selectedLocations: [] }),

  filters: DEFAULT_FILTERS,
  setFilters: (f) => set((s) => ({ filters: mergeFilters(s.filters, f) })),
  replaceFilters: (filters) => set({ filters: cloneFilters(filters) }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  activeFilterCount: () => getActiveFilterCount(get().filters),
}));
