'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data/neighborhoods';
import {
  getBoundsCenter,
  getBoundsFromPoints,
  getLocationBounds,
  getNeighborhoodBounds,
  getSuggestedZoom,
  listingMatchesLocation,
  mergeBounds,
  pointInPolygon,
} from '@/lib/geo';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import BottomNav from '@/components/organisms/BottomNav';
import TopBar from '@/components/organisms/TopBar';
import ListingsCarousel from '@/components/organisms/ListingsCarousel';
import DesktopHeader from '@/components/organisms/DesktopHeader';
import AppImageIcon from '@/components/atoms/AppImageIcon';
import { Neighborhood, SavedSearch, SearchFilters } from '@/lib/types';

interface SearchSnapshot {
  locations: SavedSearch['locations'];
  filters: SearchFilters;
  areaBoundary: { lat: number; lng: number }[];
  neighborhoodIds: string[];
}

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
const SearchPanel = dynamic(() => import('@/components/organisms/SearchPanel'), { ssr: false });
const FilterPanel = dynamic(() => import('@/components/organisms/FilterPanel'), { ssr: false });
const CardsMode = dynamic(() => import('@/components/organisms/CardsMode'), { ssr: false });
const AreaSelectPanel = dynamic(() => import('@/components/organisms/AreaSelectPanel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });
const SavedSearchesPanel = dynamic(() => import('@/components/organisms/SavedSearchesPanel'), { ssr: false });
const ListingsSidebar = dynamic(() => import('@/components/organisms/ListingsSidebar'), { ssr: false });

function applyFilters(listings: typeof MOCK_LISTINGS, filters: SearchFilters) {
  return listings.filter((l) => {
    if (filters.minPrice && l.price < filters.minPrice) return false;
    if (filters.maxPrice && l.price > filters.maxPrice) return false;
    if (filters.minBeds && l.beds < filters.minBeds) return false;
    if (filters.minBaths && l.baths < filters.minBaths) return false;
    if (filters.minSqft && l.sqft < filters.minSqft) return false;
    if (filters.maxSqft && l.sqft > filters.maxSqft) return false;
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(l.propertyType)) return false;
    if (filters.maxDaysOnMarket && l.daysOnMarket > filters.maxDaysOnMarket) return false;
    return true;
  });
}

function filterListingsBySearchArea(
  listings: typeof MOCK_LISTINGS,
  selectedLocations: SavedSearch['locations'],
  boundary: { lat: number; lng: number }[],
  neighborhoodIds: Set<string>
) {
  if (boundary.length >= 3) {
    return listings.filter((listing) => pointInPolygon(listing.coordinates, boundary));
  }

  if (neighborhoodIds.size > 0) {
    const selectedNeighborhoods = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhoodIds.has(neighborhood.id));
    return listings.filter((listing) =>
      selectedNeighborhoods.some((neighborhood) =>
        pointInPolygon(listing.coordinates, neighborhood.boundary ?? [])
      )
    );
  }

  if (selectedLocations.length > 0) {
    return listings.filter((listing) =>
      selectedLocations.some((location) => listingMatchesLocation(listing, location))
    );
  }

  return listings;
}

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

function createSearchSnapshot(
  locations: SavedSearch['locations'],
  filters: SearchFilters,
  areaBoundary: { lat: number; lng: number }[],
  neighborhoods: Set<string>
): SearchSnapshot {
  return {
    locations: locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...filters, propertyTypes: [...filters.propertyTypes] },
    areaBoundary: areaBoundary.map((point) => ({ ...point })),
    neighborhoodIds: [...neighborhoods].sort(),
  };
}

function searchToSnapshot(search: SavedSearch): SearchSnapshot {
  return {
    locations: search.locations.map((location) => ({ ...location, coordinates: { ...location.coordinates } })),
    filters: { ...search.filters, propertyTypes: [...search.filters.propertyTypes] },
    areaBoundary: search.areaBoundary?.map((point) => ({ ...point })) ?? [],
    neighborhoodIds: [...(search.neighborhoodIds ?? [])].sort(),
  };
}

