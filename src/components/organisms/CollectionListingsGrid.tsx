'use client';
import { Listing } from '@/lib/types';
import CollectionListingCard from '@/components/molecules/CollectionListingCard';

type CollectionListingItem = Listing & {
  collectionData: {
    notes?: string;
    tags: string[];
  };
};

interface CollectionListingsGridProps {
  listings: CollectionListingItem[];
}

export default function CollectionListingsGrid({
  listings,
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
    <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:w-max lg:grid-cols-[repeat(auto-fit,18rem)] lg:justify-center lg:gap-5">
      {listings.map((listing) => (
        <CollectionListingCard
          key={listing.id}
          listing={listing}
          notes={listing.collectionData.notes}
          tags={listing.collectionData.tags}
        />
      ))}
    </div>
  );
}
