'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Bookmark, GalleryHorizontalEnd, Menu, Share2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useLocationSearch } from '@/features/search/hooks/useLocationSearch';
import { cn } from '@/lib/utils/cn';
import { Location } from '@/lib/types';
import ListingSaveButton from '@/features/listings/components/ListingSaveButton';
import ListingNoteButton from '@/features/listings/components/ListingNoteButton';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';
import BackButton from '@/components/navigation/BackButton';
import { AreaChip } from '@/lib/utils/search-display';
import ControlPillButton from '@/components/ui/ControlPillButton';
import Button from '@/components/ui/Button';
import DesktopCollectionsControl from '@/components/layout/DesktopCollectionsControl';
import DesktopSearchControl from '@/components/layout/DesktopSearchControl';
import DesktopFilterControl from '@/components/layout/DesktopFilterControl';
import DesktopAccountMenu from '@/components/layout/DesktopAccountMenu';

const MENU_TRIGGER_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]';

interface DesktopHeaderProps {
  variant?: 'default' | 'listing';
  listingId?: string;
  filterResultsCount?: number;
  hasAppliedArea?: boolean;
  areaChips?: AreaChip[];
  currentNeighborhoodIds?: string[];
  compactAreaChipLabel?: string;
  onRemoveLocationChip?: (location: Location) => void;
  onRemoveAreaChip?: (chip: AreaChip) => void;
  onClearArea?: () => void;
  onOpenCards?: () => void;
  cardsDisabled?: boolean;
}

