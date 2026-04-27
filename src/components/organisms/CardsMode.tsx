'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, ChevronRight, Heart, Map, MapPin, ArrowDownWideNarrow, Undo2, X } from 'lucide-react';
import MapGL, { AttributionControl, Marker } from 'react-map-gl/mapbox';
import { Listing } from '@/lib/types';
import { formatDaysOnMarket, formatSqft } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useListingSave } from '@/hooks/useListingSave';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { cn } from '@/lib/utils/cn';
import { getMapboxToken, getStaticMapPreviewUrl } from '@/lib/mapbox';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import OverlayIconButton from '@/components/atoms/OverlayIconButton';
import OverlayCloseButton from '@/components/atoms/OverlayCloseButton';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';
import SaveToCollectionSheet from '@/components/molecules/SaveToCollectionSheet';
import SortOptionsDrawer from '@/components/molecules/SortOptionsDrawer';
import MapListingPin from '@/components/atoms/MapListingPin';
import PriceText from '@/components/atoms/PriceText';

const MAPBOX_TOKEN = getMapboxToken();
const SWIPE_COMMIT_DISTANCE = 96;
const SWIPE_COMMIT_VELOCITY = 520;
const SWIPE_EXIT_DURATION = 480;
const STACK_VISIBLE_COUNT = 3;
const CARD_MODE_IMAGE_HEIGHT = 305;
const CARD_MODE_IMAGE_COUNT = 8;
const CARD_MODE_ONBOARDING_STORAGE_KEY = 'homes-card-mode-onboarding-seen';
const ACTION_BUTTON_CLASS =
  'flex h-12 items-center gap-2 rounded-full bg-white px-6 type-label shadow-[var(--shadow-control)] active:scale-95 transition-all no-select';
const DETAIL_CHIP_CLASS =
  'type-caption pointer-events-auto inline-flex h-7 items-center gap-0.5 rounded-full bg-[var(--color-surface)] px-2.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]';
const FALLBACK_LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
];
type SortMode = 'recommended' | 'price-asc' | 'price-desc' | 'newest';
type CardSwipeAction = 'pass' | 'save';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'newest', label: 'Newest first' },
];

interface CardsModeProps {
  listings: Listing[];
  onClose: () => void;
}

