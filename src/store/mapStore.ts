'use client';
import { create } from 'zustand';
import { MapMode } from '@/lib/types';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  setViewState: (vs: ViewState) => void;
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;
  selectedListingId: string | null;
  setSelectedListingId: (id: string | null) => void;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 13,
  },
  setViewState: (viewState) => set({ viewState }),
  mapMode: 'explore',
  setMapMode: (mapMode) => set({ mapMode }),
  selectedListingId: null,
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  hoveredListingId: null,
  setHoveredListingId: (hoveredListingId) => set({ hoveredListingId }),
}));
