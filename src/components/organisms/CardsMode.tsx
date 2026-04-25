'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Map, MapPin, ArrowDownWideNarrow, X } from 'lucide-react';
import MapGL, { AttributionControl, Marker } from 'react-map-gl/mapbox';
import { Listing } from '@/lib/types';
import { formatPrice, formatDaysOnMarket, formatSqft } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';
import { getMapboxToken } from '@/lib/mapbox-token';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import OverlayCloseButton from '@/components/atoms/OverlayCloseButton';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';
import SaveToCollectionSheet from '@/components/molecules/SaveToCollectionSheet';
import SortOptionsDrawer from '@/components/molecules/SortOptionsDrawer';
import MapListingPin from '@/components/atoms/MapListingPin';

const MAPBOX_TOKEN = getMapboxToken();
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
type SortMode = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'newest', label: 'Newest first' },
];

function mapThumb(listing: Listing) {
  if (!MAPBOX_TOKEN) return null;
  const { lng, lat } = listing.coordinates;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lng},${lat},11.6,0/192x192@2x?access_token=${MAPBOX_TOKEN}`;
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
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);
  const [savePickerListing, setSavePickerListing] = useState<Listing | null>(null);
  const [likePulse, setLikePulse] = useState(false);
  const wheelLockRef = useRef(false);
  const dragLockRef = useRef(false);
  const activeDragRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

  const { isLiked, swipeDislike } = useSavedStore();
  const { setActivePanel } = useUIStore();
  const { setViewState, setSelectedListingId } = useMapStore();

  const sortedListings = useMemo(() => {
    const next = [...listings];
    if (sortMode === 'price-asc') return next.sort((a, b) => a.price - b.price);
    if (sortMode === 'price-desc') return next.sort((a, b) => b.price - a.price);
    if (sortMode === 'newest') return next.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    return next;
  }, [listings, sortMode]);
  const activeIndex = Math.min(currentIndex, Math.max(0, sortedListings.length - 1));
  const listing = sortedListings[activeIndex];

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
    const previousHtmlOverscrollY = document.documentElement.style.overscrollBehaviorY;
    const previousBodyOverscrollY = document.body.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    return () => {
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorX = previousBodyOverscroll;
      document.documentElement.style.overscrollBehaviorY = previousHtmlOverscrollY;
      document.body.style.overscrollBehaviorY = previousBodyOverscrollY;
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
    node.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    return () => {
      node.removeEventListener('touchstart', handleTouchStart, { capture: true });
      node.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sortedListings.slice(activeIndex, activeIndex + 3).forEach((item) => {
      getListingImages(item).forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
    });
  }, [activeIndex, sortedListings]);

  const passListing = () => {
    if (!listing) return;
    swipeDislike(listing.id);
    setCurrentIndex((i) => i + 1);
  };

  const handleSaved = () => {
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
      if (direction === 'next') return Math.min(sortedListings.length, index + 1);
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

  const handleTrackTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (dragLockRef.current) return;
    navigateCard(dx < 0 ? 'next' : 'previous');
  };

  const handleTrackWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
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
    setSelectedListingId(null);
    setActivePanel('none');
    onClose();
  };

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5">
        <span className="text-5xl">🏠</span>
        <div className="text-center">
          <p className="type-subtitle text-[#0F1729]">All caught up!</p>
          <p className="type-body text-[#9CA3AF] mt-1">You&apos;ve seen all {listings.length} listings</p>
        </div>
        <button onClick={onClose} className="type-label text-[#0F1729] underline underline-offset-2">
          Back to map
        </button>
      </div>
    );
  }

  const liked = isLiked(listing.id);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-white overscroll-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '100%', opacity: 1, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ overscrollBehaviorX: 'none', overscrollBehaviorY: 'none', touchAction: 'pan-y' }}
    >
      <OverlayCloseButton
        onClick={onClose}
        label="Close cards view"
        className="absolute z-20"
        style={{ right: '1.25rem', top: 'calc(env(safe-area-inset-top, 0px) + 0.95rem)' }}
        variant="glass"
      />

      {/* Card stack */}
      <div
        ref={trackRef}
        className="flex-1 relative px-3 pt-3 pb-2 min-h-0 overflow-hidden"
        style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none', overscrollBehaviorY: 'contain' }}
        onWheel={handleTrackWheel}
        onPointerDownCapture={handleTrackPointerDown}
        onPointerMoveCapture={handleTrackPointerMove}
        onPointerUpCapture={handleTrackPointerEnd}
        onPointerCancelCapture={() => { pointerStartRef.current = null; activeDragRef.current = false; }}
        onTouchStart={handleTrackTouchStart}
        onTouchMove={handleTrackTouchMove}
        onTouchEnd={handleTrackTouchEnd}
      >
        <motion.div
          className="flex h-full"
          animate={{ x: -activeIndex * (cardWidth + CARD_GAP) }}
          transition={{ type: 'spring', stiffness: 360, damping: 38, mass: 0.28 }}
          style={{
            gap: CARD_GAP,
            willChange: 'transform',
            paddingLeft: Math.max(0, (viewportWidth - cardWidth) / 2 - 12),
            paddingRight: Math.max(0, (viewportWidth - cardWidth) / 2 - 12),
          }}
        >
          {sortedListings.map((item, index) => (
            <CardModeListingCard
              key={item.id}
              listing={item}
              width={cardWidth}
              active={index === activeIndex}
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
              onClose={onClose}
            />
          ))}
        </motion.div>
      </div>

      {/* Action buttons */}
      <div
        className="flex-shrink-0 px-6 flex items-center justify-center gap-2.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <FloatingActionButton
          layoutId="cards-map-control"
          onClick={() => handleShowOnMap()}
          aria-label="Map"
        >
          <Map size={17} strokeWidth={2} />
        </FloatingActionButton>

        <button
          onClick={passListing}
          className="flex h-11 items-center gap-2 rounded-full bg-white px-5 type-label text-[#4B5563] shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] active:scale-95 transition-transform no-select"
        >
          <X size={16} strokeWidth={2.4} />
          Pass
        </button>

        <motion.button
          onClick={() => setSavePickerListing(listing)}
          className="flex h-11 items-center gap-2 rounded-full bg-white px-5 type-label text-[#0F1729] shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] active:scale-95 transition-transform no-select"
          animate={likePulse ? { scale: [1, 1.16, 1] } : { scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <Heart
            size={16}
            strokeWidth={2.4}
            className={cn(liked || likePulse ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#EF4444]')}
          />
          Save
        </motion.button>

        <FloatingActionButton
          layoutId="saved-undo-control"
          onClick={() => setShowSortDrawer(true)}
          aria-label="Sort cards"
        >
          <ArrowDownWideNarrow size={17} strokeWidth={2} />
        </FloatingActionButton>
      </div>

      {/* Listing detail drawer */}
      <AnimatePresence>
        {savePickerListing && (
          <SaveToCollectionSheet
            listingId={savePickerListing.id}
            onClose={() => setSavePickerListing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSortDrawer && (
          <SortOptionsDrawer
            title="Sort cards"
            open={showSortDrawer}
            value={sortMode}
            options={SORT_OPTIONS}
            onClose={() => setShowSortDrawer(false)}
            onChange={(value) => {
              setSortMode(value);
              setCurrentIndex(0);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailDrawer && (drawerListing ?? listing) && (
          <MobileDrawer
            title={(drawerListing ?? listing).address.split(',')[0]}
            onClose={() => setShowDetailDrawer(false)}
            heightClassName="max-h-[72dvh]"
            contentClassName="p-4"
            footer={(
              <Button
                onClick={() => {
                  const detailListing = drawerListing ?? listing;
                  setShowDetailDrawer(false);
                  router.push(`/listings/${detailListing.id}`);
                }}
                fullWidth
                size="lg"
              >
                Full Listing Detail
              </Button>
            )}
          >
            <p className="type-title text-[#0F1729]">{formatPrice((drawerListing ?? listing).price)}</p>
            <p className="type-body text-[#6B7280] mt-1">
              {(drawerListing ?? listing).beds}bd · {(drawerListing ?? listing).baths}ba · {formatSqft((drawerListing ?? listing).sqft)} sqft
            </p>
            <p className="type-caption text-[#9CA3AF] mt-1 flex items-center gap-1">
              <MapPin size={11} />
              {(drawerListing ?? listing).address}, {(drawerListing ?? listing).city}
            </p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <p className="type-body text-[#6B7280] leading-relaxed">{(drawerListing ?? listing).description}</p>
            <div className="h-px bg-[#F5F6F7] my-4" />
            <div className="flex flex-wrap gap-2">
              {(drawerListing ?? listing).features.map((f) => (
                <span key={f} className="type-caption bg-[#F5F6F7] text-[#6B7280] px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      {/* Mini-map drawer */}
      <AnimatePresence>
        {showMapDrawer && (drawerListing ?? listing) && (
          <MobileDrawer
            title={(
              <div className="pr-6 font-heading text-[1.02rem] font-medium leading-[1.35] text-[#334155]">
                {(drawerListing ?? listing).address}
              </div>
            )}
            onClose={() => setShowMapDrawer(false)}
            heightClassName="h-[58dvh]"
            contentClassName="flex flex-1 flex-col px-4 pb-4 pt-0"
          >
            {MAPBOX_TOKEN ? (
              <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[24px]">
                <MapGL
                  initialViewState={{
                    longitude: (drawerListing ?? listing).coordinates.lng,
                    latitude: (drawerListing ?? listing).coordinates.lat,
                    zoom: 13.2,
                  }}
                  mapStyle="mapbox://styles/mapbox/standard"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  attributionControl={false}
                  style={{ width: '100%', height: '100%' }}
                  config={{
                    basemap: {
                      theme: 'faded',
                      lightPreset: 'day',
                      show3dObjects: false,
                    },
                  }}
                >
                  <Marker
                    longitude={(drawerListing ?? listing).coordinates.lng}
                    latitude={(drawerListing ?? listing).coordinates.lat}
                    anchor="bottom"
                  >
                    <MapListingPin size={22} dotSize={6} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.18)]" />
                  </Marker>
                  <AttributionControl compact position="bottom-right" />
                </MapGL>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-[24px] bg-[#E8ECEF]">
                <div className="text-center p-6">
                  <MapPin size={36} className="mx-auto mb-3 text-[#9CA3AF]" />
                  <p className="type-label text-[#0F1729]">{(drawerListing ?? listing).neighborhood}</p>
                  <p className="type-body text-[#9CA3AF] mt-1">{(drawerListing ?? listing).address}</p>
                  <p className="type-caption text-[#9CA3AF] mt-1">{(drawerListing ?? listing).coordinates.lat.toFixed(4)}, {(drawerListing ?? listing).coordinates.lng.toFixed(4)}</p>
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
    <Image
      src={imageSrc}
      alt={alt}
      width={900}
      height={675}
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
  onClose,
}: {
  listing: Listing;
  width: number;
  active: boolean;
  onOpenDetail: () => void;
  onOpenMap: () => void;
  onClose: () => void;
}) {
  const images = getListingImages(listing);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const imagePullStartRef = useRef<{ x: number; y: number; atTop: boolean } | null>(null);

  const handleImageTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    imagePullStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      atTop: (imageScrollRef.current?.scrollTop ?? 0) <= 2,
    };
  };

  const handleImageTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = imagePullStartRef.current;
    if (!start) return;
    const dx = event.touches[0].clientX - start.x;
    const dy = event.touches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!start.atTop) return;
    if (dy > 8) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleImageTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = imagePullStartRef.current;
    imagePullStartRef.current = null;
    if (!start?.atTop) return;
    const touch = event.changedTouches[0];
    if (touch.clientY - start.y > 58) onClose();
  };

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
            ref={imageScrollRef}
            className="h-full overflow-y-auto rounded-[22px] bg-white scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              overscrollBehaviorX: 'none',
              scrollBehavior: 'smooth',
              touchAction: 'pan-y',
            }}
            onTouchStart={handleImageTouchStart}
            onTouchMove={handleImageTouchMove}
            onTouchEnd={handleImageTouchEnd}
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
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <p className="type-price min-w-0 truncate leading-tight text-[#0F1729]">{formatPrice(listing.price)}</p>
                  <span className="shrink-0 rounded-full bg-[#F5F6F7] px-2.5 py-1 type-caption font-semibold text-[#6B7280]">
                    {formatDaysOnMarket(listing.daysOnMarket)}
                  </span>
                </div>
                <p className="mt-2 type-body-lg text-[#5C5F66]">
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
                {mapThumb(listing) ? (
                  <>
                    <Image src={mapThumb(listing)!} alt="" fill sizes="96px" className="object-cover" draggable={false} unoptimized />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[82%]">
                      <MapListingPin size={18} dotSize={5} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.2)]" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(160deg,#edf2f7,#dbe4ee)]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
