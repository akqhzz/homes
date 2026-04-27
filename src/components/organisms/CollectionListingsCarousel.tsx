'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '@/store/mapStore';
import { Listing } from '@/lib/types';
import CollectionListingCard from '@/components/molecules/CollectionListingCard';
import { cn } from '@/lib/utils/cn';
import { getWindowRange } from '@/lib/utils/windowing';

const CARD_WIDTH = 320;
const GAP = 20;
const SWIPE_THRESHOLD = 34;
const TRACK_HEIGHT = 292;

type CollectionListingItem = Listing & {
  collectionData: {
    notes?: string;
    tags: string[];
  };
};

interface CollectionListingsCarouselProps {
  listings: CollectionListingItem[];
  currentCollectionId: string;
  pendingRemovalIds?: string[];
  onToggleListingLike: (listingId: string) => void;
  onSavedListing: (listingId: string, collectionId: string) => void;
  onTagClick: (listingId: string, anchorRect: DOMRect | null) => void;
  className?: string;
}

export default function CollectionListingsCarousel({
  listings,
  currentCollectionId,
  pendingRemovalIds = [],
  onToggleListingLike,
  onSavedListing,
  onTagClick,
  className,
}: CollectionListingsCarouselProps) {
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
  const syncingExternalSelectionRef = useRef(false);
  const mobileCarouselListingId = useMapStore((s) => s.mobileCarouselListingId);
  const mobileCarouselSelectionSource = useMapStore((s) => s.mobileCarouselSelectionSource);
  const mobileCarouselSelectionVersion = useMapStore((s) => s.mobileCarouselSelectionVersion);
  const setMobileCarouselListingId = useMapStore((s) => s.setMobileCarouselListingId);
  const markVisitedListing = useMapStore((s) => s.markVisitedListing);
  const activeIndex = Math.max(0, Math.min(currentIndex, listings.length - 1));

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
    if (mobileCarouselSelectionSource !== 'marker') return;
    const activeId = mobileCarouselListingId;
    if (!activeId) return;
    const index = listings.findIndex((listing) => listing.id === activeId);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      syncingExternalSelectionRef.current = true;
      setInstantMove(true);
      setCurrentIndex(index);
    });
    return () => cancelAnimationFrame(frame);
  }, [listings, mobileCarouselListingId, mobileCarouselSelectionSource, mobileCarouselSelectionVersion]);

  useEffect(() => {
    if (!instantMove || !syncingExternalSelectionRef.current) return;
    const frame = requestAnimationFrame(() => {
      syncingExternalSelectionRef.current = false;
      setInstantMove(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentIndex, instantMove]);

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
    if (mobileCarouselSelectionSource === 'marker') return;
    if (syncingExternalSelectionRef.current) return;
    const centeredListing = listings[activeIndex];
    if (!centeredListing) return;
    setMobileCarouselListingId(centeredListing.id, 'carousel');
  }, [activeIndex, listings, mobileCarouselSelectionSource, setMobileCarouselListingId]);

  const goTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(listings.length - 1, index));
    setInstantMove(false);
    setCurrentIndex(nextIndex);
    if (listings[nextIndex]) setMobileCarouselListingId(listings[nextIndex].id, 'carousel');
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
  const { start: windowStart, end: windowEnd } = useMemo(
    () => getWindowRange(activeIndex, listings.length),
    [activeIndex, listings.length]
  );
  const visibleListings = listings.slice(windowStart, windowEnd);
  const trackWidth = Math.max(0, listings.length * CARD_WIDTH + Math.max(0, listings.length - 1) * GAP);

  return (
    <div ref={carouselRef} className={cn('w-full overflow-hidden pt-3 pb-5', className)} style={{ touchAction: 'none' }}>
      <motion.div
        className="relative"
        animate={{ x: centeredOffset - activeIndex * (CARD_WIDTH + GAP) }}
        transition={instantMove ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 34, mass: 0.34 }}
        style={{ width: trackWidth, height: TRACK_HEIGHT, touchAction: 'none', willChange: 'transform' }}
        onPointerDownCapture={handlePointerDown}
        onPointerUpCapture={handlePointerUp}
        onPointerCancelCapture={() => { dragStartRef.current = null; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
      >
        {visibleListings.map((listing, offset) => {
          const index = windowStart + offset;
          return (
          <div
            key={listing.id}
            className="absolute top-0"
            style={{ left: index * (CARD_WIDTH + GAP), width: CARD_WIDTH }}
          >
            <CollectionListingCard
              listing={listing}
              notes={listing.collectionData.notes}
              tags={listing.collectionData.tags}
              currentCollectionId={currentCollectionId}
              pendingRemoval={pendingRemovalIds.includes(listing.id)}
              onToggleLike={() => onToggleListingLike(listing.id)}
              onSavedToCollection={(collectionId) => onSavedListing(listing.id, collectionId)}
              onTagClick={(anchorRect) => onTagClick(listing.id, anchorRect)}
            />
          </div>
          );
        })}
      </motion.div>
    </div>
  );
}
