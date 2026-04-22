'use client';
import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Listing } from '@/lib/types';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import ListingCard from '@/components/molecules/ListingCard';
import { cn } from '@/lib/utils/cn';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'sqft-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
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
  const { selectedListingId, setSelectedListingId } = useMapStore();
  const { openListingDetail } = useUIStore();

  const sorted = sortListings(listings, sort);

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#F0F0F0]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between flex-shrink-0">
        <p className="font-bold text-[#0F1729]">
          {listings.length} <span className="text-[#9CA3AF] font-normal">listings</span>
        </p>

        {/* Sort */}
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                sort === value
                  ? 'bg-[#0F1729] text-white'
                  : 'text-[#9CA3AF] hover:text-[#0F1729]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((listing) => (
            <div
              key={listing.id}
              className={cn(
                'rounded-2xl transition-all cursor-pointer',
                selectedListingId === listing.id && 'ring-2 ring-[#0F1729] ring-offset-2'
              )}
              onMouseEnter={() => setSelectedListingId(listing.id)}
              onMouseLeave={() => setSelectedListingId(null)}
              onClick={() => openListingDetail(listing.id)}
            >
              <ListingCard listing={listing} variant="grid" />
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
