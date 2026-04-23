'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownWideNarrow, Check } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
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
  const { openListingDetail } = useUIStore();

  const sorted = sortListings(listings, sort);

  useEffect(() => {
    if (!showSort) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setShowSort(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showSort]);

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#F0F0F0]">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
        <p className="font-bold text-[#0F1729]">
          {listings.length} <span className="text-[#9CA3AF] font-normal">listings</span>
        </p>

        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSort((value) => !value)}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
          >
            <ArrowDownWideNarrow size={16} />
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
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 justify-items-center gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {sorted.map((listing) => (
            <div
              key={listing.id}
              className={cn('w-72 min-w-0 rounded-2xl transition-transform cursor-pointer hover:-translate-y-0.5')}
              onMouseEnter={() => setHoveredListingId(listing.id)}
              onMouseLeave={() => setHoveredListingId(null)}
              onClick={() => openListingDetail(listing.id)}
            >
              <ListingCard listing={listing} variant="carousel" />
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
