'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Heart, RotateCcw, Map, MapPin } from 'lucide-react';
import { Listing } from '@/lib/types';
import { formatPrice, formatDaysOnMarket, formatSqft } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const SWIPE_THRESHOLD = 100;
const CARD_MODE_IMAGE_HEIGHT = 340;
const CARD_MODE_IMAGE_COUNT = 4;
const CARD_GAP = 12;
const FALLBACK_LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
];

function mapThumb(listing: Listing) {
  if (!MAPBOX_TOKEN) return null;
  const { lng, lat } = listing.coordinates;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+0F1729(${lng},${lat})/${lng},${lat},14,0/140x112@2x?access_token=${MAPBOX_TOKEN}`;
}

interface CardsModeProps {
  listings: Listing[];
  onClose: () => void;
}

export default function CardsMode({ listings, onClose }: CardsModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(360);
  const [viewportWidth, setViewportWidth] = useState(390);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const wheelLockRef = useRef(false);

  const { toggleLike, isLiked, swipeDislike, swipeUndo } = useSavedStore();
  const { openListingDetail, setActivePanel } = useUIStore();
  const { setViewState, setSelectedListingId } = useMapStore();

  const listing = listings[currentIndex];

  useEffect(() => {
    const updateWidth = () => {
      setViewportWidth(window.innerWidth);
      setCardWidth(Math.max(292, window.innerWidth - 24));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorX;
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorX = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    listings.slice(currentIndex, currentIndex + 3).forEach((item) => {
      getListingImages(item).forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
    });
  }, [currentIndex, listings]);

  const advance = (action: 'like' | 'dislike') => {
    if (!listing) return;
    if (action === 'like') toggleLike(listing.id);
    else swipeDislike(listing.id);
    setCurrentIndex((i) => i + 1);
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;
    swipeUndo();
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const navigateCard = (direction: 'next' | 'previous') => {
    setCurrentIndex((index) => {
      if (direction === 'next') return Math.min(listings.length, index + 1);
      return Math.max(0, index - 1);
    });
  };

  const handleTrackDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -650) {
      navigateCard('next');
      return;
    }
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 650) navigateCard('previous');
  };

  const handleTrackWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
    event.preventDefault();
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    navigateCard(event.deltaX > 0 ? 'next' : 'previous');
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 430);
  };

  const handleShowOnMap = () => {
    if (!listing) return;
    setViewState({ longitude: listing.coordinates.lng, latitude: listing.coordinates.lat, zoom: 15 });
    setSelectedListingId(listing.id);
    setActivePanel('none');
    onClose();
  };

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5">
        <span className="text-5xl">🏠</span>
        <div className="text-center">
          <p className="font-black text-xl text-[#0F1729]">All caught up!</p>
          <p className="text-[#9CA3AF] text-sm mt-1">You&apos;ve seen all {listings.length} listings</p>
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-[#0F1729] underline underline-offset-2">
          Back to map
        </button>
      </div>
    );
  }

  const liked = isLiked(listing.id);
  const thumb = mapThumb(listing);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overscroll-x-none">
      {/* Card stack */}
      <div
        className="flex-1 relative px-3 pt-3 pb-2 min-h-0 overflow-hidden"
        onWheel={handleTrackWheel}
      >
        <motion.div
          className="flex h-full"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          dragMomentum={false}
          animate={{ x: -currentIndex * (cardWidth + CARD_GAP) }}
          transition={{ type: 'spring', damping: 34, stiffness: 360, mass: 0.9 }}
          onDragEnd={handleTrackDragEnd}
          style={{
            gap: CARD_GAP,
            willChange: 'transform',
            paddingLeft: Math.max(0, (viewportWidth - cardWidth) / 2 - 12),
            paddingRight: Math.max(0, (viewportWidth - cardWidth) / 2 - 12),
          }}
        >
          {listings.map((item, index) => (
            <CardModeListingCard
              key={item.id}
              listing={item}
              width={cardWidth}
              active={index === currentIndex}
              onOpenDetail={() => {
                setCurrentIndex(index);
                setShowDetailDrawer(true);
              }}
              onOpenMap={() => {
                setCurrentIndex(index);
                setShowMapDrawer(true);
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Action buttons */}
      <div
        className="flex-shrink-0 px-6 flex items-center justify-between"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
      >
        {/* Undo */}
        <FloatingActionButton
          layoutId="saved-undo-control"
          onClick={handleUndo}
          disabled={currentIndex === 0}
          aria-label="Undo"
        >
          <RotateCcw size={17} strokeWidth={2} />
        </FloatingActionButton>

        <div className="flex items-center gap-2.5">
          {/* Dislike */}
          <button
            onClick={() => advance('dislike')}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:scale-105 active:scale-95 transition-all no-select"
          >
            <X size={22} className="text-[#EF4444]" strokeWidth={2.5} />
          </button>

          {/* Like */}
          <button
            onClick={() => advance('like')}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:scale-105 active:scale-95 transition-all no-select"
          >
            <Heart
              size={22}
              strokeWidth={2.5}
              className={cn(liked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#EF4444]')}
            />
          </button>
        </div>

        {/* Map — back to map */}
        <FloatingActionButton
          layoutId="cards-map-control"
          onClick={handleShowOnMap}
          aria-label="Map"
        >
          <Map size={17} strokeWidth={2} />
        </FloatingActionButton>
      </div>

      {/* Listing detail drawer */}
      <AnimatePresence>
        {showDetailDrawer && (
          <MobileDrawer
            title={listing.address.split(',')[0]}
            onClose={() => setShowDetailDrawer(false)}
            heightClassName="h-[72dvh]"
            contentClassName="p-4"
            footer={(
              <Button
                onClick={() => { setShowDetailDrawer(false); openListingDetail(listing.id); }}
                fullWidth
                size="lg"
              >
                Full Listing Details
              </Button>
            )}
          >
            <p className="text-2xl font-black text-[#0F1729]">{formatPrice(listing.price)}</p>
            <p className="text-sm text-[#6B7280] mt-1">
              {listing.beds}bd · {listing.baths}ba · {formatSqft(listing.sqft)} sqft
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
              <MapPin size={11} />
              {listing.address}, {listing.city}
            </p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <p className="text-sm text-[#6B7280] leading-relaxed">{listing.description}</p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <div className="flex flex-wrap gap-2">
              {listing.features.map((f) => (
                <span key={f} className="text-xs bg-[#F5F6F7] text-[#6B7280] px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      {/* Mini-map drawer */}
      <AnimatePresence>
        {showMapDrawer && (
          <MobileDrawer
            title={listing.neighborhood}
            onClose={() => setShowMapDrawer(false)}
            heightClassName="h-[55dvh]"
            contentClassName="flex flex-col"
            footer={(
              <Button onClick={handleShowOnMap} variant="secondary" fullWidth size="md">
                View on Map
              </Button>
            )}
          >
            {thumb ? (
              <img src={thumb.replace('140x112', '800x400')} alt="map" className="w-full flex-1 object-cover" />
            ) : (
              <div className="mx-4 mb-4 flex flex-1 items-center justify-center rounded-2xl bg-[#E8ECEF]">
                <div className="text-center p-6">
                  <MapPin size={36} className="mx-auto mb-3 text-[#9CA3AF]" />
                  <p className="font-semibold text-[#0F1729]">{listing.neighborhood}</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">{listing.address}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{listing.coordinates.lat.toFixed(4)}, {listing.coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
            )}
          </MobileDrawer>
        )}
      </AnimatePresence>
    </div>
  );
}

function getListingImages(listing: Listing) {
  const available = listing.images.length > 0 ? listing.images : FALLBACK_LISTING_IMAGES;
  return Array.from(
    { length: CARD_MODE_IMAGE_COUNT },
    (_, index) => available[index % available.length] || FALLBACK_LISTING_IMAGES[index % FALLBACK_LISTING_IMAGES.length]
  );
}

function ListingImage({
  src,
  fallbackIndex,
  alt,
  className,
  eager,
}: {
  src: string;
  fallbackIndex: number;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fallbackSrc = FALLBACK_LISTING_IMAGES[fallbackIndex % FALLBACK_LISTING_IMAGES.length];
  const imageSrc = failedSrc === src ? fallbackSrc : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn('h-full w-full object-cover bg-[#E8ECEF]', className)}
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function CardModeListingCard({
  listing,
  width,
  active,
  onOpenDetail,
  onOpenMap,
}: {
  listing: Listing;
  width: number;
  active: boolean;
  onOpenDetail: () => void;
  onOpenMap: () => void;
}) {
  const images = getListingImages(listing);
  const thumb = mapThumb(listing);

  return (
    <motion.article
      className="h-full flex-shrink-0 overflow-hidden rounded-[22px] bg-white no-select"
      style={{ width }}
      animate={{ scale: active ? 1 : 0.965, opacity: active ? 1 : 0.82 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div
        className="block h-full w-full cursor-pointer text-left"
        role="button"
        tabIndex={0}
        onClick={onOpenDetail}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpenDetail();
        }}
      >
        <div className="relative h-full rounded-[22px] bg-white">
          <div
            className="h-full overflow-y-auto rounded-[22px] bg-white scrollbar-hide"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {images.map((src, index) => (
              <div
                key={`${listing.id}-${src}-${index}`}
                className="overflow-hidden bg-[#F5F6F7] first:rounded-t-[22px] last:rounded-b-[22px]"
                style={{ height: CARD_MODE_IMAGE_HEIGHT, scrollSnapAlign: 'start' }}
              >
                <ListingImage src={src} fallbackIndex={index} alt={index === 0 ? listing.address : ''} eager={active || index < 2} />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
            <div className="flex items-end gap-2">
              <div className="flex h-24 min-w-0 flex-1 flex-col justify-center rounded-[24px] bg-white/90 px-5 shadow-[0_8px_28px_rgba(15,23,41,0.16)] backdrop-blur-xl">
                <p className="text-2xl font-normal leading-tight tracking-normal text-[#0F1729]">{formatPrice(listing.price)}</p>
                <p className="mt-2 text-base font-normal tracking-normal text-[#5C5F66]">
                  {listing.beds} bd {listing.baths} ba {formatSqft(listing.sqft)}sqft {formatDaysOnMarket(listing.daysOnMarket)}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenMap();
                }}
                className="pointer-events-auto relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] bg-white/90 shadow-[0_8px_28px_rgba(15,23,41,0.16)] backdrop-blur-xl"
                aria-label="Open map preview"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E8ECEF] text-[#0F1729]">
                    <MapPin size={24} />
                  </div>
                )}
                <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0F1729] text-white">
                  <Map size={13} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
