'use client';
import { useRef, useLayoutEffect, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, type MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/molecules/ListingCard';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';

const CARD_WIDTH = 288; // matches w-72
const GAP = 12;
const smoothstep = (value: number) => value * value * (3 - 2 * value);

interface ListingsCarouselProps {
  listings: Listing[];
  className?: string;
}

export default function ListingsCarousel({ listings, className }: ListingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ left: 0, width: 0 });
  const scrollX = useMotionValue(0);
  const smoothScrollX = useSpring(scrollX, { stiffness: 180, damping: 32, mass: 0.22 });
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
    scrollX.set(Math.max(0, scrollLeft));
  }, [selectedListingId, listings, scrollX]);

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
    scrollX.set(scrollLeft);
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
  }, [listings, selectedListingId, setSelectedListingId, scrollX]);

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

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 4) {
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
          touchAction: 'pan-x pan-y',
          gap: GAP,
          paddingLeft: 'calc(50% - 144px)',
          paddingRight: 'calc(50% - 144px)',
        }}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
      >
        {listings.map((listing, index) => {
          return (
            <CarouselCardShell
              key={listing.id}
              index={index}
              scrollX={smoothScrollX}
              viewportWidth={scrollMetrics.width || CARD_WIDTH}
            >
              <ListingCard
                listing={listing}
                variant="carousel"
                className="will-change-transform"
              />
            </CarouselCardShell>
          );
        })}
      </div>
    </div>
  );
}

function CarouselCardShell({
  index,
  scrollX,
  viewportWidth,
  children,
}: {
  index: number;
  scrollX: MotionValue<number>;
  viewportWidth: number;
  children: ReactNode;
}) {
  const scale = useTransform(scrollX, (left) => {
    const center = left + viewportWidth / 2;
    const cardCenter = index * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
    const distance = Math.min(1, Math.abs(center - cardCenter) / (CARD_WIDTH + GAP));
    const focus = smoothstep(1 - distance);
    return 0.92 + focus * 0.08;
  });

  return (
    <motion.div
      style={{
        scrollSnapAlign: 'center',
        flexShrink: 0,
        scale,
        willChange: 'transform',
      }}
    >
      {children}
    </motion.div>
  );
}
