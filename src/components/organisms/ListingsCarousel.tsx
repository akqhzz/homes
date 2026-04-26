'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/molecules/ListingCard';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';

const CARD_WIDTH = 320;
const GAP = 20;
const SWIPE_THRESHOLD = 34;

interface ListingsCarouselProps {
  listings: Listing[];
  className?: string;
}

export default function ListingsCarousel({ listings, className }: ListingsCarouselProps) {
  const [viewportWidth, setViewportWidth] = useState(390);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const activeId = useMapStore.getState().mobileCarouselListingId ?? useMapStore.getState().selectedListingId;
    const index = listings.findIndex((listing) => listing.id === activeId);
    return index >= 0 ? index : 0;
  });
  const [instantMove, setInstantMove] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);
  const mobileCarouselListingId = useMapStore((s) => s.mobileCarouselListingId);
  const setMobileCarouselListingId = useMapStore((s) => s.setMobileCarouselListingId);
  const markVisitedListing = useMapStore((s) => s.markVisitedListing);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => node.removeEventListener('touchmove', handleTouchMove);
  }, []);

  useLayoutEffect(() => {
    const activeId = mobileCarouselListingId;
    if (!activeId) return;
    const index = listings.findIndex((listing) => listing.id === activeId);
    if (index >= 0) {
      const frame = requestAnimationFrame(() => {
        setInstantMove(true);
        setCurrentIndex(index);
        requestAnimationFrame(() => setInstantMove(false));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [listings, mobileCarouselListingId]);

  useEffect(() => {
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorX;
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorX = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!mobileCarouselListingId) return;
    markVisitedListing(mobileCarouselListingId);
  }, [markVisitedListing, mobileCarouselListingId]);

  useEffect(() => {
    const centeredListing = listings[currentIndex];
    if (!centeredListing) return;
    setMobileCarouselListingId(centeredListing.id);
  }, [currentIndex, listings, setMobileCarouselListingId]);

  const goTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(listings.length - 1, index));
    setInstantMove(false);
    setCurrentIndex(nextIndex);
    if (listings[nextIndex]) setMobileCarouselListingId(listings[nextIndex].id);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(currentIndex + (dx < 0 ? 1 : -1));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) event.preventDefault();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 18) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    goTo(currentIndex + (event.deltaX > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 320);
  };

  const centeredOffset = Math.max(0, (viewportWidth - CARD_WIDTH) / 2);

  return (
    <div ref={carouselRef} className={cn('w-full overflow-hidden py-3', className)} style={{ touchAction: 'none' }}>
      <motion.div
        className="flex"
        animate={{ x: centeredOffset - currentIndex * (CARD_WIDTH + GAP) }}
        transition={instantMove ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 34, mass: 0.34 }}
        style={{ gap: GAP, touchAction: 'none', willChange: 'transform' }}
        onPointerDownCapture={handlePointerDown}
        onPointerUpCapture={handlePointerUp}
        onPointerCancelCapture={() => { dragStartRef.current = null; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="shrink-0">
            <ListingCard listing={listing} variant="carousel" carouselWidth={CARD_WIDTH} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
