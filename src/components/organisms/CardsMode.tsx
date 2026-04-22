'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
const SWIPE_THRESHOLD = 38;
const CARD_MODE_IMAGE_HEIGHT = 305;
const CARD_MODE_IMAGE_COUNT = 8;
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
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);
  const [likePulse, setLikePulse] = useState(false);
  const wheelLockRef = useRef(false);
  const dragLockRef = useRef(false);
  const activeDragRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
    const node = trackRef.current;
    if (!node) return;
    let start: { x: number; y: number } | null = null;
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        event.preventDefault();
      }
    };
    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
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

  const handleLike = () => {
    if (!listing) return;
    toggleLike(listing.id);
    setLikePulse(true);
    window.setTimeout(() => {
      setLikePulse(false);
      setCurrentIndex((i) => i + 1);
    }, 170);
  };

  const navigateCard = (direction: 'next' | 'previous') => {
    if (dragLockRef.current) return;
    dragLockRef.current = true;
    setCurrentIndex((index) => {
      if (direction === 'next') return Math.min(listings.length, index + 1);
      return Math.max(0, index - 1);
    });
    window.setTimeout(() => {
      dragLockRef.current = false;
    }, 520);
  };

  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    activeDragRef.current = false;
  };

  const handleTrackPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    if (Math.abs(event.clientX - start.x) > 8) activeDragRef.current = true;
  };

  const handleTrackPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    pointerStartRef.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
      window.setTimeout(() => {
        activeDragRef.current = false;
      }, 90);
      return;
    }
    activeDragRef.current = true;
    window.setTimeout(() => {
      activeDragRef.current = false;
    }, 90);
    if (dx < 0) {
      navigateCard('next');
      return;
    }
    navigateCard('previous');
  };

  const handleTrackTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTrackTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) event.preventDefault();
  };

  const handleTrackWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
    event.preventDefault();
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    navigateCard(event.deltaX > 0 ? 'next' : 'previous');
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 900);
  };

  const handleShowOnMap = (targetListing = listing) => {
    if (!targetListing) return;
    setViewState({ longitude: targetListing.coordinates.lng, latitude: targetListing.coordinates.lat, zoom: 15 });
    setSelectedListingId(targetListing.id);
    setActivePanel('none');
    onClose();
  };

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5">
        <span className="text-5xl">🏠</span>
        <div className="text-center">
          <p className="font-heading text-xl text-[#0F1729]">All caught up!</p>
          <p className="text-[#9CA3AF] text-sm mt-1">You&apos;ve seen all {listings.length} listings</p>
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-[#0F1729] underline underline-offset-2">
          Back to map
        </button>
      </div>
    );
  }

  const liked = isLiked(listing.id);
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white flex flex-col overscroll-x-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      {/* Card stack */}
      <div
        ref={trackRef}
        className="flex-1 relative px-3 pt-3 pb-2 min-h-0 overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onWheel={handleTrackWheel}
        onPointerDownCapture={handleTrackPointerDown}
        onPointerMoveCapture={handleTrackPointerMove}
        onPointerUpCapture={handleTrackPointerEnd}
        onPointerCancelCapture={() => { pointerStartRef.current = null; activeDragRef.current = false; }}
        onTouchStart={handleTrackTouchStart}
        onTouchMove={handleTrackTouchMove}
      >
        <motion.div
          className="flex h-full"
          animate={{ x: -currentIndex * (cardWidth + CARD_GAP) }}
          transition={{ type: 'spring', stiffness: 260, damping: 34, mass: 0.34 }}
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
                if (activeDragRef.current) return;
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowDetailDrawer(true);
              }}
              onOpenMap={() => {
                if (activeDragRef.current) return;
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowMapDrawer(true);
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Action buttons */}
      <div
        className="flex-shrink-0 px-6 flex items-center justify-between"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
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
            <X size={22} className="text-[#4B5563]" strokeWidth={2.5} />
          </button>

          {/* Like */}
          <motion.button
            onClick={handleLike}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:scale-105 active:scale-95 transition-all no-select"
            animate={likePulse ? { scale: [1, 1.16, 1] } : { scale: 1 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <Heart
              size={22}
              strokeWidth={2.5}
              className={cn(liked || likePulse ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#EF4444]')}
            />
          </motion.button>
        </div>

        {/* Map — back to map */}
        <FloatingActionButton
          layoutId="cards-map-control"
          onClick={() => handleShowOnMap()}
          aria-label="Map"
        >
          <Map size={17} strokeWidth={2} />
        </FloatingActionButton>
      </div>

      {/* Listing detail drawer */}
      <AnimatePresence>
        {showDetailDrawer && (drawerListing ?? listing) && (
          <MobileDrawer
            title={(drawerListing ?? listing).address.split(',')[0]}
            onClose={() => setShowDetailDrawer(false)}
            heightClassName="h-[72dvh]"
            contentClassName="p-4"
            footer={(
              <Button
                onClick={() => { setShowDetailDrawer(false); openListingDetail((drawerListing ?? listing).id); }}
                fullWidth
                size="lg"
              >
                Full Listing Details
              </Button>
            )}
          >
            <p className="font-heading text-2xl text-[#0F1729]">{formatPrice((drawerListing ?? listing).price)}</p>
            <p className="text-sm text-[#6B7280] mt-1">
              {(drawerListing ?? listing).beds}bd · {(drawerListing ?? listing).baths}ba · {formatSqft((drawerListing ?? listing).sqft)} sqft
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
              <MapPin size={11} />
              {(drawerListing ?? listing).address}, {(drawerListing ?? listing).city}
            </p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <p className="text-sm text-[#6B7280] leading-relaxed">{(drawerListing ?? listing).description}</p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <div className="flex flex-wrap gap-2">
              {(drawerListing ?? listing).features.map((f) => (
                <span key={f} className="text-xs bg-[#F5F6F7] text-[#6B7280] px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      {/* Mini-map drawer */}
      <AnimatePresence>
        {showMapDrawer && (drawerListing ?? listing) && (
          <MobileDrawer
            title={(drawerListing ?? listing).neighborhood}
            onClose={() => setShowMapDrawer(false)}
            heightClassName="h-[55dvh]"
            contentClassName="flex flex-col"
            footer={(
              <Button onClick={() => handleShowOnMap(drawerListing ?? listing)} variant="secondary" fullWidth size="md">
                View on Map
              </Button>
            )}
          >
            {mapThumb(drawerListing ?? listing) ? (
              <img src={mapThumb(drawerListing ?? listing)!.replace('140x112', '800x400')} alt="map" className="w-full flex-1 object-cover" />
            ) : (
              <div className="mx-4 mb-4 flex flex-1 items-center justify-center rounded-2xl bg-[#E8ECEF]">
                <div className="text-center p-6">
                  <MapPin size={36} className="mx-auto mb-3 text-[#9CA3AF]" />
                  <p className="font-semibold text-[#0F1729]">{(drawerListing ?? listing).neighborhood}</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">{(drawerListing ?? listing).address}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{(drawerListing ?? listing).coordinates.lat.toFixed(4)}, {(drawerListing ?? listing).coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
            )}
          </MobileDrawer>
        )}
      </AnimatePresence>
    </motion.div>
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
      transition={{ type: 'spring', stiffness: 240, damping: 32, mass: 0.3 }}
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
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollBehavior: 'smooth',
            }}
          >
            {images.map((src, index) => (
              <div
                key={`${listing.id}-${src}-${index}`}
                className="overflow-hidden bg-[#F5F6F7] first:rounded-t-[22px] last:rounded-b-[22px]"
                style={{ height: CARD_MODE_IMAGE_HEIGHT }}
              >
                <ListingImage src={src} fallbackIndex={index} alt={index === 0 ? listing.address : ''} eager={active || index < 2} />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
            <div className="flex items-end gap-2">
              <div className="flex h-24 min-w-0 flex-1 flex-col justify-center rounded-[24px] bg-white/90 px-5 shadow-[0_8px_28px_rgba(15,23,41,0.16)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-normal leading-tight tracking-normal text-[#0F1729]">{formatPrice(listing.price)}</p>
                  <span className="rounded-full bg-[#F5F6F7] px-2.5 py-1 text-xs font-semibold text-[#6B7280]">
                    {formatDaysOnMarket(listing.daysOnMarket)}
                  </span>
                </div>
                <p className="mt-2 text-base font-normal tracking-normal text-[#5C5F66]">
                  {listing.beds} bd {listing.baths} ba {formatSqft(listing.sqft)}sqft
                </p>
              </div>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
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
