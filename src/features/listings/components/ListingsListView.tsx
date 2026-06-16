'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownWideNarrow, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Grid2X2, List, Map as MapIcon } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import { useSearchStore } from '@/store/searchStore';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import ListingCard from '@/features/listings/components/ListingCard';
import ListingsFooter, { PlaceholderLink } from '@/features/listings/components/ListingsFooter';
import DesktopListingRow from '@/features/listings/components/DesktopListingRow';
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
const PAGE_SIZE = 36;
const NEARBY_CITIES = ['Windsor', 'Toronto', 'North York', 'Mississauga', 'Brampton', 'London', 'Ottawa', 'Hamilton', 'Chatham', 'Etobicoke'];
const ONTARIO_CITIES = [
  'Ajax', 'Alliston', 'Amherstburg', 'Ancaster', 'Angus', 'Arnprior', 'Aurora', 'Aylmer', 'Bancroft', 'Barrie', 'Belle River', 'Belleville',
  'Binbrook', 'Blenheim', 'Blind River', 'Blue Mountains', 'Bolton', 'Bowmanville', 'Bracebridge', 'Bradford', 'Brampton', 'Brantford',
  'Brechin', 'Espanola', 'Essex', 'Etobicoke', 'Fenelon Falls', 'Fergus', 'Fonthill', 'Fort Erie', 'Fort Frances', 'Gananoque', 'Garson',
  'Georgetown', 'Georgian Bluffs', 'Gloucester', 'Goderich', 'Grand Bend', 'Gravenhurst', 'Grimsby', 'Guelph', 'Haliburton', 'Hamilton',
  'Hanmer', 'Hanover', 'Harrow', 'Markham', 'Marmora', 'Mcgregor', 'Meaford', 'Midland', 'Milton', 'Minden', 'Mississauga', 'Mono',
  'Mount Forest', 'Napanee', 'Nepean', 'Newcastle', 'Newmarket', 'Niagara Falls', 'Niagara on the Lake', 'North Bay', 'North York',
  'Northern Bruce Peninsula', 'Oakville', 'Orangeville', 'Orillia', 'Orleans', 'Saint Thomas', 'Sarnia', 'Sault Ste Marie',
  'Sault Ste. Marie', 'Scarborough', 'Severn', 'Shelburne', 'Simcoe', 'Smiths Falls', 'South Bruce Peninsula', 'Southampton',
  'St Catharines', 'St Thomas', 'Stevensville', 'Stittsville', 'Stoney Creek', 'Stouffville', 'Stratford', 'Sudbury', 'Sutton West',
  'Tecumseh', 'Thamesville', 'Thornbury'
];

interface ListingsListViewProps {
  listings: Listing[];
  useMapAreaLabel?: boolean;
  areaTitleLabel?: string;
  variant?: ListingsListVariant;
  onShowMap?: () => void;
  scrollRestorationKey?: string;
  onDesktopViewChange?: (view: 'grid' | 'rows') => void;
  desktopMapExpanded?: boolean;
}