export default function DesktopHeader({
  variant = 'default',
  listingId,
  filterResultsCount,
  hasAppliedArea = false,
  areaChips = [],
  currentNeighborhoodIds = [],
  compactAreaChipLabel,
  onRemoveLocationChip,
  onRemoveAreaChip,
  onClearArea,
  onOpenCards,
  cardsDisabled = false,
}: DesktopHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations, addLocation, removeLocation, clearLocations } = useSearchStore();
  const { results: filteredLocations, isLoading: isSearchLoading } = useLocationSearch(
    searchQuery,
    selectedLocations,
    showSearch,
    currentNeighborhoodIds
  );
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { searches, activeSearchId, activeSearchDirty } = useSavedSearchStore();
  const { activePanel, setActivePanel } = useUIStore();

  const isCollectionsPage = pathname.startsWith('/saved');
  const isListingVariant = variant === 'listing';
  const isMapPage = pathname === '/' || pathname === '/map';
  const filterCount = activeFilterCount();
  const activeSearch = searches.find((search) => search.id === activeSearchId);
  const locationChipLabels = selectedLocations.map((location) => getPrimaryLocationLabel(location.name));
  const visibleAreaChips = areaChips.filter((chip) => !locationChipLabels.includes(chip.label));
  const locationLabel =
    selectedLocations.length === 0
      ? 'Add an area'
      : selectedLocations.length === 1
      ? getPrimaryLocationLabel(selectedLocations[0].name)
      : `${getPrimaryLocationLabel(selectedLocations[0].name)}, +${selectedLocations.length - 1}`;

  const selectLocation = (location: Location) => {
    addLocation(location);
    setSearchQuery('');
    setShowSearch(false);
  };

  useEffect(() => {
    if (!showFilter && !showSearch && !showMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (target instanceof HTMLElement && target.closest('[data-rename-delete-popover="true"]')) return;
      if (!filterRef.current?.contains(target)) setShowFilter(false);
      if (!searchRef.current?.contains(target)) setShowSearch(false);
      if (!menuRef.current?.contains(target)) setShowMenu(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilter, showSearch, showMenu]);

  useEffect(() => {
    if (!showSearch) return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showSearch]);

  return (
    <>
      <header className="relative hidden lg:flex min-h-[76px] bg-white items-center px-6 py-3 flex-shrink-0 z-[70]">
        {isListingVariant ? (
          <BackButton />
        ) : !isMapPage ? (
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="type-heading text-[var(--color-text-primary)]">homes</span>
          </button>
        ) : null}

        {isMapPage && (
          <DesktopCollectionsControl
            open={showCollections}
            onOpenChange={(open) => {
              setShowCollections(open);
              if (open) {
                setShowFilter(false);
                setShowSearch(false);
                setShowMenu(false);
              }
            }}
            align="left"
            className="absolute left-6 top-1/2 -translate-y-1/2"
          />
        )}

        {/* Centered search */}
        <div className={cn(
          'items-center justify-center gap-2 max-w-[540px]',
          isCollectionsPage
            ? 'hidden'
            : isListingVariant
            ? 'absolute left-1/2 top-1/2 flex w-[540px] -translate-x-1/2 -translate-y-1/2'
            : isMapPage
            ? 'absolute left-1/2 top-1/2 flex w-[540px] -translate-x-1/2 -translate-y-1/2'
            : 'mx-auto flex flex-1'
        )}>
          <DesktopSearchControl
            containerRef={searchRef}
            inputRef={searchInputRef}
            showSearch={showSearch}
            searchQuery={searchQuery}
            selectedLocations={selectedLocations}
            visibleAreaChips={visibleAreaChips}
            locationLabel={locationLabel}
            hasAppliedArea={hasAppliedArea}
            compactAreaChipLabel={compactAreaChipLabel}
            filteredLocations={filteredLocations}
            isSearchLoading={isSearchLoading}
            onOpenSearch={() => {
              setShowSearch(true);
              setShowFilter(false);
              setShowMenu(false);
            }}
            onSearchQueryChange={setSearchQuery}
            onSelectLocation={selectLocation}
            onRemoveLocation={(location) => {
              if (onRemoveLocationChip) onRemoveLocationChip(location);
              else removeLocation(location.id);
            }}
            onRemoveAreaChip={(chip) => {
              if (onRemoveAreaChip) onRemoveAreaChip(chip);
              else onClearArea?.();
            }}
            onClearAll={() => {
              clearLocations();
              onClearArea?.();
            }}
          />

          <DesktopFilterControl
            containerRef={filterRef}
            open={showFilter}
            filterCount={filterCount}
            totalListings={filterResultsCount}
            onToggle={() => {
              setShowFilter((value) => !value);
              setShowSearch(false);
              setShowMenu(false);
            }}
            onDone={() => setShowFilter(false)}
          />

          <ControlPillButton
            data-saved-search-trigger="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              setShowFilter(false);
              setShowSearch(false);
              setShowMenu(false);
              setShowCollections(false);
              setActivePanel(activePanel === 'saved-searches' ? 'none' : 'saved-searches');
            }}
            className={cn('max-w-[190px]', activeSearchId && 'pr-4')}
            active={activeSearchDirty}
            badge={activeSearchDirty ? 1 : null}
            aria-label="Saved searches"
          >
            {activeSearch?.thumbnail ? (
              <span className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-[6px]">
                <Image src={activeSearch.thumbnail} alt="" fill sizes="20px" className="object-cover object-center" />
              </span>
            ) : (
              <Bookmark size={16} className="shrink-0 text-[var(--color-text-primary)]" />
            )}
            <span className="min-w-0 truncate">{activeSearch ? activeSearch.name : 'Searches'}</span>
          </ControlPillButton>
        </div>

        {/* Right nav */}
        <nav className={cn('flex items-center gap-1 flex-shrink-0', (isCollectionsPage || isListingVariant || isMapPage) && 'ml-auto')}>
          {isListingVariant ? (
            <>
              {listingId && (
                <>
                  <ListingSaveButton
                    listingId={listingId}
                    className="bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]"
                  />
                  <ListingNoteButton listingId={listingId} variant="desktop" />
                </>
              )}
              <Button variant="surface" shape="circle" size="md" aria-label="Share listing">
                <Share2 size={15} />
              </Button>
            </>
          ) : isCollectionsPage ? (
            <Button
              onClick={() => router.push('/')}
              size="md"
              className="type-label"
            >
              Map
            </Button>
          ) : isMapPage && onOpenCards ? (
            <Button
              variant="surface"
              size="control"
              onClick={onOpenCards}
              disabled={cardsDisabled}
              className="type-label"
              aria-label="Open cards"
            >
              <GalleryHorizontalEnd size={16} className="shrink-0 text-[var(--color-text-primary)]" />
              Card Mode ✨
            </Button>
          ) : (
            <DesktopCollectionsControl
              open={showCollections}
              onOpenChange={(open) => {
                setShowCollections(open);
                if (open) {
                  setShowFilter(false);
                  setShowSearch(false);
                  setShowMenu(false);
                }
              }}
            />
          )}
          {!isListingVariant && !isMapPage && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => {
                  setShowMenu((value) => !value);
                  setShowFilter(false);
                  setShowSearch(false);
                }}
                className={MENU_TRIGGER_CLASS}
                aria-label="Menu"
              >
                <Menu size={19} />
              </button>
              {showMenu && (
                <DesktopAccountMenu />
              )}
            </div>
          )}
        </nav>
      </header>

    </>
  );
}
