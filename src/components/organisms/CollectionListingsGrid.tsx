'use client';
import Link from 'next/link';
import { Listing } from '@/lib/types';
import CollectionListingCard from '@/components/molecules/CollectionListingCard';
import { cn } from '@/lib/utils/cn';

type CollectionListingItem = Listing & {
  collectionData: {
    notes?: string;
    tags: string[];
  };
};

interface CollectionListingsGridProps {
  listings: CollectionListingItem[];
  currentCollectionId: string;
  cardTall?: boolean;
  onTagClick: (listingId: string, anchorRect: DOMRect | null) => void;
  pendingRemovalIds?: string[];
  onToggleListingLike: (listingId: string) => void;
  onSavedListing: (listingId: string, collectionId: string) => void;
}

export default function CollectionListingsGrid({
  listings,
  currentCollectionId,
  cardTall = false,
  onTagClick,
  pendingRemovalIds = [],
  onToggleListingLike,
  onSavedListing,
}: CollectionListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-20 text-center">
        <EmptyCollectionIllustration />
        <p className="type-label text-[#0F1729]">Empty collection</p>
        <p className="mt-1 type-body text-[#9CA3AF]">
          Save listings from the map to add them here
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-4 type-btn text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Go to Map
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid w-full grid-cols-1 gap-4 sm:grid-cols-2',
        'lg:mx-auto lg:w-max lg:max-w-full lg:grid-cols-2 lg:justify-items-center lg:gap-4 3xl:grid-cols-3'
      )}
    >
      {listings.map((listing) => (
        <CollectionListingCard
          key={listing.id}
          listing={listing}
          notes={listing.collectionData.notes}
          tags={listing.collectionData.tags}
          tall={cardTall}
          currentCollectionId={currentCollectionId}
          onTagClick={(anchorRect) => onTagClick(listing.id, anchorRect)}
          pendingRemoval={pendingRemovalIds.includes(listing.id)}
          onToggleLike={() => onToggleListingLike(listing.id)}
          onSavedToCollection={(collectionId) => onSavedListing(listing.id, collectionId)}
        />
      ))}
    </div>
  );
}

export function EmptyCollectionIllustration({ className }: { className?: string }) {
  return <div className={cn('mb-4 text-5xl', className)}>📂</div>;
}
