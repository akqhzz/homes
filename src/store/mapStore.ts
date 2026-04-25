'use client';
import { create } from 'zustand';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  setViewState: (vs: ViewState) => void;
  selectedListingId: string | null;
  setSelectedListingId: (id: string | null) => void;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
  mobileCarouselListingId: string | null;
  setMobileCarouselListingId: (id: string | null) => void;
  visitedListingIds: string[];
  markVisitedListing: (id: string) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 13,
  },
  setViewState: (viewState) => set({ viewState }),
  selectedListingId: null,
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  hoveredListingId: null,
  setHoveredListingId: (hoveredListingId) => set({ hoveredListingId }),
  mobileCarouselListingId: null,
  setMobileCarouselListingId: (mobileCarouselListingId) => set({ mobileCarouselListingId }),
  visitedListingIds: [],
  markVisitedListing: (id) =>
    set((state) =>
      state.visitedListingIds.includes(id)
        ? state
        : { visitedListingIds: [...state.visitedListingIds, id] }
    ),
}));
