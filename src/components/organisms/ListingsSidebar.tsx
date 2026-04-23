'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownWideNarrow, Check } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import ListingCard from '@/components/molecules/ListingCard';
import { cn } from '@/lib/utils/cn';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'sqft-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'sqft-desc', label: 'Largest' },
];

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
}

export default function ListingsSidebar({ listings }: ListingsSidebarProps) {
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const { setHoveredListingId } = useMapStore();
  const router = useRouter();

  const sorted = sortListings(listings, sort);

  useEffect(() => {
    if (!showSort) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setShowSort(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showSort]);

  useEffect(() => () => setHoveredListingId(null), [setHoveredListingId]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-1.5">
        <p className="font-heading text-lg text-[#0F1729]">
          {listings.length} <span className="text-[#9CA3AF] font-normal">listings</span>
        </p>

        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSort((value) => !value)}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
          >
            <ArrowDownWideNarrow size={15} />
            Sort
          </button>
          {showSort && (
            <div className="absolute right-0 top-12 z-20 w-52 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
              {SORT_OPTIONS.map(({ value, label }) => {
                const selected = sort === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSort(value);
                      setShowSort(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors',
                      selected ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]'
                    )}
                  >
                    {label}
                    {selected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Listings grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-1.5">
        <div className="mx-auto grid w-max grid-cols-2 justify-items-center gap-4 3xl:grid-cols-3">
          {sorted.map((listing) => (
            <div
              key={listing.id}
              className={cn('w-80 min-w-0 rounded-2xl transition-transform cursor-pointer hover:-translate-y-0.5')}
              onMouseEnter={() => setHoveredListingId(listing.id)}
              onMouseLeave={() => setHoveredListingId(null)}
              onClick={() => router.push(`/listings/${listing.id}`)}
            >
              <ListingCard listing={listing} variant="carousel" className="w-80" desktopTall />
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#9CA3AF] text-sm">No listings match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
