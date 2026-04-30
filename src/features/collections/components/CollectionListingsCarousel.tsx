'use client';
import { motion } from 'framer-motion';
import { Listing } from '@/lib/types';
import CollectionListingCard from '@/features/collections/components/CollectionListingCard';
import { cn } from '@/lib/utils/cn';
import { useMobileListingsCarousel } from '@/hooks/useMobileListingsCarousel';

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
