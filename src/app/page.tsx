'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, SquareDashedMousePointer } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import {
  getBoundsCenter,
  getBoundsFromPoints,
  getLocationBounds,
  getNeighborhoodBounds,
  getSuggestedZoom,
  mergeBounds,
} from '@/lib/geo';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import BottomNav from '@/components/organisms/BottomNav';
import DesktopSidebar from '@/components/organisms/DesktopSidebar';
import TopBar from '@/components/organisms/TopBar';
import ListingsCarousel from '@/components/organisms/ListingsCarousel';
import DesktopHeader from '@/components/organisms/DesktopHeader';
import { Neighborhood, SavedSearch } from '@/lib/types';
import { getListingsInViewport, rankCardModeListings } from '@/lib/listing-scope';
import { applyFilters, filterListingsBySearchArea } from '@/lib/search-filters';
import {
  areSearchSnapshotsEqual,
  createSearchSnapshot,
  getCarryoverAreaSelection,
  SearchSnapshot,
  searchToSnapshot,
} from '@/lib/search-utils';
import { getAreaSummaryLabel } from '@/lib/utils/search-display';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
const SearchPanel = dynamic(() => import('@/components/organisms/SearchPanel'), { ssr: false });
const FilterPanel = dynamic(() => import('@/components/organisms/FilterPanel'), { ssr: false });
const CardsMode = dynamic(() => import('@/components/organisms/CardsMode'), { ssr: false });
const AreaSelectPanel = dynamic(() => import('@/components/organisms/AreaSelectPanel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });
const SavedSearchesPanel = dynamic(() => import('@/components/organisms/SavedSearchesPanel'), { ssr: false });
const ListingsSidebar = dynamic(() => import('@/components/organisms/ListingsSidebar'), { ssr: false });

function getSearchViewState(
  selectedLocations: SavedSearch['locations'],
  boundary: { lat: number; lng: number }[],
  neighborhoodIds: Set<string>
) {
  const bounds =
    boundary.length >= 3
      ? getBoundsFromPoints(boundary)
      : neighborhoodIds.size > 0
      ? mergeBounds(
          MOCK_NEIGHBORHOODS
            .filter((neighborhood) => neighborhoodIds.has(neighborhood.id))
            .map((neighborhood) => getNeighborhoodBounds(neighborhood))
        )
      : mergeBounds(selectedLocations.map((location) => getLocationBounds(location)));

  if (!bounds) return null;

  const center = getBoundsCenter(bounds);
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: getSuggestedZoom(bounds),
  };
}

export default function MapPage() {
  const {
    activePanel,
    setActivePanel,
    isCarouselVisible,
    setCarouselVisible,
    setAreaSelectMode,
    isDesktopMapExpanded,
    setDesktopMapExpanded,
  } = useUIStore();
  const { filters, selectedLocations, setLocations, replaceFilters, clearLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const setHoveredListingId = useMapStore((s) => s.setHoveredListingId);
  const setMobileCarouselListingId = useMapStore((s) => s.setMobileCarouselListingId);
  const setViewState = useMapStore((s) => s.setViewState);
  const viewportBounds = useMapStore((s) => s.viewportBounds);
  const visitedListingIds = useMapStore((s) => s.visitedListingIds);
  const {
    searches,
    activeSearchId,
    setActiveSearchId,
    setActiveSearchDirty,
    updateSearch,
  } = useSavedSearchStore();
  const [focusedNeighborhood, setFocusedNeighborhood] = useState<Neighborhood | null>(null);
  const [areaFocusToken, setAreaFocusToken] = useState(0);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [drawnBoundary, setDrawnBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [redoBoundary, setRedoBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [clearedBoundarySnapshot, setClearedBoundarySnapshot] = useState<{ lat: number; lng: number }[] | null>(null);
  const [clearedBoundaryRedoSnapshot, setClearedBoundaryRedoSnapshot] = useState<{ lat: number; lng: number }[] | null>(null);
  const [areaUndoStack, setAreaUndoStack] = useState<Set<string>[]>([]);
  const [areaRedoStack, setAreaRedoStack] = useState<Set<string>[]>([]);
  const [appliedNeighborhoods, setAppliedNeighborhoods] = useState<Set<string>>(new Set());
  const [appliedBoundary, setAppliedBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [preSavedSearchState, setPreSavedSearchState] = useState<SearchSnapshot | null>(null);
  const carouselDragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const isAreaSelect = activePanel === 'area-select';
  const hasAppliedArea = appliedBoundary.length > 0 || appliedNeighborhoods.size > 0;
  const hasSearchBoundary = selectedLocations.some((location) => (location.boundary?.length ?? 0) > 2);
  const hasVisibleBoundary = hasAppliedArea || hasSearchBoundary;
  const filteredListings = useMemo(
    () =>
      filterListingsBySearchArea(
        applyFilters(MOCK_LISTINGS, filters),
        selectedLocations,
        appliedBoundary,
        appliedNeighborhoods
      ),
    [appliedBoundary, appliedNeighborhoods, filters, selectedLocations]
  );
  const scopedListings = useMemo(
    () => (hasVisibleBoundary ? filteredListings : getListingsInViewport(filteredListings, viewportBounds)),
    [filteredListings, hasVisibleBoundary, viewportBounds]
  );
  const cardsModeListings = useMemo(
    () =>
      rankCardModeListings({
        filteredListings,
        scopedListings,
        visitedListingIds,
        hasBoundaryScope: hasVisibleBoundary,
      }),
    [filteredListings, hasVisibleBoundary, scopedListings, visitedListingIds]
  );
  const hasActiveSearchCriteria = hasAppliedArea || activeFilterCount() > 0 || selectedLocations.length > 0;
  const activeSavedSearch = searches.find((search) => search.id === activeSearchId) ?? null;
  const searchAreaNames = selectedLocations
    .filter((location) => (location.boundary?.length ?? 0) > 2)
    .map((location) => location.name);
  const areaSummaryLabel = getAreaSummaryLabel({
    neighborhoodIds: [...appliedNeighborhoods],
    searchAreaNames,
    hasCustomBoundary: appliedBoundary.length >= 3 || (hasSearchBoundary && searchAreaNames.length === 0),
  });
  const areaPreviewNeighborhoodId =
    hoveredNeighborhood?.id ??
    (focusedNeighborhood && !selectedNeighborhoods.has(focusedNeighborhood.id) ? focusedNeighborhood.id : null);
  const areaSelectHasVisibleBoundary =
    selectedNeighborhoods.size > 0 || drawnBoundary.length > 0 || hasSearchBoundary;

  const handleCarouselPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    carouselDragStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const handleCarouselPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = carouselDragStart.current;
    if (!start || start.id !== event.pointerId) return;
    carouselDragStart.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dy > 36 && Math.abs(dy) > Math.abs(dx) * 1.15) setCarouselVisible(false);
  };

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
    if (!activeSavedSearch) {
      setActiveSearchDirty(false);
      return;
    }
    setActiveSearchDirty(
      !areSearchSnapshotsEqual(
        createSearchSnapshot(selectedLocations, filters, appliedBoundary, appliedNeighborhoods),
        searchToSnapshot(activeSavedSearch)
      )
    );
  }, [activeSavedSearch, appliedBoundary, appliedNeighborhoods, filters, selectedLocations, setActiveSearchDirty]);

  useEffect(() => {
    if (isAreaSelect) return;
    const nextViewState = getSearchViewState(selectedLocations, appliedBoundary, appliedNeighborhoods);
    if (!nextViewState) return;
    setViewState(nextViewState);
  }, [appliedBoundary, appliedNeighborhoods, isAreaSelect, selectedLocations, setViewState]);

  const toggleNeighborhood = (id: string) => {
    setSelectedNeighborhoods((prev) => {
      setAreaUndoStack((stack) => [...stack, new Set(prev)]);
      setAreaRedoStack([]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editAppliedArea = () => {
    setSelectedNeighborhoods(new Set(appliedNeighborhoods));
    setDrawnBoundary(appliedBoundary);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setIsDrawingArea(false);
    setActivePanel('area-select');
  };

  const openAreaSelect = () => {
    if (hasAppliedArea) {
      editAppliedArea();
      return;
    }

    const { matchedNeighborhoodIds, fallbackBoundary } = getCarryoverAreaSelection(selectedLocations);
    setSelectedNeighborhoods(new Set(matchedNeighborhoodIds));
    setDrawnBoundary(fallbackBoundary);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setHoveredNeighborhood(null);
    setFocusedNeighborhood(
      matchedNeighborhoodIds.size > 0
        ? MOCK_NEIGHBORHOODS.find((neighborhood) => neighborhood.id === [...matchedNeighborhoodIds][0]) ?? null
        : null
    );
    setIsDrawingArea(false);
    setAreaSelectMode(true);
    setActivePanel('area-select');
  };

  const openDrawAreaSelect = () => {
    flushSync(() => {
      setIsDrawingArea(true);
      setAreaSelectMode(true);
      setActivePanel('area-select');
    });
    if (hasAppliedArea) {
      setSelectedNeighborhoods(new Set(appliedNeighborhoods));
      setDrawnBoundary(appliedBoundary);
    } else {
      const { matchedNeighborhoodIds, fallbackBoundary } = getCarryoverAreaSelection(selectedLocations);
      setSelectedNeighborhoods(new Set(matchedNeighborhoodIds));
      setDrawnBoundary(fallbackBoundary);
    }
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
  };

  const clearAppliedArea = () => {
    setAppliedNeighborhoods(new Set());
    setAppliedBoundary([]);
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
  };

  const clearVisibleBoundaries = () => {
    clearAppliedArea();
    const remainingLocations = selectedLocations.filter((location) => (location.boundary?.length ?? 0) < 3);
    if (remainingLocations.length !== selectedLocations.length) {
      if (remainingLocations.length === 0) clearLocations();
      else setLocations(remainingLocations);
    }
  };

  const removeAppliedAreaChip = (label: string) => {
    const normalizedLabel = getPrimaryLocationLabel(label).trim().toLowerCase();
    const matchingNeighborhood = MOCK_NEIGHBORHOODS.find(
      (neighborhood) => getPrimaryLocationLabel(neighborhood.name).trim().toLowerCase() === normalizedLabel
    );

    if (matchingNeighborhood && appliedNeighborhoods.has(matchingNeighborhood.id)) {
      const nextNeighborhoods = new Set(appliedNeighborhoods);
      nextNeighborhoods.delete(matchingNeighborhood.id);
      setAppliedNeighborhoods(nextNeighborhoods);
      setSelectedNeighborhoods(new Set(nextNeighborhoods));
      return;
    }

    clearVisibleBoundaries();
  };

  const removeSearchLocationChip = (location: SavedSearch['locations'][number]) => {
    const normalizedLabel = getPrimaryLocationLabel(location.name).trim().toLowerCase();
    const matchingNeighborhood = MOCK_NEIGHBORHOODS.find(
      (neighborhood) => getPrimaryLocationLabel(neighborhood.name).trim().toLowerCase() === normalizedLabel
    );

    if (matchingNeighborhood && appliedNeighborhoods.has(matchingNeighborhood.id)) {
      const nextNeighborhoods = new Set(appliedNeighborhoods);
      nextNeighborhoods.delete(matchingNeighborhood.id);
      setAppliedNeighborhoods(nextNeighborhoods);
      setSelectedNeighborhoods(new Set(nextNeighborhoods));
    }

    const remainingLocations = selectedLocations.filter((item) => item.id !== location.id);
    if (remainingLocations.length === 0) clearLocations();
    else setLocations(remainingLocations);
  };

  const undoBoundary = () => {
    if (drawnBoundary.length === 0 && clearedBoundarySnapshot && redoBoundary.length === 0) {
      setDrawnBoundary(clearedBoundarySnapshot);
      setClearedBoundaryRedoSnapshot(clearedBoundarySnapshot);
      setClearedBoundarySnapshot(null);
      return;
    }
    if (drawnBoundary.length === 0) {
      setAreaUndoStack((stack) => {
        if (stack.length === 0) return stack;
        const previous = stack[stack.length - 1];
        setAreaRedoStack((redo) => [new Set(selectedNeighborhoods), ...redo]);
        setSelectedNeighborhoods(new Set(previous));
        return stack.slice(0, -1);
      });
      return;
    }
    setDrawnBoundary((points) => {
      if (points.length === 0) return points;
      const next = points.slice(0, -1);
      setRedoBoundary((redo) => [points[points.length - 1], ...redo]);
      setClearedBoundarySnapshot(null);
      setClearedBoundaryRedoSnapshot(null);
      return next;
    });
  };

  const redoBoundaryPoint = () => {
    if (drawnBoundary.length > 0 && clearedBoundaryRedoSnapshot && redoBoundary.length === 0) {
      setDrawnBoundary([]);
      setClearedBoundarySnapshot(clearedBoundaryRedoSnapshot);
      setClearedBoundaryRedoSnapshot(null);
      return;
    }
    if (drawnBoundary.length === 0 && clearedBoundarySnapshot === null && redoBoundary.length > 0) {
      setRedoBoundary((redo) => {
        if (redo.length === 0) return redo;
        const [point, ...rest] = redo;
        setDrawnBoundary([point]);
        return rest;
      });
      return;
    }
    if (redoBoundary.length === 0) {
      setAreaRedoStack((redo) => {
        if (redo.length === 0) return redo;
        const [next, ...rest] = redo;
        setAreaUndoStack((stack) => [...stack, new Set(selectedNeighborhoods)]);
        setSelectedNeighborhoods(new Set(next));
        return rest;
      });
      return;
    }
    setRedoBoundary((redo) => {
      if (redo.length === 0) return redo;
      const [point, ...rest] = redo;
      setDrawnBoundary((points) => [...points, point]);
      return rest;
    });
  };

  const clearAreaSelection = () => {
    if (selectedNeighborhoods.size > 0) {
      setAreaUndoStack((stack) => [...stack, new Set(selectedNeighborhoods)]);
      setAreaRedoStack([]);
    }
    if (drawnBoundary.length > 0) {
      setClearedBoundarySnapshot(drawnBoundary);
      setClearedBoundaryRedoSnapshot(null);
    } else {
      setClearedBoundarySnapshot(null);
      setClearedBoundaryRedoSnapshot(null);
    }
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
    setRedoBoundary([]);
    setFocusedNeighborhood(null);
    const remainingLocations = selectedLocations.filter((location) => (location.boundary?.length ?? 0) < 3);
    if (remainingLocations.length !== selectedLocations.length) {
      if (remainingLocations.length === 0) clearLocations();
      else setLocations(remainingLocations);
    }
  };

  const closeAreaSelect = () => {
    setAppliedNeighborhoods(new Set(selectedNeighborhoods));
    setAppliedBoundary(drawnBoundary);
    setActivePanel('none');
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
  };

  const applyAreaSelect = () => {
    setAppliedNeighborhoods(new Set(selectedNeighborhoods));
    setAppliedBoundary(drawnBoundary);
    setActivePanel('none');
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
  };

  const applySavedSearch = (search: SavedSearch) => {
    const nextNeighborhoods = new Set(search.neighborhoodIds ?? []);
    const nextBoundary = search.areaBoundary?.map((point) => ({ ...point })) ?? [];
    setAppliedNeighborhoods(nextNeighborhoods);
    setAppliedBoundary(nextBoundary);
    setSelectedNeighborhoods(new Set(nextNeighborhoods));
    setDrawnBoundary(nextBoundary);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
    setCarouselVisible(false);
    setSelectedListingId(null);
    setMobileCarouselListingId(null);

    const nextViewState = getSearchViewState(search.locations, nextBoundary, nextNeighborhoods);
    if (nextViewState) setViewState(nextViewState);
  };

  const handleSelectSavedSearch = (search: SavedSearch) => {
    setPreSavedSearchState((current) =>
      current ?? createSearchSnapshot(selectedLocations, filters, appliedBoundary, appliedNeighborhoods)
    );
    applySavedSearch(search);
  };

  const handleDeselectSavedSearch = () => {
    const fallback = preSavedSearchState;
    setActiveSearchId(null);
    setActiveSearchDirty(false);
    if (!fallback) return;
    setLocations(fallback.locations);
    replaceFilters(fallback.filters);
    setAppliedBoundary(fallback.areaBoundary);
    setAppliedNeighborhoods(new Set(fallback.neighborhoodIds));
    setSelectedNeighborhoods(new Set(fallback.neighborhoodIds));
    setDrawnBoundary(fallback.areaBoundary);
    setRedoBoundary([]);
    setClearedBoundarySnapshot(null);
    setClearedBoundaryRedoSnapshot(null);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setPreSavedSearchState(null);
    const nextViewState = getSearchViewState(
      fallback.locations,
      fallback.areaBoundary,
      new Set(fallback.neighborhoodIds)
    );
    if (nextViewState) setViewState(nextViewState);
  };

  const handleUpdateSavedSearch = (searchId: string) => {
    updateSearch(searchId, {
      name: searches.find((search) => search.id === searchId)?.name ?? 'Saved Search',
      locations: selectedLocations,
      filters,
      areaBoundary: appliedBoundary,
      neighborhoodIds: [...appliedNeighborhoods],
    });
  };

  const handleNeighborhoodClick = (neighborhood: Neighborhood) => {
    setAreaFocusToken((token) => token + 1);
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (!isDesktop) {
      const isIncluded = selectedNeighborhoods.has(neighborhood.id);
      toggleNeighborhood(neighborhood.id);
      if (isIncluded) {
        setFocusedNeighborhood(null);
        setHoveredNeighborhood(null);
        return;
      }
      setFocusedNeighborhood(neighborhood);
      return;
    }
    setSelectedNeighborhoods((prev) => {
      setAreaUndoStack((stack) => [...stack, new Set(prev)]);
      setAreaRedoStack([]);
      const next = new Set(prev);
      if (next.has(neighborhood.id)) {
        next.delete(neighborhood.id);
        setFocusedNeighborhood(null);
      } else {
        next.add(neighborhood.id);
        setFocusedNeighborhood(neighborhood);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full min-w-0 overflow-hidden bg-white">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Desktop header (hidden on mobile) */}
      <DesktopHeader
        hasAppliedArea={hasVisibleBoundary}
        areaSummaryLabel={areaSummaryLabel}
        currentNeighborhoodIds={[...appliedNeighborhoods]}
        onRemoveLocationChip={removeSearchLocationChip}
        onRemoveAreaChip={removeAppliedAreaChip}
        onClearArea={clearVisibleBoundaries}
      />

      {/* Main content — split on desktop */}
      <div className="flex w-full min-w-0 flex-1 overflow-hidden">
        {/* Map panel */}
        <div className="relative min-w-0 flex-1 lg:mr-2 lg:mt-4 lg:overflow-hidden lg:rounded-tr-[28px]">
          <MapView
            listings={isAreaSelect ? [] : filteredListings}
            showNeighborhoods={isAreaSelect && !isDrawingArea}
            showListings={!isAreaSelect}
            searchedLocations={selectedLocations}
            selectedNeighborhoodId={isAreaSelect ? focusedNeighborhood?.id ?? null : null}
            previewNeighborhoodId={isAreaSelect ? areaPreviewNeighborhoodId : null}
            includedNeighborhoodIds={isAreaSelect ? selectedNeighborhoods : appliedNeighborhoods}
            onNeighborhoodClick={handleNeighborhoodClick}
            onNeighborhoodHover={setHoveredNeighborhood}
            onAreaMapClick={(coordinates) => {
              if (isDrawingArea) {
                setDrawnBoundary((points) => [...points, coordinates]);
                setRedoBoundary([]);
                setClearedBoundarySnapshot(null);
                setClearedBoundaryRedoSnapshot(null);
              } else {
                setFocusedNeighborhood(null);
                setHoveredNeighborhood(null);
              }
            }}
            drawnBoundary={isAreaSelect ? drawnBoundary : appliedBoundary}
            isAreaMode={isAreaSelect}
          />

          {!isAreaSelect && (
            <div className="pointer-events-auto absolute left-5 top-5 z-20 hidden items-center gap-2 lg:flex">
              <button
                onClick={openDrawAreaSelect}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)]"
                aria-label="Draw"
              >
                <Pencil size={18} className="text-[var(--color-text-primary)]" />
              </button>
              <button
                onClick={() => {
                  openAreaSelect();
                }}
                className="flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <SquareDashedMousePointer size={18} className="text-[var(--color-text-primary)]" />
                Select Areas
              </button>
              {hasVisibleBoundary && (
                <button
                  onClick={clearVisibleBoundaries}
                  className="h-11 rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)]"
                >
                  Clear Areas
                </button>
              )}
            </div>
          )}

          {/* Mobile top bar (hidden on desktop — search lives in DesktopHeader) */}
          <div className={isAreaSelect ? 'hidden' : 'lg:hidden'}>
            <TopBar
              hasAppliedArea={hasVisibleBoundary}
              areaSummaryLabel={areaSummaryLabel}
              onOpenAreaSelect={openAreaSelect}
              onEditArea={editAppliedArea}
              onClearArea={clearVisibleBoundaries}
            />
          </div>

          {/* Mobile carousel — only visible after pin tap */}
          <AnimatePresence>
            {isCarouselVisible && !isAreaSelect && (
              <motion.div
                initial={{ y: 28, opacity: 0, scale: 0.965 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 28, opacity: 0, scale: 0.965 }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0, 0.1, 1] }}
                onPointerDownCapture={handleCarouselPointerDown}
                onPointerUpCapture={handleCarouselPointerUp}
                onPointerCancelCapture={() => { carouselDragStart.current = null; }}
                style={{ touchAction: 'none' }}
                className="
                  absolute left-0 right-0 bottom-[72px]
                  lg:hidden
                  pointer-events-auto
                "
              >
                <ListingsCarousel listings={scopedListings} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAreaSelect && (
              <AreaSelectPanel
                key="area-select"
                focusedNeighborhood={focusedNeighborhood}
                focusToken={areaFocusToken}
                selectedNeighborhoods={selectedNeighborhoods}
                hasVisibleBoundary={areaSelectHasVisibleBoundary}
                isDrawing={isDrawingArea}
                pointCount={drawnBoundary.length}
                canUndoBoundary={drawnBoundary.length > 0 || areaUndoStack.length > 0 || clearedBoundarySnapshot !== null}
                canRedoBoundary={redoBoundary.length > 0 || areaRedoStack.length > 0 || clearedBoundaryRedoSnapshot !== null}
                onBack={closeAreaSelect}
                onApply={applyAreaSelect}
                onToggleDrawing={() => setIsDrawingArea((value) => !value)}
                onToggleNeighborhood={toggleNeighborhood}
                onCloseNeighborhood={() => setFocusedNeighborhood(null)}
                onClearDrawing={() => {
                  if (drawnBoundary.length === 0) return;
                  setClearedBoundarySnapshot(drawnBoundary);
                  setClearedBoundaryRedoSnapshot(null);
                  setDrawnBoundary([]);
                  setRedoBoundary([]);
                }}
                onUndoBoundary={undoBoundary}
                onRedoBoundary={redoBoundaryPoint}
                onClearSelection={clearAreaSelection}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Desktop listings sidebar */}
        {!isDesktopMapExpanded && (
          <div className="hidden shrink-0 overflow-hidden lg:block lg:w-[696px] 3xl:w-[1036px]">
            <ListingsSidebar listings={scopedListings} useMapAreaLabel={!hasVisibleBoundary} />
          </div>
        )}
      </div>

      {/* Mobile bottom nav (pill + side buttons) */}
      {!isAreaSelect && <BottomNav />}

      {/* Mobile-only panels */}
      <AnimatePresence>
        {activePanel === 'search' && (
          <SearchPanel
            key="search"
            hasAppliedArea={hasVisibleBoundary}
            areaSummaryLabel={areaSummaryLabel}
            currentNeighborhoodIds={[...appliedNeighborhoods]}
            onRemoveLocationChip={removeSearchLocationChip}
            onRemoveAreaChip={removeAppliedAreaChip}
            onOpenAreaSelect={openAreaSelect}
            onEditArea={editAppliedArea}
            onClearArea={clearVisibleBoundaries}
          />
        )}
        {activePanel === 'filter' && <FilterPanel key="filter" totalListings={filteredListings.length} />}
        {activePanel === 'listing-detail' && <ListingDetailSheet key="listing-detail" />}
        {activePanel === 'saved-searches' && (
          <SavedSearchesPanel
            key="saved-searches"
            hasActiveCriteria={hasActiveSearchCriteria}
            currentBoundary={appliedBoundary}
            currentNeighborhoodIds={[...appliedNeighborhoods]}
            activeSearchDirty={activeSavedSearch !== null && !areSearchSnapshotsEqual(
              createSearchSnapshot(selectedLocations, filters, appliedBoundary, appliedNeighborhoods),
              searchToSnapshot(activeSavedSearch)
            )}
            onSelectSearch={handleSelectSavedSearch}
            onDeselectSearch={handleDeselectSavedSearch}
            onUpdateSearch={handleUpdateSavedSearch}
          />
        )}
      </AnimatePresence>

      {/* Cards mode */}
      <AnimatePresence>
        {activePanel === 'cards' && (
          <CardsMode
            key="cards"
            listings={cardsModeListings}
            onClose={() => {
              setSelectedListingId(null);
              setMobileCarouselListingId(null);
              setActivePanel('none');
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
