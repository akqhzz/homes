'use client';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/molecules/ListingCard';

interface CollectionListingCardProps {
  listing: Listing;
  notes?: string;
  tags: string[];
  tall?: boolean;
}

export default function CollectionListingCard({
  listing,
  notes,
  tags,
  tall = false,
}: CollectionListingCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <ListingCard
        listing={listing}
        variant="carousel"
        className="w-full"
        imageTouchMode="vertical-scroll"
        contentTouchMode="vertical-scroll"
        desktopTall={tall}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-0.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="type-micro rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[#6B7280]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {notes && (
        <p className="type-caption line-clamp-2 px-0.5 text-[#9CA3AF]">{notes}</p>
      )}
    </div>
  );
}
