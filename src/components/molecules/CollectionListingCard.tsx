'use client';
import { Tag } from 'lucide-react';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/molecules/ListingCard';

interface CollectionListingCardProps {
  listing: Listing;
  notes?: string;
  tags: string[];
  tall?: boolean;
  onTagClick: (anchorRect: DOMRect | null) => void;
  onRemove: () => void;
}

export default function CollectionListingCard({
  listing,
  notes,
  tags,
  tall = false,
  onTagClick,
  onRemove,
}: CollectionListingCardProps) {
  const hasTags = tags.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <ListingCard
        listing={listing}
        variant="carousel"
        className="w-full lg:w-80"
        imageTouchMode="vertical-scroll"
        contentTouchMode="vertical-scroll"
        desktopTall={tall}
        likedOverride
        onLikeToggle={() => onRemove()}
        topRightSlot={(
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTagClick(event.currentTarget.getBoundingClientRect());
            }}
            className={[
              'relative flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-[#0F1729] shadow-[0_1px_4px_rgba(0,0,0,0.10)] transition-colors',
              hasTags
                ? 'bg-white/95 text-[#0F1729] shadow-[inset_0_0_0_1px_rgba(15,23,41,0.16),0_2px_8px_rgba(0,0,0,0.10)]'
                : 'bg-white/85',
            ].join(' ')}
            aria-label="Manage tags"
          >
            <Tag size={14} />
            {hasTags && <span className="type-nano text-[#374151]">{tags.length}</span>}
          </button>
        )}
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
