'use client';
import { useRef, useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Listing } from '@/lib/types';
import { formatPrice, formatDaysOnMarket } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

const CAROUSEL_IMAGE_HEIGHT = 174;
const CAROUSEL_TOTAL_HEIGHT = 248;
const CAROUSEL_INFO_HEIGHT = CAROUSEL_TOTAL_HEIGHT - CAROUSEL_IMAGE_HEIGHT;
const IMAGE_SWIPE_THRESHOLD = 24;
const LISTING_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
];

interface ListingCardProps {
  listing: Listing;
  variant?: 'carousel' | 'grid' | 'full';
  className?: string;
}

export default function ListingCard({ listing, variant = 'carousel', className }: ListingCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const isLiked = useSavedStore((s) => s.isLiked(listing.id));
  const toggleLike = useSavedStore((s) => s.toggleLike);
  const openListingDetail = useUIStore((s) => s.openListingDetail);
  const imagePointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const imagePointerMoved = useRef(false);
  const wheelLockRef = useRef(false);

  const stopCarouselDrag = (e: React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const showNextImage = () => {
    if (listing.images.length <= 1) return;
    setImgIndex((index) => (index + 1) % listing.images.length);
  };

  const showPreviousImage = () => {
    if (listing.images.length <= 1) return;
    setImgIndex((index) => (index - 1 + listing.images.length) % listing.images.length);
  };

  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (e.deltaY > 0 || e.deltaX > 0) showNextImage();
    else showPreviousImage();
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    imagePointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    imagePointerMoved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = imagePointerStart.current;
    if (!start || start.id !== e.pointerId) return;
    if (Math.abs(e.clientX - start.x) > 6 || Math.abs(e.clientY - start.y) > 6) {
      imagePointerMoved.current = true;
    }
  };

  const handleImagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = imagePointerStart.current;
    if (!start || start.id !== e.pointerId) return;
    imagePointerStart.current = null;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < IMAGE_SWIPE_THRESHOLD) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx < 0) showNextImage();
      else showPreviousImage();
      return;
    }
  };

  const handleImageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (imagePointerMoved.current) {
      imagePointerMoved.current = false;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left >= rect.width / 2) showNextImage();
    else showPreviousImage();
  };

  if (variant === 'grid') {
    return (
      <div
        className={cn('flex flex-col gap-2 text-left no-select w-full', className)}
        onClick={() => openListingDetail(listing.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openListingDetail(listing.id);
        }}
      >
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F5F6F7]">
          <ListingImage src={listing.images[0]} alt={listing.address} fallbackIndex={0} className="w-full h-full object-cover" />
          <button
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.10)]"
            onClick={(e) => { e.stopPropagation(); toggleLike(listing.id); }}
          >
            <Heart
              size={13}
              className={cn(isLiked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#6B7280]')}
            />
          </button>
        </div>
        <div className="px-0.5">
          <p className="font-bold text-[#0F1729] text-sm">{formatPrice(listing.price)}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{listing.beds}bd {listing.baths}ba {listing.sqft.toLocaleString()}sqft</p>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.06)]', className)}>
        <div className="relative aspect-video overflow-hidden bg-[#F5F6F7]">
          <ListingImage src={listing.images[0]} alt="" fallbackIndex={0} className="w-full h-full object-cover" />
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.10)]"
            onClick={() => toggleLike(listing.id)}
          >
            <Heart size={14} className={cn(isLiked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#0F1729]')} />
          </button>
        </div>
        <div className="p-4">
          <p className="font-black text-[#0F1729] text-lg">{formatPrice(listing.price)}</p>
          <p className="text-sm text-[#6B7280] mt-1">{listing.beds}bd · {listing.baths}ba · {listing.sqft.toLocaleString()} sqft</p>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-[#9CA3AF]">
            <MapPin size={11} />
            <span>{listing.address}</span>
          </div>
        </div>
      </div>
    );
  }

  // Carousel variant — fixed height, image scrolls vertically, info is static
  return (
    <div
      className={cn(
        'relative flex-shrink-0 bg-white rounded-2xl overflow-hidden no-select',
        'shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]',
        'w-72',
        className
      )}
      style={{ height: CAROUSEL_TOTAL_HEIGHT }}
    >
      {/* Image strip: swiping here changes photos instead of moving the carousel. */}
      <div
        className="relative overflow-hidden bg-[#F5F6F7]"
        style={{
          height: CAROUSEL_IMAGE_HEIGHT,
          touchAction: 'none',
        }}
        onClick={handleImageTap}
        onTouchMove={stopCarouselDrag}
        onPointerDown={handleImagePointerDown}
        onPointerMove={handleImagePointerMove}
        onPointerUp={handleImagePointerUp}
        onPointerCancel={() => { imagePointerStart.current = null; }}
        onWheel={handleImageWheel}
      >
        <ListingImage src={listing.images[imgIndex]} alt="" fallbackIndex={imgIndex} className="h-full w-full object-cover" />
      </div>

      {/* Image dots */}
      {listing.images.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 pointer-events-none z-10">
          {listing.images.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-200',
                i === imgIndex ? 'w-4 bg-white' : 'w-1 bg-white/55'
              )}
            />
          ))}
        </div>
      )}

      {/* Heart */}
      <button
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.10)] z-10"
        onClick={(e) => { e.stopPropagation(); toggleLike(listing.id); }}
      >
        <Heart
          size={14}
          className={cn(isLiked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#0F1729]')}
        />
      </button>

      {/* Info — static, touching this area lets horizontal carousel scroll */}
      <button
        className="absolute bottom-0 left-0 right-0 bg-white px-3.5 py-1.5 text-left"
        style={{ height: CAROUSEL_INFO_HEIGHT, touchAction: 'pan-x' }}
        onClick={() => openListingDetail(listing.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-black text-[#0F1729] text-[15px] leading-snug">{formatPrice(listing.price)}</p>
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">
              {listing.beds}bd {listing.baths}ba {listing.sqft.toLocaleString()}sqft
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[#9CA3AF] line-clamp-1">
              {listing.address}
            </p>
          </div>
          <span className="text-xs text-[#9CA3AF] shrink-0 mt-0.5">
            {formatDaysOnMarket(listing.daysOnMarket)}
          </span>
        </div>
      </button>
    </div>
  );
}

function ListingImage({
  src,
  alt,
  fallbackIndex,
  className,
}: {
  src: string;
  alt: string;
  fallbackIndex: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fallbackSrc = LISTING_IMAGE_FALLBACKS[fallbackIndex % LISTING_IMAGE_FALLBACKS.length];
  return (
    <img
      src={failedSrc === src ? fallbackSrc : src}
      alt={alt}
      className={className}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}
