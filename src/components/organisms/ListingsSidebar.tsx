'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import { useSearchStore } from '@/store/searchStore';
import ListingCard from '@/components/molecules/ListingCard';
import DesktopSortMenu from '@/components/molecules/DesktopSortMenu';
import { cn } from '@/lib/utils/cn';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';
import { getListingsAreaTitleLabel } from '@/lib/utils/search-display';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'sqft-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'sqft-desc', label: 'Largest' },
];
const PAGE_SIZE = 24;

function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  return [...listings].sort((a, b) => {
    if (sort === 'newest') return a.daysOnMarket - b.daysOnMarket;
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'sqft-desc') return b.sqft - a.sqft;
    return 0;
  });
}

interface ListingsSidebarProps {
  listings: Listing[];
  useMapAreaLabel?: boolean;
  areaTitleLabel?: string;
}

export default function ListingsSidebar({ listings, useMapAreaLabel = false, areaTitleLabel }: ListingsSidebarProps) {
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { setHoveredListingId } = useMapStore();
  const selectedLocations = useSearchStore((s) => s.selectedLocations);
  const router = useRouter();

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

  useEffect(() => {
    if (!showSort) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setShowSort(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showSort]);

  useEffect(() => () => setHoveredListingId(null), [setHoveredListingId]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-1.5">
        <p className="type-subtitle text-[#0F1729]">
          {listings.length} Listings In {locationLabel}
        </p>

        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSort((value) => !value)}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 type-btn text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
          >
            <ArrowDownWideNarrow size={15} />
            Sort
          </button>
          {showSort && (
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

      {/* Listings grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-1.5">
        <div className="mx-auto w-fit max-w-full">
          <div className="grid w-fit max-w-full grid-cols-2 justify-items-center gap-4 3xl:grid-cols-3">
          {visibleListings.map((listing) => (
            <div
              key={listing.id}
              className={cn('w-[20.5rem] min-w-0 rounded-2xl transition-transform cursor-pointer hover:-translate-y-0.5')}
              onMouseEnter={() => setHoveredListingId(listing.id)}
              onMouseLeave={() => setHoveredListingId(null)}
              onClick={() => router.push(`/listings/${listing.id}`)}
            >
              <ListingCard listing={listing} variant="carousel" className="w-[20.5rem]" desktopTall />
            </div>
          ))}
          </div>
        </div>

        {listings.length === 0 && (
          <div className="text-center py-20">
            <p className="type-body text-[#9CA3AF]">No listings match your filters</p>
          </div>
        )}

        {listings.length > PAGE_SIZE && (
          <div className="pagination-shell">
            <div className="pagination-group">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="pagination-arrow"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              {pageButtons.map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn('pagination-page', item === currentPage && 'is-active')}
                    aria-label={`Go to page ${item}`}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="pagination-arrow"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
