'use client';
import { create } from 'zustand';
import { ActivePanel, BottomTab } from '@/lib/types';

interface UIStore {
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;

  activeTab: BottomTab;
  setActiveTab: (t: BottomTab) => void;

  isCarouselVisible: boolean;
  setCarouselVisible: (v: boolean) => void;

  detailListingId: string | null;
  openListingDetail: (id: string) => void;
  closeListingDetail: () => void;

  isAreaSelectMode: boolean;
  setAreaSelectMode: (v: boolean) => void;

  isSatelliteMode: boolean;
  isDesktopMapExpanded: boolean;
  setDesktopMapExpanded: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: 'none',
  setActivePanel: (activePanel) => set({ activePanel }),

  activeTab: 'explore',
  setActiveTab: (activeTab) => set({ activeTab }),

  isCarouselVisible: false,
  setCarouselVisible: (isCarouselVisible) => set({ isCarouselVisible }),

  detailListingId: null,
  openListingDetail: (id) => set({ detailListingId: id, activePanel: 'listing-detail' }),
  closeListingDetail: () => set({ detailListingId: null, activePanel: 'none' }),

  isAreaSelectMode: false,
  setAreaSelectMode: (isAreaSelectMode) => set({ isAreaSelectMode }),

  isSatelliteMode: false,
  isDesktopMapExpanded: false,
  setDesktopMapExpanded: (isDesktopMapExpanded) => set({ isDesktopMapExpanded }),
}));
