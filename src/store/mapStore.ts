'use client';
import { create } from 'zustand';
import type { BoundingBox } from '@/lib/geo';
import {
  markListingVisited,
  setMobileCarouselSelection,
  type MobileCarouselSelectionSource,
} from '@/features/map/lib/mapStoreActions';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  setViewState: (vs: ViewState) => void;
  viewportBounds: BoundingBox | null;
  setViewportBounds: (bounds: BoundingBox | null) => void;
  selectedListingId: string | null;
  setSelectedListingId: (id: string | null) => void;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
  mobileCarouselListingId: string | null;
  mobileCarouselSelectionSource: MobileCarouselSelectionSource;
  mobileCarouselSelectionVersion: number;
  setMobileCarouselListingId: (id: string | null, source?: MobileCarouselSelectionSource) => void;
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
  viewportBounds: null,
  setViewportBounds: (viewportBounds) => set({ viewportBounds }),
  selectedListingId: null,
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  hoveredListingId: null,
  setHoveredListingId: (hoveredListingId) => set({ hoveredListingId }),
  mobileCarouselListingId: null,
  mobileCarouselSelectionSource: null,
  mobileCarouselSelectionVersion: 0,
  setMobileCarouselListingId: (mobileCarouselListingId, mobileCarouselSelectionSource = null) =>
    set((state) => setMobileCarouselSelection(state, mobileCarouselListingId, mobileCarouselSelectionSource)),
  visitedListingIds: [],
  markVisitedListing: (id) =>
    set((state) => {
      const visitedListingIds = markListingVisited(state.visitedListingIds, id);
      return visitedListingIds === state.visitedListingIds ? state : { visitedListingIds };
    }),
}));
