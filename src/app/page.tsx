'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import BottomNav from '@/components/organisms/BottomNav';
import TopBar from '@/components/organisms/TopBar';
import ListingsCarousel from '@/components/organisms/ListingsCarousel';
import DesktopHeader from '@/components/organisms/DesktopHeader';
import { Neighborhood, SearchFilters } from '@/lib/types';

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
  const { activePanel, setActivePanel, isCarouselVisible, setCarouselVisible, isSatelliteMode, setSatelliteMode } = useUIStore();
  const { filters } = useSearchStore();
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const [focusedNeighborhood, setFocusedNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [drawnBoundary, setDrawnBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [redoBoundary, setRedoBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const [showAreaAmenities, setShowAreaAmenities] = useState(false);
  const [appliedNeighborhoods, setAppliedNeighborhoods] = useState<Set<string>>(new Set());
  const [appliedBoundary, setAppliedBoundary] = useState<{ lat: number; lng: number }[]>([]);
  const carouselDragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const filteredListings = applyFilters(MOCK_LISTINGS, filters);
  const cardsModeListings = filteredListings;
  const isAreaSelect = activePanel === 'area-select';
  const hasAppliedArea = appliedBoundary.length > 0 || appliedNeighborhoods.size > 0;

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
    if (!isCarouselVisible) setSelectedListingId(null);
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
    setFocusedNeighborhood(null);
  };

  const undoBoundary = () => {
    setDrawnBoundary((points) => {
      if (points.length === 0) return points;
      const next = points.slice(0, -1);
      setRedoBoundary((redo) => [points[points.length - 1], ...redo]);
      return next;
    });
  };

  const redoBoundaryPoint = () => {
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
    setFocusedNeighborhood(null);
  };

  const closeAreaSelect = () => {
    setAppliedNeighborhoods(new Set(selectedNeighborhoods));
    setAppliedBoundary(drawnBoundary);
    setActivePanel('none');
    setFocusedNeighborhood(null);
    setIsDrawingArea(false);
    setSelectedNeighborhoods(new Set());
    setDrawnBoundary([]);
  };

  const applyAreaSelect = () => {
    setAppliedNeighborhoods(new Set(selectedNeighborhoods));
    setAppliedBoundary(drawnBoundary);
    setActivePanel('none');
    setFocusedNeighborhood(null);
    setIsDrawingArea(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F5F6F7]">
      {/* Desktop header (hidden on mobile) */}
      <DesktopHeader />

      {/* Main content — split on desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map panel */}
        <div className="flex-1 relative">
          <MapView
            listings={isAreaSelect ? [] : filteredListings}
            showNeighborhoods={isAreaSelect}
            showListings={!isAreaSelect}
            selectedNeighborhoodId={isAreaSelect ? focusedNeighborhood?.id ?? null : null}
            includedNeighborhoodIds={isAreaSelect ? selectedNeighborhoods : appliedNeighborhoods}
            onNeighborhoodClick={(neighborhood) => {
              setFocusedNeighborhood(neighborhood);
            }}
            onAreaMapClick={(coordinates) => {
              if (isDrawingArea) {
                setDrawnBoundary((points) => [...points, coordinates]);
                setRedoBoundary([]);
              } else {
                setFocusedNeighborhood(null);
              }
            }}
            drawnBoundary={isAreaSelect ? drawnBoundary : appliedBoundary}
            showAmenities={isAreaSelect && showAreaAmenities}
            isAreaMode={isAreaSelect}
          />

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
                isSatelliteMode={isSatelliteMode}
                showAmenities={showAreaAmenities}
                pointCount={drawnBoundary.length}
                canUndoBoundary={drawnBoundary.length > 0}
                canRedoBoundary={redoBoundary.length > 0}
                onBack={closeAreaSelect}
                onApply={applyAreaSelect}
                onToggleDrawing={() => setIsDrawingArea((value) => !value)}
                onCancelDrawing={() => {
                  setIsDrawingArea(false);
                  setDrawnBoundary([]);
                  setRedoBoundary([]);
                }}
                onToggleSatellite={() => setSatelliteMode(!isSatelliteMode)}
                onToggleAmenities={() => setShowAreaAmenities((value) => !value)}
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
        <div className="hidden lg:block w-[420px] overflow-hidden">
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
        {activePanel === 'saved-searches' && <SavedSearchesPanel key="saved-searches" />}
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
