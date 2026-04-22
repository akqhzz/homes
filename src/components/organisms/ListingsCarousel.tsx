'use client';
import { useRef, useLayoutEffect, useCallback } from 'react';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/molecules/ListingCard';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';

const CARD_WIDTH = 288; // matches w-72
const GAP = 12;

interface ListingsCarouselProps {
  listings: Listing[];
  className?: string;
}

export default function ListingsCarousel({ listings, className }: ListingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedListingId = useMapStore((s) => s.selectedListingId);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);

  // Center the selected listing immediately when opened from a pin tap.
  useLayoutEffect(() => {
    if (!selectedListingId || !scrollRef.current) return;
    const idx = listings.findIndex((l) => l.id === selectedListingId);
    if (idx === -1) return;
    const containerW = scrollRef.current.clientWidth;
    const scrollLeft = idx * (CARD_WIDTH + GAP) - (containerW - CARD_WIDTH) / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'auto' });
  }, [selectedListingId, listings]);

  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, clientWidth } = scrollRef.current;
      const center = scrollLeft + clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      listings.forEach((_, i) => {
        const cardCenter = i * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      const listing = listings[closest];
      if (listing && listing.id !== selectedListingId) {
        setSelectedListingId(listing.id);
      }
    }, 45);
  }, [listings, selectedListingId, setSelectedListingId]);

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide pb-1"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          gap: GAP,
          paddingLeft: 'calc(50% - 144px)',
          paddingRight: 'calc(50% - 144px)',
        }}
        onScroll={handleScroll}
      >
        {listings.map((listing) => {
          const isSelected = listing.id === selectedListingId;
          return (
            <div
              key={listing.id}
              style={{ scrollSnapAlign: 'center', flexShrink: 0 }}
            >
              <ListingCard
                listing={listing}
                variant="carousel"
                className={cn(
                  'transition-transform duration-150 ease-out',
                  isSelected ? 'scale-100' : 'scale-[0.985]'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
