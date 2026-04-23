'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import BottomNav from '@/components/organisms/BottomNav';
import TopBar from '@/components/organisms/TopBar';
import ListingsCarousel from '@/components/organisms/ListingsCarousel';
import DesktopHeader from '@/components/organisms/DesktopHeader';
import { Neighborhood, SavedSearch, SearchFilters } from '@/lib/types';

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

export default function MapPage() {
  const { activePanel, setActivePanel, isCarouselVisible, setCarouselVisible } = useUIStore();
  const { filters, selectedLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const setViewState = useMapStore((s) => s.setViewState);
  const [focusedNeighborhood, setFocusedNeighborhood] = useState<Neighborhood | null>(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [drawnBoundary, setDrawnBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [redoBoundary, setRedoBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [areaUndoStack, setAreaUndoStack] = useState<Set<string>[]>([]);
  const [areaRedoStack, setAreaRedoStack] = useState<Set<string>[]>([]);
  const [appliedNeighborhoods, setAppliedNeighborhoods] = useState<Set<string>>(new Set());
  const [appliedBoundary, setAppliedBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const carouselDragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const filteredListings = applyFilters(MOCK_LISTINGS, filters);
  const cardsModeListings = filteredListings;
  const isAreaSelect = activePanel === 'area-select';
  const hasAppliedArea = appliedBoundary.length > 0 || appliedNeighborhoods.size > 0;
  const hasActiveSearchCriteria = hasAppliedArea || activeFilterCount() > 0 || selectedLocations.length > 0;

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

    const target = nextBoundary[0] ?? search.locations[0]?.coordinates;
    if (target) {
      setViewState({
        longitude: target.lng,
        latitude: target.lat,
        zoom: nextBoundary.length > 0 || nextNeighborhoods.size > 0 ? 13.8 : 13,
      });
    }
  };

  const handleNeighborhoodClick = (neighborhood: Neighborhood) => {
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
    <div className="h-full flex flex-col overflow-hidden bg-[#F5F6F7]">
      {/* Desktop header (hidden on mobile) */}
      <DesktopHeader />

      {/* Main content — split on desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map panel */}
        <div className="relative flex-1 lg:flex-none lg:basis-[44%]">
          <MapView
            listings={isAreaSelect ? [] : filteredListings}
            showNeighborhoods={isAreaSelect}
            showListings={!isAreaSelect}
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
            <button
              onClick={() => {
                editAppliedArea();
                setActivePanel('area-select');
              }}
              className="pointer-events-auto absolute left-5 top-5 z-20 hidden h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0F1729] shadow-[var(--shadow-control)] lg:flex"
            >
              <Layers size={16} />
              Area
            </button>
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
        <div className="hidden min-w-[680px] flex-1 overflow-hidden lg:block">
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
            onApplySearch={applySavedSearch}
          />
        )}
      </AnimatePresence>

      {/* Cards mode */}
      <AnimatePresence>
        {activePanel === 'cards' && (
          <CardsMode
            key="cards"
            listings={cardsModeListings}
            onClose={() => setActivePanel('none')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
