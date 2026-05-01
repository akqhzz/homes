'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { formatDaysOnMarket } from '@/lib/utils/format';
import { formatBedBathSqftLine, formatMlsLine } from '@/lib/utils/listing-display';
import ListingSaveButton from '@/features/listings/components/ListingSaveButton';
import PriceText from '@/features/listings/components/PriceText';
import Button from '@/components/ui/Button';

const ROW_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
];
const ROW_IMAGE_COUNT = 7;

interface DesktopListingRowProps {
  listing: Listing;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onOpenListing: () => void;
}

export default function DesktopListingRow({ listing, onHoverStart, onHoverEnd, onOpenListing }: DesktopListingRowProps) {
  const images = getRowImages(listing.images);
  const [imageIndex, setImageIndex] = useState(0);
  const imageRailRef = useRef<HTMLDivElement>(null);

  const scrollToImage = (index: number) => {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    setImageIndex(nextIndex);
    const node = imageRailRef.current;
    const target = node?.children[nextIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <article
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="group grid min-h-[560px] cursor-pointer grid-cols-[minmax(190px,0.16fr)_minmax(0,1fr)] gap-5 rounded-[30px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]"
      role="button"
      tabIndex={0}
      onClick={onOpenListing}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpenListing();
      }}
    >
      <div className="flex min-w-0 flex-col justify-between px-1.5 py-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="type-title leading-none text-[var(--color-text-primary)]"><PriceText price={listing.price} /></p>
              <p className="mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                {formatBedBathSqftLine(listing.beds, listing.baths, listing.sqft, { separator: '  ', spacedSqft: false })}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-surface)] px-2.5 py-1 type-caption text-[var(--color-text-secondary)]">
              {formatDaysOnMarket(listing.daysOnMarket)}
            </span>
          </div>
          <p className="mt-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
            <span className="line-clamp-2">{listing.address}, {listing.city}</span>
          </p>
          <p className="mt-2 min-w-0 truncate type-micro uppercase leading-[1.15] tracking-[0.02em] text-[#A6ADB8]">
            {formatMlsLine(listing.mlsNumber, listing.brokerage)}
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {listing.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[var(--color-surface)] px-2 py-1 type-caption text-[var(--color-text-secondary)]"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <ListingSaveButton listingId={listing.id} variant="icon" className="h-10 w-10 bg-white shadow-[var(--shadow-control)] hover:bg-[var(--color-surface)]" />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={(event) => {
              event.stopPropagation();
              onOpenListing();
            }}
            className="min-w-[108px] px-5 type-label"
          >
            Details
          </Button>
        </div>
      </div>

      <div
        className="relative min-w-0 overflow-hidden rounded-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          ref={imageRailRef}
          className="flex h-full min-w-0 snap-x gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const node = event.currentTarget;
            const nextIndex = Math.round(node.scrollLeft / Math.max(1, node.clientWidth * 0.82));
            setImageIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
          }}
        >
          {images.map((src, index) => (
            <button
              key={`${listing.id}-${src}-${index}`}
              type="button"
              className="relative h-full min-h-[528px] w-[78%] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[var(--color-surface)]"
              onClick={onOpenListing}
              aria-label={`Open ${listing.address} image ${index + 1}`}
            >
              <Image
                src={src}
                alt={index === 0 ? listing.address : ''}
                fill
              sizes="900px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <Button
              variant="overlay"
              shape="circle"
              size="md"
              disabled={imageIndex === 0}
              aria-label="Previous listing image"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={(event) => {
                event.stopPropagation();
                scrollToImage(imageIndex - 1);
              }}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="overlay"
              shape="circle"
              size="md"
              disabled={imageIndex >= images.length - 1}
              aria-label="Next listing image"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={(event) => {
                event.stopPropagation();
                scrollToImage(imageIndex + 1);
              }}
            >
              <ChevronRight size={18} />
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function getRowImages(images: string[]) {
  const available = images.length > 0 ? images : ROW_IMAGE_FALLBACKS;
  return Array.from(
    { length: ROW_IMAGE_COUNT },
    (_, index) => available[index % available.length] ?? ROW_IMAGE_FALLBACKS[index % ROW_IMAGE_FALLBACKS.length]
  );
}
