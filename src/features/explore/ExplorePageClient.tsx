'use client';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, SquareDashedMousePointer } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import { useAreaScopeStore } from '@/store/areaScopeStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useSavedStore } from '@/store/savedStore';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import TopBar from '@/components/layout/TopBar';
import ListingsCarousel from '@/features/listings/components/ListingsCarousel';
import ListingsListView from '@/features/listings/components/ListingsListView';
import DesktopHeader from '@/components/layout/DesktopHeader';
import MapControlButton from '@/components/ui/MapControlButton';
import { getAreaChips, getCompactAreaChipLabel } from '@/lib/utils/search-display';
import { cn } from '@/lib/utils/cn';
import { useAreaSelection } from '@/features/explore/hooks/useAreaSelection';
import { useExploreListings } from '@/features/explore/hooks/useExploreListings';
import { useExplorePageEffects } from '@/features/explore/hooks/useExplorePageEffects';
import { useSavedSearchSession } from '@/features/explore/hooks/useSavedSearchSession';
import { getSearchViewState } from '@/features/explore/lib/searchViewState';

const MapView = dynamic(() => import('@/features/map/MapView'), { ssr: false });
const SearchPanel = dynamic(() => import('@/features/search/components/SearchPanel'), { ssr: false });
const FilterPanel = dynamic(() => import('@/features/search/components/FilterPanel'), { ssr: false });
const CardsMode = dynamic(() => import('@/features/listings/components/CardsMode'), { ssr: false });
const AreaSelectPanel = dynamic(() => import('@/features/explore/AreaSelectPanel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/features/listings/components/ListingDetailSheet'), { ssr: false });
const SavedSearchesPanel = dynamic(() => import('@/features/saved-searches/components/SavedSearchesPanel'), { ssr: false });
const ListingsSidebar = dynamic(() => import('@/features/listings/components/ListingsSidebar'), { ssr: false });
const preloadListingsListView = () => Promise.resolve();
const MOBILE_LIST_RETURN_KEY = 'homes-mobile-list-return';

