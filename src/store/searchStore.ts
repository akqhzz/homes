'use client';
import { create } from 'zustand';
import { Location, SearchFilters } from '@/lib/types';

const DEFAULT_FILTERS: SearchFilters = {
  propertyTypes: [],
  minPrice: undefined,
  maxPrice: undefined,
  minBeds: undefined,
  maxBeds: undefined,
  minBaths: undefined,
  minSqft: undefined,
  maxSqft: undefined,
  maxDaysOnMarket: undefined,
};

interface SearchStore {
  selectedLocations: Location[];
  addLocation: (loc: Location) => void;
  removeLocation: (id: string) => void;
  clearLocations: () => void;

  filters: SearchFilters;
  setFilters: (f: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  activeFilterCount: () => number;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  selectedLocations: [],
  addLocation: (loc) =>
    set((s) => ({ selectedLocations: [...s.selectedLocations, loc] })),
  removeLocation: (id) =>
    set((s) => ({ selectedLocations: s.selectedLocations.filter((l) => l.id !== id) })),
  clearLocations: () => set({ selectedLocations: [] }),

  filters: DEFAULT_FILTERS,
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  activeFilterCount: () => {
    const f = get().filters;
    let count = 0;
    if (f.minPrice || f.maxPrice) count++;
    if (f.minBeds) count++;
    if (f.minBaths) count++;
    if (f.propertyTypes.length > 0) count++;
    if (f.minSqft || f.maxSqft) count++;
    if (f.maxDaysOnMarket) count++;
    return count;
  },
}));
