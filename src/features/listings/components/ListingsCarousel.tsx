'use client';
import { motion } from 'framer-motion';
import { Listing } from '@/lib/types';
import ListingCard from '@/features/listings/components/ListingCard';
import { cn } from '@/lib/utils/cn';
import { useMobileListingsCarousel } from '@/hooks/useMobileListingsCarousel';

const CARD_WIDTH = 320;
const GAP = 20;
const SWIPE_THRESHOLD = 34;
const TRACK_HEIGHT = 268;

interface ListingsCarouselProps {
  listings: Listing[];
  className?: string;
}

export default function ListingsCarousel({ listings, className }: ListingsCarouselProps) {
  const { activeIndex, carouselRef, centeredOffset, handlers, instantMove, trackWidth, visibleItems, windowStart } =
    useMobileListingsCarousel({
      items: listings,
      cardWidth: CARD_WIDTH,
      gap: GAP,
      swipeThreshold: SWIPE_THRESHOLD,
    });

  return (
    <div ref={carouselRef} className={cn('w-full overflow-hidden pt-3 pb-5', className)} style={{ touchAction: 'none' }}>
      <motion.div
        className="relative"
        animate={{ x: centeredOffset - activeIndex * (CARD_WIDTH + GAP) }}
        transition={instantMove ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 34, mass: 0.34 }}
        style={{ width: trackWidth, height: TRACK_HEIGHT, touchAction: 'none', willChange: 'transform' }}
        {...handlers}
      >
        {visibleItems.map((listing, offset) => {
          const index = windowStart + offset;
          return (
          <div
            key={listing.id}
            className="absolute top-0"
            style={{ left: index * (CARD_WIDTH + GAP) }}
          >
            <ListingCard listing={listing} variant="carousel" carouselWidth={CARD_WIDTH} />
          </div>
          );
        })}
      </motion.div>
    </div>
  );
}
