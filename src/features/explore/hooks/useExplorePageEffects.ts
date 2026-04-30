'use client';
import { useEffect, useMemo, useRef } from 'react';
import { getBoundsCenter, getSuggestedZoom, type BoundingBox } from '@/lib/geo';
import { getAreaScopeBounds } from '@/lib/search/filters';
import type { Coordinates, SavedSearch } from '@/lib/types';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface UseExplorePageEffectsOptions {
  isAreaSelect: boolean;
  isCarouselVisible: boolean;
  selectedLocations: SavedSearch['locations'];
  appliedBoundaries: Coordinates[][];
  appliedNeighborhoods: Set<string>;
  setDesktopMapExpanded: (value: boolean) => void;
  setHoveredListingId: (id: string | null) => void;
  setMobileCarouselListingId: (id: string | null) => void;
  setSelectedListingId: (id: string | null) => void;
  setViewState: (viewState: ViewState) => void;
  preloadListingsListView: () => Promise<unknown>;
}

function getSearchViewState(
  selectedLocations: SavedSearch['locations'],
  boundaries: Coordinates[][],
  neighborhoodIds: Set<string>
) {
  const bounds = getAreaScopeBounds(selectedLocations, boundaries, neighborhoodIds);
  if (!bounds) return null;

  const center = getBoundsCenter(bounds as BoundingBox);
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: getSuggestedZoom(bounds as BoundingBox),
  };
}

function getAreaViewStateScopeKey(
  selectedLocations: SavedSearch['locations'],
  boundaries: Coordinates[][],
  neighborhoodIds: Set<string>
) {
  return JSON.stringify({
    locations: selectedLocations.map((location) => ({
      id: location.id,
      coordinates: location.coordinates,
      bbox: location.bbox ?? null,
      boundary: location.boundary ?? [],
    })),
    boundaries,
    neighborhoodIds: [...neighborhoodIds].sort(),
  });
}

export function useExplorePageEffects({
  isAreaSelect,
  isCarouselVisible,
  selectedLocations,
  appliedBoundaries,
  appliedNeighborhoods,
  setDesktopMapExpanded,
  setHoveredListingId,
  setMobileCarouselListingId,
  setSelectedListingId,
  setViewState,
  preloadListingsListView,
}: UseExplorePageEffectsOptions) {
  const areaViewStateScopeKey = useMemo(
    () => getAreaViewStateScopeKey(selectedLocations, appliedBoundaries, appliedNeighborhoods),
    [appliedBoundaries, appliedNeighborhoods, selectedLocations]
  );
  const previousAreaViewStateScopeKey = useRef(areaViewStateScopeKey);

  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (!isCarouselVisible && !isDesktop) {
      setSelectedListingId(null);
      setMobileCarouselListingId(null);
      setHoveredListingId(null);
    }
  }, [isCarouselVisible, setHoveredListingId, setMobileCarouselListingId, setSelectedListingId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncDesktopExpand = () => {
      if (window.innerWidth < 1024) setDesktopMapExpanded(false);
    };
    syncDesktopExpand();
    window.addEventListener('resize', syncDesktopExpand);
    return () => window.removeEventListener('resize', syncDesktopExpand);
  }, [setDesktopMapExpanded]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        void preloadListingsListView();
      }, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => {
      void preloadListingsListView();
    }, 600);
    return () => globalThis.clearTimeout(timeoutId);
  }, [preloadListingsListView]);

  useEffect(() => {
    let edgeTouch = false;
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      edgeTouch = touch.clientX < 24 || touch.clientX > window.innerWidth - 24;
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (edgeTouch) event.preventDefault();
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (isAreaSelect) return;
    if (previousAreaViewStateScopeKey.current === areaViewStateScopeKey) return;
    previousAreaViewStateScopeKey.current = areaViewStateScopeKey;
    const nextViewState = getSearchViewState(selectedLocations, appliedBoundaries, appliedNeighborhoods);
    if (!nextViewState) return;
    setViewState(nextViewState);
  }, [appliedBoundaries, appliedNeighborhoods, areaViewStateScopeKey, isAreaSelect, selectedLocations, setViewState]);
}