export default function ListingsListView({
  listings,
  areaTitleLabel,
  variant = 'desktop',
  onShowMap,
  scrollRestorationKey,
  onDesktopViewChange,
  desktopMapExpanded = false,
}: ListingsListViewProps) {
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const [desktopView, setDesktopView] = useState<'grid' | 'rows'>(() => {
    if (typeof window === 'undefined' || !scrollRestorationKey) return 'grid';
    const savedView = window.sessionStorage.getItem(`${scrollRestorationKey}:view`);
    return savedView === 'grid' || savedView === 'rows' ? savedView : 'grid';
  });
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
  const selectedLocationLabel =
    selectedLocations.length === 0
      ? null
      : selectedLocations.length === 1
      ? getPrimaryLocationLabel(selectedLocations[0].name)
      : `${getPrimaryLocationLabel(selectedLocations[0].name)}, +${selectedLocations.length - 1}`;
  const areaLocationLabel = areaTitleLabel ? getListingsAreaTitleLabel(areaTitleLabel) : null;
  const titleLocationLabel = selectedLocationLabel ?? areaLocationLabel;
  const scopeLabel = titleLocationLabel ?? 'Map Area';
  const title = `${titleLocationLabel ?? 'Toronto'} Real Estate & Homes For Sale`;
  const listingCountLabel = `${listings.length.toLocaleString()} Listings in Map Area`;
  const latestListingLabels = useMemo(() => getLatestListingLabels(listings, scopeLabel), [listings, scopeLabel]);
  const breadcrumbLocation = scopeLabel === 'Selected Area' || scopeLabel === 'Map Area' ? 'Toronto' : scopeLabel;

  useOutsidePointerDown({
    refs: [sortRef],
    enabled: showSort && !isMobile,
    onOutside: () => setShowSort(false),
  });

  useEffect(() => () => setHoveredListingId(null), [setHoveredListingId]);

  useEffect(() => {
    if (isMobile) return;
    onDesktopViewChange?.(desktopView);
  }, [desktopView, isMobile, onDesktopViewChange]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (!scrollRestorationKey) return;
    const savedScroll = window.sessionStorage.getItem(`${scrollRestorationKey}:scroll`);
    if (!savedScroll) return;
    const frame = requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: Number(savedScroll) || 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRestorationKey, visibleListings.length]);

  useEffect(() => {
    if (isMobile || !scrollRestorationKey) return;
    window.sessionStorage.setItem(`${scrollRestorationKey}:view`, desktopView);
  }, [desktopView, isMobile, scrollRestorationKey]);

  useEffect(() => {
    if (isMobile || !scrollRestorationKey || desktopMapExpanded) return;
    const savedScroll = window.sessionStorage.getItem(`${scrollRestorationKey}:scroll`);
    if (!savedScroll) return;
    const frame = requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: Number(savedScroll) || 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [desktopMapExpanded, isMobile, scrollRestorationKey]);

  const rememberListPosition = () => {
    if (!scrollRestorationKey) return;
    window.sessionStorage.setItem(`${scrollRestorationKey}:view`, isMobile ? 'list' : desktopView);
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
      {!isMobile && (
        <div className="flex flex-shrink-0 items-center justify-between px-5 py-1.5">
          <div className="min-w-0 pr-3">
            <p className="type-subtitle normal-case text-[var(--color-text-primary)]">
              {title}
            </p>
            <p className="mt-0.5 type-body text-[var(--color-text-secondary)]">{listingCountLabel}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSort((value) => !value)}
                className="flex h-8 items-center gap-1.5 rounded-full px-2.5 type-btn text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <ArrowDownWideNarrow size={15} />
                Sort
              </button>
              {showSort && (
                <div className="absolute right-0 top-12 z-50">
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
            <div className="flex rounded-full bg-[var(--color-surface)] p-1">
              <button
                type="button"
                onClick={() => setDesktopView('grid')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  desktopView === 'grid'
                    ? 'bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                )}
                aria-label="Grid view"
                aria-pressed={desktopView === 'grid'}
              >
                <Grid2X2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDesktopView('rows')}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  desktopView === 'rows'
                    ? 'bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                )}
                aria-label="List view"
                aria-pressed={desktopView === 'rows'}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

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
        {isMobile && (
          <div className="flex items-center justify-between px-1 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
            <div className="min-w-0 pr-3">
              <p className="type-heading-sm normal-case text-[var(--color-text-primary)]">{title}</p>
              <p className="mt-0.5 type-body text-[var(--color-text-secondary)]">{listingCountLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSort((value) => !value)}
                className="flex h-8 items-center gap-1.5 rounded-full px-2.5 type-btn text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              >
                <ArrowDownWideNarrow size={15} />
                Sort
              </button>
            </div>
          </div>
        )}

        {!isMobile && desktopView === 'rows' ? (
          <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
            {visibleListings.map((listing) => (
              <DesktopListingRow
                key={listing.id}
                listing={listing}
                onHoverStart={() => setHoveredListingId(listing.id)}
                onHoverEnd={() => setHoveredListingId(null)}
                onOpenListing={() => {
                  rememberListPosition();
                  router.push(`/listings/${listing.id}`);
                }}
              />
            ))}
          </div>
        ) : (
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
                    rememberListPosition();
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
                    onOpenListing={rememberListPosition}
                    carouselImageHeight={listCardImageHeight}
                    carouselTotalHeight={listCardTotalHeight}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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

        <ListingsBreadcrumb locationLabel={breadcrumbLocation} />

        <ListingsSeoInformation
          latestListings={latestListingLabels}
        />

        <ListingsFooter />
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

function ListingsBreadcrumb({ locationLabel }: { locationLabel: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto mt-5 flex w-full max-w-[1360px] items-center justify-center gap-1.5 text-[var(--color-text-primary)]">
      {['CA', 'ON', locationLabel].map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-1.5">
          <PlaceholderLink className={cn(index === 2 ? 'type-caption font-semibold' : 'type-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]')}>
            {item}
          </PlaceholderLink>
          {index < 2 && <ChevronRight size={14} strokeWidth={2.4} className="text-[var(--color-text-primary)]" />}
        </span>
      ))}
    </nav>
  );
}

function ListingsSeoInformation({
  latestListings,
}: {
  latestListings: string[];
}) {
  const [isTorontoOpen, setIsTorontoOpen] = useState(false);
  const [isOntarioOpen, setIsOntarioOpen] = useState(false);
  const locationLabel = 'Toronto';
  const neighborhoodNames = MOCK_NEIGHBORHOODS.map((neighborhood) => neighborhood.name).slice(0, 10);
  const seoGroups = [
    { title: `${locationLabel} Latest Listings`, items: latestListings },
    {
      title: `${locationLabel} Property Types`,
      items: [
        `Houses for Sale ${locationLabel}`,
        `Condos for Sale ${locationLabel}`,
        `Townhouses for Sale ${locationLabel}`,
        `For Rent near ${locationLabel}`,
      ],
    },
    { title: `${locationLabel} Neighbourhoods`, items: neighborhoodNames },
    { title: 'Popular Nearby Cities', items: NEARBY_CITIES.map((city) => `${city} Homes for Sale`) },
  ];
  const nearbyGroups = [
    { title: `Houses for Sale near ${locationLabel}`, items: NEARBY_CITIES.map((city) => `${city} Houses for Sale`) },
    { title: `Condos for Sale near ${locationLabel}`, items: NEARBY_CITIES.map((city) => `${city} Condos For Sale`) },
    { title: `For Rent near ${locationLabel}`, items: NEARBY_CITIES.map((city) => `${city} Houses for Rent`) },
    { title: `Recently sold near ${locationLabel}`, items: NEARBY_CITIES.map((city) => `Recently Sold Homes in ${city}`) },
  ];

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)');
    const syncOpenState = () => {
      setIsTorontoOpen(query.matches);
      setIsOntarioOpen(query.matches);
    };
    syncOpenState();
    query.addEventListener('change', syncOpenState);
    return () => query.removeEventListener('change', syncOpenState);
  }, []);

  return (
    <section className="mx-auto mt-8 w-full max-w-[1360px] space-y-4 text-[var(--color-text-primary)]">
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] px-4 py-6 sm:px-6 sm:py-7">
        <button
          type="button"
          onClick={() => setIsTorontoOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={isTorontoOpen}
        >
          <span className="type-heading-sm text-[var(--color-text-primary)]">Browse Real Estate Listings in Toronto</span>
          {isTorontoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isTorontoOpen && (
          <div className="mt-7">
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-8 2xl:grid-cols-4">
              {seoGroups.map((group) => (
                <SeoLinkGroup key={group.title} title={group.title} items={group.items} />
              ))}
            </div>
            <div className="mt-8">
              <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-8 2xl:grid-cols-4">
                {nearbyGroups.map((group) => (
                  <SeoLinkGroup key={group.title} title={group.title} items={group.items} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] px-4 py-6 sm:px-6 sm:py-7">
        <button
          type="button"
          onClick={() => setIsOntarioOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={isOntarioOpen}
        >
          <span className="type-heading-sm text-[var(--color-text-primary)]">Browse Real Estate Listings In Ontario</span>
          {isOntarioOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isOntarioOpen && (
          <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:gap-x-8 xl:grid-cols-3 2xl:grid-cols-4">
            {ONTARIO_CITIES.map((city) => (
              <li key={city} className="min-w-0">
                <PlaceholderLink className="block truncate type-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">{city} Homes for Sale</PlaceholderLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SeoLinkGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="min-w-0">
      <h2 className="type-body text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 450, lineHeight: 1.25 }}>{title}</h2>
      <ul className="mt-3.5 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="min-w-0">
            <PlaceholderLink className="block truncate type-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">{item}</PlaceholderLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getLatestListingLabels(listings: Listing[], fallbackLocation: string) {
  const latestListings = [...listings]
    .sort((a, b) => a.daysOnMarket - b.daysOnMarket)
    .slice(0, 10)
    .map((listing) => listing.address.split(',')[0]?.trim())
    .filter(Boolean);

  if (latestListings.length > 0) return latestListings;
  return [`${fallbackLocation} Homes for Sale`];
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