export default function CardsMode({ listings, onClose }: CardsModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(360);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);
  const [savePickerListing, setSavePickerListing] = useState<Listing | null>(null);
  const [exitingCard, setExitingCard] = useState<{ listing: Listing; action: CardSwipeAction; startX: number; token: number } | null>(null);
  const [enteringListingId, setEnteringListingId] = useState<string | null>(null);
  const [activeSwipePreview, setActiveSwipePreview] = useState<CardSwipeAction | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CARD_MODE_ONBOARDING_STORAGE_KEY) !== 'true';
  });
  const wheelLockRef = useRef(false);
  const activeDragRef = useRef(false);
  const swipeLockRef = useRef(false);
  const exitTokenRef = useRef(0);
  const stackRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { swipeDislike } = useSavedStore();
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
  const { isSaved: liked, unsave } = useListingSave(listing?.id ?? '');
  const detailDrawerListing = drawerListing ?? listing;
  const mapDrawerListing = drawerListing ?? listing;
  const visibleListings = useMemo(
    () => sortedListings.slice(activeIndex, activeIndex + STACK_VISIBLE_COUNT),
    [activeIndex, sortedListings]
  );

  useEffect(() => {
    const updateWidth = () => {
      setCardWidth(Math.max(292, window.innerWidth - 16));
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
    const node = stackRef.current;
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

  const dismissOnboarding = () => {
    if (!showOnboarding) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_MODE_ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowOnboarding(false);
  };

  const passListing = () => {
    if (swipeLockRef.current) return;
    setActiveSwipePreview('pass');
    window.setTimeout(() => commitCardExit('pass'), 180);
  };

  const openSavePicker = (targetListing = listing) => {
    if (!targetListing || swipeLockRef.current) return;
    dismissOnboarding();
    activeDragRef.current = true;
    setSavePickerListing(targetListing);
    window.setTimeout(() => {
      activeDragRef.current = false;
    }, 120);
  };

  const commitCardExit = (action: CardSwipeAction, targetListing = listing, startX = 0) => {
    if (!targetListing || swipeLockRef.current) return;
    dismissOnboarding();
    swipeLockRef.current = true;
    activeDragRef.current = true;
    setActiveSwipePreview(null);
    if (action === 'pass') {
      swipeDislike(targetListing.id);
    }
    const nextExitToken = exitTokenRef.current + 1;
    exitTokenRef.current = nextExitToken;
    setExitingCard({ listing: targetListing, action, startX, token: nextExitToken });
    setCurrentIndex((i) => i + 1);
    window.setTimeout(() => {
      swipeLockRef.current = false;
    }, 360);
    window.setTimeout(() => {
      setExitingCard(null);
      setEnteringListingId(null);
      window.setTimeout(() => {
        activeDragRef.current = false;
      }, 80);
    }, SWIPE_EXIT_DURATION);
  };

  const navigateCard = (direction: 'next' | 'previous') => {
    if (swipeLockRef.current) return;
    dismissOnboarding();
    setCurrentIndex((index) => {
      if (direction === 'next') return Math.min(sortedListings.length, index + 1);
      const previousIndex = Math.max(0, index - 1);
      setEnteringListingId(sortedListings[previousIndex]?.id ?? null);
      return previousIndex;
    });
  };

  const handleTrackWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (event.deltaX > 0) commitCardExit('pass');
    else openSavePicker();
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 900);
  };

  const handleShowOnMap = (targetListing = listing) => {
    if (!targetListing) return;
    dismissOnboarding();
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
          <p className="type-subtitle text-[var(--color-text-primary)]">You&apos;ve seen everything</p>
          <p className="mt-1 type-body text-[var(--color-text-tertiary)]">You&apos;ve reached the end of this card stack. Jump back to the map to keep exploring.</p>
        </div>
        <button onClick={onClose} className="rounded-full bg-[var(--color-text-primary)] px-5 py-3 type-btn text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]">
          Back to map
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-white overscroll-none"
      initial={{ y: '100%', opacity: 1, scale: 1 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: '100%', opacity: 1, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ overscrollBehaviorX: 'none', overscrollBehaviorY: 'none', touchAction: 'pan-y' }}
    >
      <OverlayIconButton
        onClick={() => navigateCard('previous')}
        label="Undo to previous card"
        className="absolute left-4 z-[70]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.1rem)' }}
        variant="glass"
        icon={<Undo2 size={14} />}
        disabled={activeIndex === 0}
      />
      <OverlayCloseButton
        onClick={() => {
          dismissOnboarding();
          onClose();
        }}
        label="Close cards view"
        className="absolute z-[70]"
        style={{ right: '1rem', top: 'calc(env(safe-area-inset-top, 0px) + 1.1rem)' }}
        variant="glass"
      />
      {/* Card stack */}
      <div
        ref={stackRef}
        className="relative min-h-0 flex-1 overflow-visible px-2 pb-2 pt-2"
        style={{ touchAction: 'none', overscrollBehaviorX: 'none', overscrollBehaviorY: 'contain' }}
        onWheel={handleTrackWheel}
      >
        <div className="relative mx-auto h-full" style={{ width: cardWidth }}>
          {visibleListings.map((item, offset) => {
            const index = activeIndex + offset;
            return (
            <CardModeListingCard
              key={item.id}
              listing={item}
              width={cardWidth}
              active={offset === 0}
              stackIndex={offset}
              enterFrom={offset === 0 && enteringListingId === item.id ? 'left' : null}
              swipeExitAction={null}
              exitStartX={0}
              previewAction={offset === 0 ? activeSwipePreview : null}
              className="absolute left-0 top-0"
              style={{ height: '100%' }}
              onSwipe={(action, offsetX) => {
                if (action === 'save') {
                  openSavePicker(item);
                  return;
                }
                commitCardExit(action, item, offsetX);
              }}
              onDragActivity={(dragging) => {
                activeDragRef.current = dragging;
              }}
              onSwipePreview={setActiveSwipePreview}
              onOpenDetail={() => {
                if (activeDragRef.current) return;
                dismissOnboarding();
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowDetailDrawer(true);
              }}
              onOpenMap={() => {
                if (activeDragRef.current) return;
                dismissOnboarding();
                setCurrentIndex(index);
                setDrawerListing(item);
                setShowMapDrawer(true);
              }}
              onInteract={dismissOnboarding}
            />
            );
          })}
          {exitingCard && (
            <CardModeListingCard
              key={`exiting-${exitingCard.listing.id}-${exitingCard.token}`}
              listing={exitingCard.listing}
              width={cardWidth}
              active
              inert
              stackIndex={0}
              enterFrom={null}
              swipeExitAction={exitingCard.action}
              exitStartX={exitingCard.startX}
              previewAction={null}
              className="absolute left-0 top-0 z-[60]"
              style={{ height: '100%' }}
              onSwipe={() => undefined}
              onDragActivity={() => undefined}
              onSwipePreview={() => undefined}
              onOpenDetail={() => undefined}
              onOpenMap={() => undefined}
              onInteract={() => undefined}
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="relative z-[80] flex flex-shrink-0 items-center justify-center gap-2.5 bg-transparent px-6 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <FloatingActionButton
          onClick={() => handleShowOnMap()}
          aria-label="Map"
        >
          <Map size={17} strokeWidth={2} />
        </FloatingActionButton>

        <button
          onClick={passListing}
          className={cn(
            ACTION_BUTTON_CLASS,
            'text-[var(--color-text-secondary)]',
            activeSwipePreview === 'pass' && 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
          )}
        >
          <X size={18} strokeWidth={2.4} />
          Pass
        </button>

        <button
          onClick={() => {
            if (swipeLockRef.current) return;
            if (liked) {
              unsave();
              setActiveSwipePreview(null);
              return;
            }
            setActiveSwipePreview('save');
            window.setTimeout(() => {
              setActiveSwipePreview(null);
              openSavePicker();
            }, 180);
          }}
          className={cn(
            ACTION_BUTTON_CLASS,
            'text-[var(--color-text-primary)]',
            activeSwipePreview === 'save' && 'bg-[var(--color-accent-subtle,#fdf2f8)] text-[var(--color-accent)]'
          )}
        >
          <Heart
            size={18}
            strokeWidth={2.4}
            className={cn((liked || activeSwipePreview === 'save') ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-accent)]')}
          />
          Save
        </button>

        <FloatingActionButton
          onClick={() => {
            dismissOnboarding();
            setShowSortDrawer(true);
          }}
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
            onSaved={() => {
              const savedListing = savePickerListing;
              setSavePickerListing(null);
              commitCardExit('save', savedListing);
            }}
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
        {showOnboarding && (
          <MobileDrawer
            onClose={dismissOnboarding}
            heightClassName="h-auto max-h-[58dvh]"
            contentClassName="px-6 pb-6 pt-0"
            showBackdrop
            showCloseButton={false}
            zIndex={90}
          >
            <div className="mx-auto flex max-w-[320px] flex-col items-center text-center">
              <div className="relative flex h-24 w-full items-center justify-center">
                <motion.div
                  className="absolute h-[4.5rem] w-[8.5rem] rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-control)]"
                  animate={{ x: [-18, 18, -18] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute h-[4.5rem] w-[8.5rem] rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] opacity-75" />
                <motion.div
                  className="absolute flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 shadow-[var(--shadow-control)]"
                  animate={{ y: [6, -6, 6], opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowLeftRight size={14} className="text-[var(--color-text-inverse)]" />
                  <span className="type-micro text-[var(--color-text-inverse)]">Swipe</span>
                </motion.div>
              </div>
              <h3 className="mt-1 type-subtitle text-[var(--color-text-primary)]">Welcome to card mode ✨</h3>
              <p className="mt-2 type-body text-[var(--color-text-secondary)]">
                Swipe left to pass, right to save, or use the buttons below the card.
              </p>
              <Button onClick={dismissOnboarding} size="md" className="mt-4 min-w-[132px] type-btn">
                Got it
              </Button>
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailDrawer && detailDrawerListing && (
          <MobileDrawer
            title={detailDrawerListing.address.split(',')[0]}
            onClose={() => setShowDetailDrawer(false)}
            heightClassName="max-h-[72dvh]"
            contentClassName="p-4"
            zIndex={90}
            footer={(
              <Button
                onClick={() => {
                  setShowDetailDrawer(false);
                  router.push(`/listings/${detailDrawerListing.id}`);
                }}
                fullWidth
                size="lg"
              >
                Full Listing Detail
              </Button>
            )}
          >
            <p className="type-title text-[var(--color-text-primary)]"><PriceText price={detailDrawerListing.price} /></p>
            <p className="mt-1 type-body text-[var(--color-text-secondary)]">
              {detailDrawerListing.beds}bd · {detailDrawerListing.baths}ba · {formatSqft(detailDrawerListing.sqft)} sqft
            </p>
            <p className="mt-1 flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
              <MapPin size={11} />
              {detailDrawerListing.address}, {detailDrawerListing.city}
            </p>
            <div className="my-4 h-px bg-[var(--color-surface)]" />
            <p className="type-body leading-relaxed text-[var(--color-text-secondary)]">{detailDrawerListing.description}</p>
            <div className="my-4 h-px bg-[var(--color-surface)]" />
            <div className="flex flex-wrap gap-2">
              {detailDrawerListing.features.map((f) => (
                <span key={f} className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 type-caption text-[var(--color-text-secondary)]">{f}</span>
              ))}
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>

      {/* Mini-map drawer */}
      <AnimatePresence>
        {showMapDrawer && mapDrawerListing && (
          <MobileDrawer
            title={(
              <div className="pr-6 font-heading text-[1.02rem] font-medium leading-[1.35] text-[var(--color-text-secondary)]">
                {mapDrawerListing.address}
              </div>
            )}
            onClose={() => setShowMapDrawer(false)}
            heightClassName="h-[58dvh]"
            contentClassName="flex flex-1 flex-col px-4 pb-4 pt-0"
            zIndex={90}
          >
            {MAPBOX_TOKEN ? (
              <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[24px]">
                <MapGL
                  initialViewState={{
                    longitude: mapDrawerListing.coordinates.lng,
                    latitude: mapDrawerListing.coordinates.lat,
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
                    longitude={mapDrawerListing.coordinates.lng}
                    latitude={mapDrawerListing.coordinates.lat}
                    anchor="bottom"
                  >
                    <MapListingPin size={22} dotSize={6} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.18)]" />
                  </Marker>
                  <AttributionControl compact position="bottom-right" />
                </MapGL>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-[24px] bg-[var(--color-surface-hover)]">
                <div className="text-center p-6">
                  <MapPin size={36} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
                  <p className="type-label text-[var(--color-text-primary)]">{mapDrawerListing.neighborhood}</p>
                  <p className="mt-1 type-body text-[var(--color-text-tertiary)]">{mapDrawerListing.address}</p>
                  <p className="mt-1 type-caption text-[var(--color-text-tertiary)]">{mapDrawerListing.coordinates.lat.toFixed(4)}, {mapDrawerListing.coordinates.lng.toFixed(4)}</p>
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
      className={cn('h-full w-full object-cover bg-[var(--color-surface-hover)]', className)}
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
  inert = false,
  stackIndex,
  enterFrom,
  swipeExitAction,
  exitStartX,
  previewAction,
  className,
  onOpenDetail,
  onOpenMap,
  onInteract,
  onSwipe,
  onDragActivity,
  onSwipePreview,
  style,
}: {
  listing: Listing;
  width: number;
  active: boolean;
  inert?: boolean;
  stackIndex: number;
  enterFrom: 'left' | null;
  swipeExitAction: CardSwipeAction | null;
  exitStartX: number;
  previewAction: CardSwipeAction | null;
  className?: string;
  onOpenDetail: () => void;
  onOpenMap: () => void;
  onInteract: () => void;
  onSwipe: (action: CardSwipeAction, offsetX: number) => void;
  onDragActivity: (dragging: boolean) => void;
  onSwipePreview: (action: CardSwipeAction | null) => void;
  style?: CSSProperties;
}) {
  const [dragX, setDragX] = useState(0);
  const images = getListingImages(listing);
  const mapPreviewSrc = getStaticMapPreviewUrl(listing.coordinates, MAPBOX_TOKEN);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const imagePullStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const activeSaveStampOpacity = active ? Math.max(previewAction === 'save' ? 1 : 0, Math.min(1, Math.max(0, dragX / 96))) : 0;
  const activePassStampOpacity = active ? Math.max(previewAction === 'pass' ? 1 : 0, Math.min(1, Math.max(0, -dragX / 96))) : 0;
  const exitX = swipeExitAction === 'save' ? width + 150 : swipeExitAction === 'pass' ? -width - 150 : 0;
  const exitRotate = swipeExitAction === 'save' ? 15 : swipeExitAction === 'pass' ? -15 : 0;
  const cardAnimate = swipeExitAction
    ? { x: exitX, y: 0, rotate: exitRotate, scale: 1, opacity: 1 }
    : active
    ? { x: 0, y: 0, rotate: dragX / 18, scale: 1, opacity: 1 }
    : { x: 0, y: stackIndex * 13, rotate: 0, scale: 1 - stackIndex * 0.035, opacity: 1 - stackIndex * 0.13 };

  const handleOpenDetail = () => {
    if (!active || suppressClickRef.current) return;
    onOpenDetail();
  };

  const handleImageTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    imagePullStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const handleImageTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = imagePullStartRef.current;
    if (!start) return;
    const dx = event.touches[0].clientX - start.x;
    const dy = event.touches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      event.preventDefault();
    }
  };

  const handleImageTouchEnd = () => {
    imagePullStartRef.current = null;
  };

  return (
    <motion.article
      className={cn(
        'h-full flex-shrink-0 overflow-hidden rounded-[22px] bg-white no-select',
        active && 'shadow-[0_14px_30px_rgba(15,23,41,0.14)]',
        className
      )}
      style={{
        width,
        zIndex: 30 - stackIndex,
        pointerEvents: active && !inert ? 'auto' : 'none',
        touchAction: 'none',
        ...style,
      }}
      drag={active && !swipeExitAction ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.86}
      dragMomentum={false}
      initial={
        swipeExitAction
          ? { x: exitStartX, rotate: exitStartX / 18, scale: 1, opacity: 1 }
          : enterFrom === 'left'
          ? { x: -width - 150, rotate: -13, scale: 1, opacity: 1 }
          : false
      }
      onDragStart={() => {
        suppressClickRef.current = true;
        onDragActivity(true);
      }}
      onDrag={(_, info) => {
        setDragX(info.offset.x);
        if (info.offset.x > 18) {
          onSwipePreview('save');
        } else if (info.offset.x < -18) {
          onSwipePreview('pass');
        } else {
          onSwipePreview(null);
        }
      }}
      onDragEnd={(_, info) => {
        const action =
          info.offset.x > SWIPE_COMMIT_DISTANCE || info.velocity.x > SWIPE_COMMIT_VELOCITY
            ? 'save'
            : info.offset.x < -SWIPE_COMMIT_DISTANCE || info.velocity.x < -SWIPE_COMMIT_VELOCITY
            ? 'pass'
            : null;

        if (action) {
          setDragX(0);
          onSwipePreview(null);
          onSwipe(action, info.offset.x);
          if (action === 'save') {
            window.setTimeout(() => {
              suppressClickRef.current = false;
              onDragActivity(false);
            }, 120);
          }
          return;
        }

        setDragX(0);
        onSwipePreview(null);
        window.setTimeout(() => {
          suppressClickRef.current = false;
          onDragActivity(false);
        }, 120);
      }}
      animate={cardAnimate}
      transition={
        swipeExitAction
          ? { type: 'tween', duration: SWIPE_EXIT_DURATION / 1000, ease: [0.22, 1, 0.36, 1] }
          : { type: 'spring', stiffness: 360, damping: 34, mass: 0.34 }
      }
    >
      <div
        className="block h-full w-full cursor-pointer text-left"
        role="button"
        tabIndex={0}
        onClick={handleOpenDetail}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handleOpenDetail();
        }}
      >
        <div className="relative h-full rounded-[22px] bg-white">
          {swipeExitAction === 'pass' ? (
            <SwipeStamp label="PASS" tone="pass" opacity={1} rotation="-rotate-6" />
          ) : (
            activePassStampOpacity > 0 && <SwipeStamp label="PASS" tone="pass" opacity={activePassStampOpacity} rotation="-rotate-6" />
          )}
          {swipeExitAction === 'save' ? (
            <SwipeStamp label="SAVE" tone="save" opacity={1} rotation="rotate-6" />
          ) : (
            activeSaveStampOpacity > 0 && <SwipeStamp label="SAVE" tone="save" opacity={activeSaveStampOpacity} rotation="rotate-6" />
          )}
          <div
            ref={imageScrollRef}
            className="h-full overflow-y-auto rounded-[22px] bg-white scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              overscrollBehaviorX: 'none',
              scrollBehavior: 'smooth',
              touchAction: active ? 'pan-y' : 'none',
            }}
            onTouchStart={handleImageTouchStart}
            onTouchMove={handleImageTouchMove}
            onTouchEnd={handleImageTouchEnd}
          >
            {images.map((src, index) => (
              <div
                key={`${listing.id}-${src}-${index}`}
                className="overflow-hidden bg-[var(--color-surface)] first:rounded-t-[22px] last:rounded-b-[22px]"
                style={{ height: CARD_MODE_IMAGE_HEIGHT }}
              >
                <ListingImage src={src} fallbackIndex={index} alt={index === 0 ? listing.address : ''} eager={active || index < 2} />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
            <div className="flex items-end gap-2">
              <div className="relative flex h-24 min-w-0 flex-1 flex-col justify-center rounded-[24px] bg-[var(--color-background)] px-4 shadow-[0_8px_28px_rgba(15,23,41,0.16)]">
                <div className="flex w-full min-w-0 items-start justify-between gap-2">
                  <p className="type-title min-w-0 truncate leading-tight text-[var(--color-text-primary)]"><PriceText price={listing.price} /></p>
                  <span className="shrink-0 pt-0.5 type-caption font-medium text-[var(--color-text-secondary)]">
                    {formatDaysOnMarket(listing.daysOnMarket)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="type-body text-[var(--color-text-secondary)]">
                    {listing.beds}bd&nbsp;&nbsp;{listing.baths}ba&nbsp;&nbsp;{String(listing.sqft)}sqft
                  </p>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onInteract();
                      onOpenDetail();
                    }}
                    className={DETAIL_CHIP_CLASS}
                    aria-label="View details"
                  >
                    Details
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onInteract();
                  onOpenMap();
                }}
                className="pointer-events-auto relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] bg-white/90 shadow-[0_8px_28px_rgba(15,23,41,0.16)] backdrop-blur-xl"
                aria-label="Open map preview"
              >
                {mapPreviewSrc ? (
                  <>
                    <Image src={mapPreviewSrc} alt="" fill sizes="96px" className="object-cover" draggable={false} unoptimized />
                    <div className="pointer-events-none absolute inset-0 bg-white/18" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[82%]">
                      <MapListingPin size={18} dotSize={5} className="drop-shadow-[0_4px_12px_rgba(15,23,41,0.2)]" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-surface-hover)]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SwipeStamp({
  label,
  tone,
  opacity,
  rotation,
}: {
  label: string;
  tone: 'pass' | 'save';
  opacity: number;
  rotation: string;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        aria-hidden="true"
        className={cn(
          'rounded-2xl border-2 px-5 py-2.5 type-heading-sm tracking-[0.1em] shadow-[0_10px_26px_rgba(15,23,41,0.14)] backdrop-blur-sm',
          tone === 'save'
            ? 'border-[var(--color-accent)] bg-white/76 text-[var(--color-accent)]'
            : 'border-[#6B7280] bg-white/76 text-[#4B5563]',
          rotation
        )}
        initial={{ opacity, scale: opacity > 0 ? 1 : 0.92 }}
        animate={{ opacity, scale: opacity > 0 ? 1 : 0.92 }}
        transition={{ duration: 0.08 }}
      >
        {label}
      </motion.div>
    </div>
  );
}
