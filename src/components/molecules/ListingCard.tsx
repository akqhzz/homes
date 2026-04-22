'use client';
import { useRef, useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { Listing } from '@/lib/types';
import { formatPrice, formatDaysOnMarket } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

const CAROUSEL_IMAGE_HEIGHT = 174;
const CAROUSEL_TOTAL_HEIGHT = 268;
const CAROUSEL_INFO_HEIGHT = CAROUSEL_TOTAL_HEIGHT - CAROUSEL_IMAGE_HEIGHT;
const IMAGE_SWIPE_THRESHOLD = 24;

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
  const imageTouchStart = useRef<{ x: number; y: number } | null>(null);

  const stopCarouselDrag = (e: React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const showNextImage = () => {
    setImgIndex((index) => Math.min(listing.images.length - 1, index + 1));
  };

  const showPreviousImage = () => {
    setImgIndex((index) => Math.max(0, index - 1));
  };

  const handleImageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    stopCarouselDrag(e);
    imageTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleImageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!imageTouchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - imageTouchStart.current.x;
    const dy = touch.clientY - imageTouchStart.current.y;
    imageTouchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < IMAGE_SWIPE_THRESHOLD) return;
    if (dx < 0 || dy < 0) showNextImage();
    else showPreviousImage();
  };

  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
    if (e.deltaY > 0 || e.deltaX > 0) showNextImage();
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
          <img
            src={listing.images[0]}
            alt={listing.address}
            className="w-full h-full object-cover"
          />
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
          <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
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
        onTouchStart={handleImageTouchStart}
        onTouchMove={stopCarouselDrag}
        onTouchEnd={handleImageTouchEnd}
        onPointerDown={stopCarouselDrag}
        onWheel={handleImageWheel}
      >
        <img src={listing.images[imgIndex]} alt="" className="h-full w-full object-cover" draggable={false} />
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
        className="absolute bottom-0 left-0 right-0 bg-white px-3.5 py-2 text-left"
        style={{ height: CAROUSEL_INFO_HEIGHT, touchAction: 'pan-x' }}
        onClick={() => openListingDetail(listing.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-black text-[#0F1729] text-[15px] leading-snug">{formatPrice(listing.price)}</p>
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">
              {listing.beds}bd {listing.baths}ba {listing.sqft.toLocaleString()}sqft
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[#9CA3AF] line-clamp-2">
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
