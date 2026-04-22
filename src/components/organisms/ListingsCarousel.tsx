'use client';
import { useRef, useLayoutEffect, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const frameRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ left: 0, width: 0 });
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
    setScrollMetrics({ left: Math.max(0, scrollLeft), width: containerW });
  }, [selectedListingId, listings]);

  useEffect(() => {
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorX;
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorX = previousBodyOverscroll;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const syncSelectedToCenter = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setScrollMetrics({ left: scrollLeft, width: clientWidth });
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
  }, [listings, selectedListingId, setSelectedListingId]);

  const handleScroll = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(syncSelectedToCenter);
  }, [syncSelectedToCenter]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      event.preventDefault();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide py-3"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          gap: GAP,
          paddingLeft: 'calc(50% - 144px)',
          paddingRight: 'calc(50% - 144px)',
        }}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {listings.map((listing, index) => {
          const center = scrollMetrics.left + (scrollMetrics.width || CARD_WIDTH) / 2;
          const cardCenter = index * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
          const distance = Math.min(1, Math.abs(center - cardCenter) / (CARD_WIDTH + GAP));
          const scale = 1.02 - distance * 0.12;
          const opacity = 1 - distance * 0.28;
          return (
            <motion.div
              key={listing.id}
              style={{ scrollSnapAlign: 'center', flexShrink: 0 }}
              animate={{ scale, opacity }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <ListingCard
                listing={listing}
                variant="carousel"
                className="will-change-transform"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