export default function ExplorePageClient() {
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
  const savedListingIds = useSavedStore((s) => s.likedListingIds);
  const appliedBoundaries = useAreaScopeStore((s) => s.appliedBoundaries);
  const appliedNeighborhoods = useAreaScopeStore((s) => s.appliedNeighborhoods);
  const setAppliedBoundaries = useAreaScopeStore((s) => s.setAppliedBoundaries);
  const setAppliedNeighborhoods = useAreaScopeStore((s) => s.setAppliedNeighborhoods);
  const setAppliedArea = useAreaScopeStore((s) => s.setAppliedArea);
  const clearAppliedAreaScope = useAreaScopeStore((s) => s.clearAppliedArea);
  const {
    searches,
    activeSearchId,
    setActiveSearchId,
    setActiveSearchDirty,
    updateSearch,
  } = useSavedSearchStore();
  const [mobileListingsView, setMobileListingsView] = useState<'map' | 'list'>(() => {
    if (typeof window === 'undefined') return 'map';
    return window.sessionStorage.getItem(`${MOBILE_LIST_RETURN_KEY}:view`) === 'list' ? 'list' : 'map';
  });
  const carouselDragStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const {
    addDrawnBoundaryPoint,
    addDrawnBoundaryShape,
    areaFocusToken,
    areaPreviewNeighborhoodId,
    canAddShape,
    canClearShapes,
    canRedoBoundary,
    canUndoBoundary,
    cancelAreaSelect,
    clearDrawnBoundaryShapes,
    clearVisibleBoundaries,
    draftBoundaryCount,
    drawnBoundary,
    editAppliedArea,
    focusedNeighborhood,
    handleDeselectSavedSearch: deselectSavedSearchWithAreaRestore,
    handleNeighborhoodClick,
    handleSelectSavedSearch,
    hasEditedDrawSession,
    isAreaSelect,
    isDrawingArea,
    openAreaSelect,
    openAreaSelection,
    applyAreaSelect,
    redoBoundaryPoint,
    removeAppliedAreaChip,
    removeSearchLocationChip,
    selectedNeighborhoods,
    setFocusedNeighborhood,
    setHoveredNeighborhood,
    toggleNeighborhood,
    undoBoundary,
    visibleDraftBoundaries,
  } = useAreaSelection({
    activePanel,
    selectedLocations,
    filters,
    appliedBoundaries,
    appliedNeighborhoods,
    setLocations,
    clearLocations,
    setAppliedBoundaries,
    setAppliedNeighborhoods,
    setAppliedArea,
    clearAppliedAreaScope,
    setActivePanel,
    setAreaSelectMode,
    onOpenAreaSelection: () => setMobileListingsView('map'),
    onApplySavedSearch: (search, boundaries, neighborhoods) => {
      setCarouselVisible(false);
      setSelectedListingId(null);
      setMobileCarouselListingId(null);
      const nextViewState = getSearchViewState(search.locations, boundaries, neighborhoods);
      if (nextViewState) setViewState(nextViewState);
    },
    onRestoreSearchState: (fallback) => {
      replaceFilters(fallback.filters);
      const nextViewState = getSearchViewState(
        fallback.locations,
        fallback.areaBoundaries,
        new Set(fallback.neighborhoodIds)
      );
      if (nextViewState) setViewState(nextViewState);
    },
  });
  const {
    cardsModeListings,
    filteredListings,
    hasActiveSearchCriteria,
    hasSearchBoundary,
    hasVisibleBoundary,
    scopedListings,
  } = useExploreListings({
    filters,
    selectedLocations,
    appliedBoundaries,
    appliedNeighborhoods,
    viewportBounds,
    visitedListingIds,
    savedListingIds,
    activeFilterCount: activeFilterCount(),
  });
  const { activeSearchDirty, updateActiveSearch } = useSavedSearchSession({
    searches,
    activeSearchId,
    selectedLocations,
    filters,
    appliedBoundaries,
    appliedNeighborhoods,
    setActiveSearchDirty,
    updateSearch,
  });
  const activeAreaChips = getAreaChips({
    neighborhoodIds: [...appliedNeighborhoods],
    searchLocations: selectedLocations,
    hasCustomBoundary: appliedBoundaries.length > 0,
  });
  const compactAreaChipLabel = getCompactAreaChipLabel(activeAreaChips);
  const areaSelectHasVisibleBoundary =
    selectedNeighborhoods.size > 0 || visibleDraftBoundaries.length > 0 || hasSearchBoundary;
  const isMobileListingsList = mobileListingsView === 'list' && !isAreaSelect;

  useExplorePageEffects({
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
  });

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

  const openMobileListingsList = () => {
    setActivePanel('none');
    setCarouselVisible(false);
    setSelectedListingId(null);
    setMobileCarouselListingId(null);
    setHoveredListingId(null);
    setMobileListingsView('list');
  };

  const openDrawAreaSelect = () => {
    flushSync(() => openAreaSelection('draw'));
  };

  const handleDeselectSavedSearch = () => {
    deselectSavedSearchWithAreaRestore(() => {
      setActiveSearchId(null);
      setActiveSearchDirty(false);
    });
  };

  return (
    <div className="flex h-full min-w-0 overflow-hidden bg-white">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Desktop header (hidden on mobile) */}
      <DesktopHeader
        filterResultsCount={filteredListings.length}
        hasAppliedArea={hasVisibleBoundary}
        areaChips={activeAreaChips}
        currentNeighborhoodIds={[...appliedNeighborhoods]}
        compactAreaChipLabel={compactAreaChipLabel}
        onRemoveLocationChip={removeSearchLocationChip}
        onRemoveAreaChip={removeAppliedAreaChip}
        onClearArea={clearVisibleBoundaries}
        onOpenCards={() => {
          setCarouselVisible(false);
          setSelectedListingId(null);
          setMobileCarouselListingId(null);
          setActivePanel('cards');
        }}
        cardsDisabled={cardsModeListings.length === 0}
      />

      {/* Main content — split on desktop */}
      <div className="relative flex w-full min-w-0 flex-1 overflow-hidden">
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
                addDrawnBoundaryPoint(coordinates);
              } else {
                setFocusedNeighborhood(null);
                setHoveredNeighborhood(null);
              }
            }}
            drawnBoundaries={isAreaSelect ? visibleDraftBoundaries : appliedBoundaries}
            isAreaMode={isAreaSelect}
          />

          {!isAreaSelect && (
            <div className="pointer-events-auto absolute left-5 top-5 z-20 hidden items-center gap-2 lg:flex">
              <MapControlButton
                onClick={openDrawAreaSelect}
                shape="circle"
                aria-label="Draw"
              >
                <Pencil size={18} className="text-[var(--color-text-primary)]" />
              </MapControlButton>
              <MapControlButton
                onClick={() => {
                  openAreaSelect();
                }}
              >
                <SquareDashedMousePointer size={18} className="text-[var(--color-text-primary)]" />
                Select Areas
              </MapControlButton>
              {hasVisibleBoundary && (
                <MapControlButton
                  onClick={clearVisibleBoundaries}
                >
                  Clear Areas
                </MapControlButton>
              )}
            </div>
          )}

          {/* Mobile top bar (hidden on desktop — search lives in DesktopHeader) */}
          <div className={isAreaSelect ? 'hidden' : 'lg:hidden'}>
            <TopBar
              hasAppliedArea={hasVisibleBoundary}
              compactAreaChipLabel={compactAreaChipLabel}
              onOpenAreaSelect={openAreaSelect}
              onOpenDrawAreaSelect={openDrawAreaSelect}
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
                shapeCount={draftBoundaryCount}
                canAddShape={canAddShape}
                canClearShapes={canClearShapes}
                showDrawControls={isDrawingArea && (drawnBoundary.length > 0 || hasEditedDrawSession)}
                canUndoBoundary={canUndoBoundary}
                canRedoBoundary={canRedoBoundary}
                onBack={cancelAreaSelect}
                onApply={applyAreaSelect}
                onAddShape={addDrawnBoundaryShape}
                onClearShapes={clearDrawnBoundaryShapes}
                onToggleNeighborhood={toggleNeighborhood}
                onCloseNeighborhood={() => setFocusedNeighborhood(null)}
                onUndoBoundary={undoBoundary}
                onRedoBoundary={redoBoundaryPoint}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isMobileListingsList && (
            <motion.div
              key="mobile-listings-list"
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.24, ease: [0.2, 0, 0.1, 1] }}
              className="fixed inset-0 z-40 bg-white lg:hidden"
            >
              <ListingsListView
                listings={scopedListings}
                useMapAreaLabel={!hasVisibleBoundary}
                areaTitleLabel={hasVisibleBoundary ? compactAreaChipLabel : undefined}
                variant="mobile"
                onShowMap={() => {
                  window.sessionStorage.removeItem(`${MOBILE_LIST_RETURN_KEY}:view`);
                  setMobileListingsView('map');
                }}
                scrollRestorationKey={MOBILE_LIST_RETURN_KEY}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop listings sidebar */}
        {!isDesktopMapExpanded && (
          <div className="hidden shrink-0 overflow-hidden lg:block lg:w-[696px] 3xl:w-[1036px]">
            <ListingsSidebar
              listings={scopedListings}
              useMapAreaLabel={!hasVisibleBoundary}
              areaTitleLabel={hasVisibleBoundary ? compactAreaChipLabel : undefined}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom nav (pill + side buttons) */}
      {!isAreaSelect && !isMobileListingsList && (
        <>
          <div
            className={cn(
              'pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 lg:hidden',
              isCarouselVisible && 'hidden'
            )}
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
          >
            <button
              type="button"
              onClick={openMobileListingsList}
              className="pointer-events-auto flex h-10 items-center rounded-full bg-[var(--color-surface-elevated)] px-4 type-caption font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-all hover:bg-[var(--color-surface)] active:scale-95"
            >
              {scopedListings.length} listings
            </button>
          </div>
          <BottomNav />
        </>
      )}

      {/* Mobile-only panels */}
      <AnimatePresence>
        {activePanel === 'search' && (
          <SearchPanel
            key="search"
            hasAppliedArea={hasVisibleBoundary}
            areaChips={activeAreaChips}
            currentNeighborhoodIds={[...appliedNeighborhoods]}
            onRemoveLocationChip={removeSearchLocationChip}
            onRemoveAreaChip={removeAppliedAreaChip}
            onOpenAreaSelect={openAreaSelect}
            onOpenDrawAreaSelect={openDrawAreaSelect}
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
            currentBoundary={appliedBoundaries[0]}
            currentBoundaries={appliedBoundaries}
            currentNeighborhoodIds={[...appliedNeighborhoods]}
            activeSearchDirty={activeSearchDirty}
            currentListings={filteredListings}
            onSelectSearch={handleSelectSavedSearch}
            onDeselectSearch={handleDeselectSavedSearch}
            onUpdateSearch={updateActiveSearch}
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
