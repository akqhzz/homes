'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import { useSearchStore } from '@/store/searchStore';
import ListingCard from '@/features/listings/components/ListingCard';
import DesktopSortMenu from '@/components/ui/DesktopSortMenu';
import SortOptionsDrawer from '@/components/ui/SortOptionsDrawer';
import MapControlButton from '@/components/ui/MapControlButton';
import { cn } from '@/lib/utils/cn';
import styles from './ListingsSidebar.module.css';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';
import { getListingsAreaTitleLabel } from '@/lib/utils/search-display';
import { useOutsidePointerDown } from '@/hooks/useOutsidePointerDown';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'sqft-desc';
type ListingsListVariant = 'desktop' | 'mobile';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'sqft-desc', label: 'Largest' },
];
const PAGE_SIZE = 24;

interface ListingsListViewProps {
  listings: Listing[];
  useMapAreaLabel?: boolean;
  areaTitleLabel?: string;
  variant?: ListingsListVariant;
  onShowMap?: () => void;
  scrollRestorationKey?: string;
}

export default function ListingsListView({
  listings,
  useMapAreaLabel = false,
  areaTitleLabel,
  variant = 'desktop',
  onShowMap,
  scrollRestorationKey,
}: ListingsListViewProps) {
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const closeDragStartRef = useRef<{ x: number; y: number; id?: number } | null>(null);
  const { setHoveredListingId } = useMapStore();
  const selectedLocations = useSearchStore((s) => s.selectedLocations);
  const router = useRouter();
  const isMobile = variant === 'mobile';
  const listCardImageHeight = isMobile ? 218 : 216;
  const listCardTotalHeight = isMobile ? 296 : 294;

  const sorted = useMemo(() => sortListings(listings, sort), [listings, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleListings = useMemo(() => sorted.slice(pageStart, pageEnd), [pageEnd, pageStart, sorted]);
  const pageButtons = useMemo(() => buildPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const locationLabel =
    useMapAreaLabel
      ? 'Map Area'
      : areaTitleLabel
      ? getListingsAreaTitleLabel(areaTitleLabel)
      : selectedLocations.length === 0
      ? 'Selected Area'
      : selectedLocations.length === 1
      ? getPrimaryLocationLabel(selectedLocations[0].name)
      : `${getPrimaryLocationLabel(selectedLocations[0].name)} + ${selectedLocations.length - 1} more`;
  const title = `${listings.length} Listings In ${locationLabel}`;

  useOutsidePointerDown({
    refs: [sortRef],
    enabled: showSort && !isMobile,
    onOutside: () => setShowSort(false),
  });

  useEffect(() => () => setHoveredListingId(null), [setHoveredListingId]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (!isMobile || !scrollRestorationKey) return;
    const savedScroll = window.sessionStorage.getItem(`${scrollRestorationKey}:scroll`);
    if (!savedScroll) return;
    const frame = requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: Number(savedScroll) || 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [isMobile, scrollRestorationKey, visibleListings.length]);

  const rememberMobileListPosition = () => {
    if (!isMobile || !scrollRestorationKey) return;
    window.sessionStorage.setItem(`${scrollRestorationKey}:view`, 'list');
    window.sessionStorage.setItem(`${scrollRestorationKey}:scroll`, String(scrollContainerRef.current?.scrollTop ?? 0));
  };

  const canStartCloseDrag = () => isMobile && Boolean(onShowMap) && (scrollContainerRef.current?.scrollTop ?? 0) <= 1;

  const closeIfDraggedDown = (dx: number, dy: number) => {
    if (dy > 72 && Math.abs(dy) > Math.abs(dx) * 1.15) onShowMap?.();
  };

  const handleClosePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canStartCloseDrag()) return;
    closeDragStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const handleClosePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = closeDragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    const dy = event.clientY - start.y;
    const dx = event.clientX - start.x;
    if (dy > 8 && Math.abs(dy) > Math.abs(dx)) event.preventDefault();
  };

  const handleClosePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = closeDragStartRef.current;
    closeDragStartRef.current = null;
    if (!start || start.id !== event.pointerId) return;
    closeIfDraggedDown(event.clientX - start.x, event.clientY - start.y);
  };

  const handleCloseTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canStartCloseDrag()) return;
    const touch = event.touches[0];
    closeDragStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCloseTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = closeDragStartRef.current;
    if (!start || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dy = touch.clientY - start.y;
    const dx = touch.clientX - start.x;
    if (dy > 8 && Math.abs(dy) > Math.abs(dx)) event.preventDefault();
  };

  const handleCloseTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = closeDragStartRef.current;
    closeDragStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    closeIfDraggedDown(touch.clientX - start.x, touch.clientY - start.y);
  };

  return (
    <div className={cn('h-full flex flex-col bg-white', isMobile && 'relative')}>
      <div className={cn(
        'flex flex-shrink-0 items-center justify-between',
        isMobile ? 'px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]' : 'px-5 py-1.5'
      )}>
        <p className={cn(
          'text-[var(--color-text-primary)]',
          isMobile ? 'type-heading-sm min-w-0 pr-3' : 'type-subtitle'
        )}>
          {title}
        </p>

        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowSort((value) => !value)}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 type-btn text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowDownWideNarrow size={15} />
            Sort
          </button>
          {!isMobile && showSort && (
            <div className="absolute right-0 top-12 z-20">
              <DesktopSortMenu
                options={SORT_OPTIONS}
                value={sort}
                onChange={(value) => {
                  setSort(value);
                  setPage(1);
                  setShowSort(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onPointerDownCapture={handleClosePointerDown}
        onPointerMoveCapture={handleClosePointerMove}
        onPointerUpCapture={handleClosePointerEnd}
        onPointerCancelCapture={() => { closeDragStartRef.current = null; }}
        onTouchStartCapture={handleCloseTouchStart}
        onTouchMoveCapture={handleCloseTouchMove}
        onTouchEndCapture={handleCloseTouchEnd}
        style={isMobile ? { overscrollBehaviorY: 'contain' } : undefined}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          isMobile
            ? 'px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.25rem)] pt-2'
            : 'px-4 pt-4 pb-1.5'
        )}
      >
        <div className={cn('mx-auto max-w-full', isMobile ? 'w-full' : 'w-fit')}>
          <div className={cn(
            'grid max-w-full justify-items-center',
            isMobile ? 'w-full grid-cols-1 gap-4' : 'w-fit grid-cols-2 gap-4 3xl:grid-cols-3'
          )}>
            {visibleListings.map((listing) => (
              <div
                key={listing.id}
                className={cn(
                  'min-w-0 cursor-pointer rounded-2xl transition-transform hover:-translate-y-0.5',
                  isMobile ? 'w-full max-w-[26rem]' : 'w-[20.5rem]'
                )}
                onMouseEnter={() => setHoveredListingId(listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
                onClick={() => {
                  rememberMobileListPosition();
                  router.push(`/listings/${listing.id}`);
                }}
              >
                <ListingCard
                  listing={listing}
                  variant="carousel"
                  className={isMobile ? 'w-full' : 'w-[20.5rem]'}
                  desktopTall={!isMobile}
                  imageTouchMode={isMobile ? 'vertical-scroll' : 'locked'}
                  contentTouchMode={isMobile ? 'vertical-scroll' : 'locked'}
                  onOpenListing={rememberMobileListPosition}
                  carouselImageHeight={listCardImageHeight}
                  carouselTotalHeight={listCardTotalHeight}
                />
              </div>
            ))}
          </div>
        </div>

        {listings.length === 0 && (
          <div className="py-20 text-center">
            <p className="type-body text-[var(--color-text-tertiary)]">No listings match your filters</p>
          </div>
        )}

        {listings.length > PAGE_SIZE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageButtons={pageButtons}
            onPageChange={setPage}
          />
        )}
      </div>

      {isMobile && onShowMap && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
          <MapControlButton
            onClick={onShowMap}
            className="pointer-events-auto bg-[var(--color-surface-elevated)] transition-all active:scale-95"
          >
            <MapIcon size={16} />
            Map
          </MapControlButton>
        </div>
      )}

      {isMobile && (
        <SortOptionsDrawer
          title="Sort listings"
          open={showSort}
          value={sort}
          options={SORT_OPTIONS}
          onClose={() => setShowSort(false)}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageButtons,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  pageButtons: ReturnType<typeof buildPaginationItems>;
  onPageChange: (page: number | ((page: number) => number)) => void;
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.group}>
        <button
          type="button"
          onClick={() => onPageChange((value) => Math.max(1, value - 1))}
          disabled={currentPage === 1}
          className={styles.arrow}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {pageButtons.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(styles.page, item === currentPage && styles.active)}
              aria-label={`Go to page ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange((value) => Math.min(totalPages, value + 1))}
          disabled={currentPage === totalPages}
          className={styles.arrow}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  return [...listings].sort((a, b) => {
    if (sort === 'newest') return a.daysOnMarket - b.daysOnMarket;
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'sqft-desc') return b.sqft - a.sqft;
    return 0;
  });
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages] as const;
}