function areSearchSnapshotsEqual(a: SearchSnapshot, b: SearchSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function MapPage() {
  const { activePanel, setActivePanel, isCarouselVisible, setCarouselVisible } = useUIStore();
  const { filters, selectedLocations, setLocations, replaceFilters } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const setViewState = useMapStore((s) => s.setViewState);
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
  const [areaUndoStack, setAreaUndoStack] = useState<Set<string>[]>([]);
  const [areaRedoStack, setAreaRedoStack] = useState<Set<string>[]>([]);
  const [appliedNeighborhoods, setAppliedNeighborhoods] = useState<Set<string>>(new Set());
  const [appliedBoundary, setAppliedBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [preSavedSearchState, setPreSavedSearchState] = useState<SearchSnapshot | null>(null);
  const carouselDragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const filteredListings = filterListingsBySearchArea(
    applyFilters(MOCK_LISTINGS, filters),
    selectedLocations,
    appliedBoundary,
    appliedNeighborhoods
  );
  const cardsModeListings = filteredListings;
  const isAreaSelect = activePanel === 'area-select';
  const hasAppliedArea = appliedBoundary.length > 0 || appliedNeighborhoods.size > 0;
  const hasActiveSearchCriteria = hasAppliedArea || activeFilterCount() > 0 || selectedLocations.length > 0;
  const activeSavedSearch = searches.find((search) => search.id === activeSearchId) ?? null;

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
    if (!isCarouselVisible && !isDesktop) setSelectedListingId(null);
  }, [isCarouselVisible, setSelectedListingId]);

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
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setIsDrawingArea(false);
    setActivePanel('area-select');
  };

  const clearAppliedArea = () => {
    setAppliedNeighborhoods(new Set());
    setAppliedBoundary([]);
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
    setRedoBoundary([]);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
  };

  const undoBoundary = () => {
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
      return next;
    });
  };

  const redoBoundaryPoint = () => {
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
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
    setRedoBoundary([]);
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
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
    setAreaUndoStack([]);
    setAreaRedoStack([]);
    setFocusedNeighborhood(null);
    setHoveredNeighborhood(null);
    setIsDrawingArea(false);
    setCarouselVisible(false);
    setSelectedListingId(null);

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
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Desktop header (hidden on mobile) */}
      <DesktopHeader />

      {/* Main content — split on desktop */}
      <div className="mx-auto flex w-full max-w-[1872px] min-w-0 flex-1 overflow-hidden">
        {/* Map panel */}
        <div className="relative min-w-0 flex-1 lg:m-4 lg:mr-2 lg:overflow-hidden lg:rounded-[28px]">
          <MapView
            listings={isAreaSelect ? [] : filteredListings}
            showNeighborhoods={isAreaSelect}
            showListings={!isAreaSelect}
            searchedLocations={isAreaSelect ? [] : selectedLocations}
            selectedNeighborhoodId={isAreaSelect ? focusedNeighborhood?.id ?? null : null}
            previewNeighborhoodId={isAreaSelect ? hoveredNeighborhood?.id ?? null : null}
            includedNeighborhoodIds={isAreaSelect ? selectedNeighborhoods : appliedNeighborhoods}
            onNeighborhoodClick={handleNeighborhoodClick}
            onNeighborhoodHover={setHoveredNeighborhood}
            onAreaMapClick={(coordinates) => {
              if (isDrawingArea) {
                setDrawnBoundary((points) => [...points, coordinates]);
                setRedoBoundary([]);
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
                onClick={() => {
                  editAppliedArea();
                  setActivePanel('area-select');
                }}
                className="flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
              >
                <AppImageIcon src="/icons/area-selection.png" alt="Area selection" size={18} />
                Area
              </button>
              {hasAppliedArea && (
                <button
                  onClick={clearAppliedArea}
                  className="h-11 rounded-full bg-white px-4 type-btn text-[#6B7280] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Mobile top bar (hidden on desktop — search lives in DesktopHeader) */}
          <div className={isAreaSelect ? 'hidden' : 'lg:hidden'}>
            <TopBar
              hasAppliedArea={hasAppliedArea}
              onEditArea={editAppliedArea}
              onClearArea={clearAppliedArea}
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
                <ListingsCarousel listings={filteredListings} />
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
                isDrawing={isDrawingArea}
                pointCount={drawnBoundary.length}
                canUndoBoundary={drawnBoundary.length > 0 || areaUndoStack.length > 0}
                canRedoBoundary={redoBoundary.length > 0 || areaRedoStack.length > 0}
                onBack={closeAreaSelect}
                onApply={applyAreaSelect}
                onToggleDrawing={() => setIsDrawingArea((value) => !value)}
                onCancelDrawing={() => {
                  setIsDrawingArea(false);
                  setDrawnBoundary([]);
                  setRedoBoundary([]);
                }}
                onToggleNeighborhood={toggleNeighborhood}
                onFocusNeighborhood={setFocusedNeighborhood}
                onCloseNeighborhood={() => setFocusedNeighborhood(null)}
                onClearDrawing={() => {
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
        <div className="hidden shrink-0 overflow-hidden lg:block lg:w-[688px] 3xl:w-[1024px]">
          <ListingsSidebar listings={filteredListings} />
        </div>
      </div>

      {/* Mobile bottom nav (pill + side buttons) */}
      {!isAreaSelect && <BottomNav />}

      {/* Mobile-only panels */}
      <AnimatePresence>
        {activePanel === 'search' && (
          <SearchPanel
            key="search"
            hasAppliedArea={hasAppliedArea}
            onEditArea={editAppliedArea}
            onClearArea={clearAppliedArea}
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
              setActivePanel('none');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
