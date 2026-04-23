'use client';
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
  cardTall?: boolean;
}

export default function CollectionListingsGrid({
  listings,
  cardTall = false,
}: CollectionListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-5xl">📂</div>
        <p className="type-label text-[#0F1729]">Empty collection</p>
        <p className="mt-1 type-body text-[#9CA3AF]">
          Save listings from the map to add them here
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5',
        'lg:grid-cols-[repeat(auto-fill,minmax(18rem,18rem))] lg:justify-start'
      )}
    >
      {listings.map((listing) => (
        <CollectionListingCard
          key={listing.id}
          listing={listing}
          notes={listing.collectionData.notes}
          tags={listing.collectionData.tags}
          tall={cardTall}
        />
      ))}
    </div>
  );
}
