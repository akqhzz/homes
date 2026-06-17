'use client';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Listing } from '@/lib/types';
import { formatDaysOnMarket } from '@/lib/utils/format';
import { formatBedBathSqftLine, formatMlsLine } from '@/lib/utils/listing-display';
import { useSavedStore } from '@/store/savedStore';
import { useListingSave } from '@/features/listings/hooks/useListingSave';
import { useQuickSaveCollection } from '@/features/collections/hooks/useQuickSaveCollection';
import { describeListingSave, getListingCollectionIds } from '@/features/collections/lib/collectionActions';
import { cn } from '@/lib/utils/cn';
import SaveToCollectionSheet from '@/features/collections/components/SaveToCollectionSheet';
import QuickSavePrompt, { type QuickSavePromptPlacement } from '@/features/listings/components/QuickSavePrompt';
import { useSavePromptView } from '@/features/listings/components/SavePromptPlacementContext';
import { ListingAddressRow } from '@/features/listings/components/ListingParts';
import PriceText from '@/features/listings/components/PriceText';
import Button from '@/components/ui/Button';
import HeartDelight from '@/components/ui/HeartDelight';
import SoldListingBadge from '@/features/listings/components/SoldListingBadge';
import ListingFeatureBadge from '@/features/listings/components/ListingFeatureBadge';

const CAROUSEL_IMAGE_HEIGHT = 174;
const CAROUSEL_TOTAL_HEIGHT = 252;
const IMAGE_SWIPE_THRESHOLD = 24;
const CARD_IMAGE_COUNT = 7;
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
  desktopTall?: boolean;
  imageTouchMode?: 'locked' | 'vertical-scroll';
  contentTouchMode?: 'locked' | 'vertical-scroll';
  /** On desktop, let swipes/scrolls over the image bubble to a horizontal
   *  carousel instead of changing the card's photo. */
  carouselScrollPriority?: boolean;
  topRightSlot?: ReactNode;
  likedOverride?: boolean;
  onLikeToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSavedToCollection?: (collectionId: string) => void;
  onOpenListing?: () => void;
  excludedCollectionIds?: string[];
  showSoldBadge?: boolean;
  carouselWidth?: number;
  carouselImageHeight?: number;
  carouselTotalHeight?: number;
}

export default function ListingCard({
  listing,
  variant = 'carousel',
  className,
  desktopTall = false,
  imageTouchMode = 'locked',
  contentTouchMode = 'locked',
  carouselScrollPriority = false,
  topRightSlot,
  likedOverride,
  onLikeToggle,
  onSavedToCollection,
  onOpenListing,
  excludedCollectionIds,
  showSoldBadge = true,
  carouselWidth,
  carouselImageHeight: carouselImageHeightOverride,
  carouselTotalHeight: carouselTotalHeightOverride,
}: ListingCardProps) {
  const displayImages = getCardImages(listing.images);
  const [imgIndex, setImgIndex] = useState(0);
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [saveAnchorRect, setSaveAnchorRect] = useState<DOMRect | null>(null);
  const [savePickerPlacement, setSavePickerPlacement] = useState<'above' | 'below'>('below');
  const [quickSavePrompt, setQuickSavePrompt] = useState<{ collectionName: string; extraCount: number } | null>(null);
  const [heartDelightKey, setHeartDelightKey] = useState(0);
  const router = useRouter();
  const { isSaved, unsave } = useListingSave(listing.id);
  const saveListing = useSavedStore((state) => state.saveListing);
  const addToCollection = useSavedStore((state) => state.addToCollection);
  const { quickSaveCollections, rememberCollections } = useQuickSaveCollection();
  const savePromptView = useSavePromptView();
  const [isDesktop, setIsDesktop] = useState(false);
  const imagePointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const imagePointerMoved = useRef(false);
  const imageTouchStart = useRef<{ x: number; y: number } | null>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const wheelLockRef = useRef(false);
  const carouselImageHeight = carouselImageHeightOverride ?? (desktopTall ? 186 : CAROUSEL_IMAGE_HEIGHT);
  const carouselTotalHeight = carouselTotalHeightOverride ?? (desktopTall ? 264 : CAROUSEL_TOTAL_HEIGHT);
  const resolvedLiked = likedOverride ?? isSaved;

  const getContainerWidth = useCallback(() => imageAreaRef.current?.offsetWidth ?? 288, []);

  // Animate the strip to the committed index. Runs after every index change (including initial mount
  // where from=to=0, so no visible animation occurs).
  useEffect(() => {
    if (!stripRef.current) return;
    const w = getContainerWidth();
    stripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    stripRef.current.style.transform = `translateX(${-imgIndex * w}px)`;
  }, [imgIndex, getContainerWidth]);

  useEffect(() => {
    const node = imageAreaRef.current;
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

  const showNextImage = () => {
    setImgIndex((index) => Math.min(index + 1, displayImages.length - 1));
  };

  const showPreviousImage = () => {
    setImgIndex((index) => Math.max(index - 1, 0));
  };

  // When the parent carousel should win on desktop, let wheel/drag bubble.
  const passThrough = carouselScrollPriority && isDesktop;

  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (passThrough) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 18) return;
    e.preventDefault();
    e.stopPropagation();
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (e.deltaX > 0) showNextImage();
    else showPreviousImage();
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (passThrough) return;
    e.stopPropagation();
    imagePointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    imagePointerMoved.current = false;
    // Freeze strip at current animated position so mid-animation grabs feel natural
    if (stripRef.current) {
      const computed = getComputedStyle(stripRef.current).transform;
      stripRef.current.style.transition = 'none';
      stripRef.current.style.transform = computed !== 'none' ? computed : `translateX(${-imgIndex * getContainerWidth()}px)`;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleImageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    imageTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleImageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = imageTouchStart.current;
    if (!start) return;
    const touch = e.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) e.preventDefault();
  };

  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = imagePointerStart.current;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      imagePointerMoved.current = true;
    }
    // Real-time strip drag — only track dominant horizontal movement
    if (!stripRef.current || displayImages.length <= 1) return;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) return;
    const w = getContainerWidth();
    // Rubber-band resistance at first/last image edges
    let constrainedDx = dx;
    if (imgIndex === 0 && dx > 0) {
      constrainedDx = Math.pow(Math.abs(dx), 0.65) * Math.sign(dx);
    } else if (imgIndex === displayImages.length - 1 && dx < 0) {
      constrainedDx = -Math.pow(Math.abs(dx), 0.65);
    }
    stripRef.current.style.transition = 'none';
    stripRef.current.style.transform = `translateX(${-imgIndex * w + constrainedDx}px)`;
  };

  const handleImagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = imagePointerStart.current;
    if (!start || start.id !== e.pointerId) return;
    imagePointerStart.current = null;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const w = getContainerWidth();
    const isHorizontal = Math.abs(dx) >= Math.abs(dy);
    const pastThreshold = Math.abs(dx) >= IMAGE_SWIPE_THRESHOLD;

    if (!isHorizontal || !pastThreshold) {
      // Spring back to current index with ease-out
      if (stripRef.current) {
        stripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        stripRef.current.style.transform = `translateX(${-imgIndex * w}px)`;
      }
      return;
    }

    if (dx < 0 && imgIndex < displayImages.length - 1) {
      setImgIndex(imgIndex + 1); // useEffect drives the snap animation from drag position
    } else if (dx > 0 && imgIndex > 0) {
      setImgIndex(imgIndex - 1);
    } else {
      // At first/last boundary — spring back
      if (stripRef.current) {
        stripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        stripRef.current.style.transform = `translateX(${-imgIndex * w}px)`;
      }
    }
  };

  // Rebuild the confirmation from current memberships so it stays accurate as
  // collections are checked and unchecked. Dismisses when in no collection.
  const refreshQuickSavePrompt = useCallback((preferredCollectionId?: string) => {
    setQuickSavePrompt(describeListingSave(useSavedStore.getState().collections, listing.id, preferredCollectionId));
  }, [listing.id]);

  // Auto-dismiss the confirmation, but keep it visible while the change picker
  // is open — mirrors card mode.
  useEffect(() => {
    if (!quickSavePrompt || showSavePicker) return;
    const timer = window.setTimeout(() => setQuickSavePrompt(null), 2600);
    return () => window.clearTimeout(timer);
  }, [quickSavePrompt, showSavePicker]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Desktop anchors the toast bottom center; mobile keeps it top center, dropping
  // below the toolbar in map views so it doesn't collide with the top controls.
  const savePromptPlacement: QuickSavePromptPlacement = isDesktop
    ? 'bottom'
    : savePromptView === 'map'
      ? 'top-below-toolbar'
      : 'top';

  const handleSaveClick = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (event && onLikeToggle && resolvedLiked) {
      onLikeToggle(event as React.MouseEvent<HTMLButtonElement>);
      return;
    }
    if (event?.currentTarget instanceof HTMLElement) {
      setSaveAnchorRect(event.currentTarget.getBoundingClientRect());
    }
    if (resolvedLiked) {
      unsave();
      setQuickSavePrompt(null);
      return;
    }
    // Quick-save to the same collection(s) the user last saved to, then confirm
    // with a prompt that lets them change collection — mirrors card mode.
    if (quickSaveCollections.length === 0) {
      setSavePickerPlacement('below');
      setShowSavePicker(true);
      return;
    }
    saveListing(listing.id);
    quickSaveCollections.forEach((collection) => addToCollection(collection.id, listing.id));
    const headline = quickSaveCollections[quickSaveCollections.length - 1];
    quickSaveCollections.forEach((collection) => onSavedToCollection?.(collection.id));
    setHeartDelightKey((key) => key + 1);
    refreshQuickSavePrompt(headline.id);
  };

  const saveSheet = showSavePicker ? (
    <SaveToCollectionSheet
      listingId={listing.id}
      onClose={() => setShowSavePicker(false)}
      onSaved={(collectionId) => {
        setHeartDelightKey((key) => key + 1);
        rememberCollections(getListingCollectionIds(useSavedStore.getState().collections, listing.id));
        onSavedToCollection?.(collectionId);
        refreshQuickSavePrompt(collectionId);
      }}
      onRemoved={() => {
        const memberIds = getListingCollectionIds(useSavedStore.getState().collections, listing.id);
        if (memberIds.length > 0) rememberCollections(memberIds);
        refreshQuickSavePrompt();
      }}
      anchorRect={saveAnchorRect}
      placement={savePickerPlacement}
      excludedCollectionIds={excludedCollectionIds}
    />
  ) : null;

  const savePrompt =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {quickSavePrompt && (
              <QuickSavePrompt
                collectionName={quickSavePrompt.collectionName}
                extraCount={quickSavePrompt.extraCount}
                placement={savePromptPlacement}
                onChangeCollection={() => {
                  // Open the picker anchored above the prompt, leaving the prompt
                  // in place — like card mode.
                  const promptRect =
                    typeof document === 'undefined'
                      ? null
                      : document.querySelector('[data-quick-save-prompt="true"]')?.getBoundingClientRect() ?? null;
                  setSaveAnchorRect(promptRect);
                  setSavePickerPlacement('above');
                  setShowSavePicker(true);
                }}
              />
            )}
          </AnimatePresence>,
          document.body
        );

  const openListingPage = () => {
    onOpenListing?.();
    router.push(`/listings/${listing.id}`);
  };
  const mlsLine = formatMlsLine(listing.mlsNumber, listing.brokerage);
  const isSold = listing.listingStatus === 'sold';

  if (variant === 'grid') {
    return (
      <>
        <div
          className={cn('flex flex-col gap-2 text-left no-select w-full', className)}
          onClick={openListingPage}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openListingPage();
          }}
        >
          <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-[var(--color-surface)]">
          <ListingImage src={displayImages[0]} alt={listing.address} fallbackIndex={0} className="w-full h-full object-cover" />
            <ListingFeatureBadge listing={listing} />
            {showSoldBadge && isSold && <SoldListingBadge />}
            <Button
              variant="overlay"
              shape="circle"
              size="xs"
              className="absolute right-2.5 top-2.5"
              onClick={handleSaveClick}
              aria-label={resolvedLiked ? 'Unsave listing' : 'Save listing'}
            >
              <HeartDelight activeKey={heartDelightKey}>
                <Heart
                  size={13}
                  className={cn(resolvedLiked ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]')}
                />
              </HeartDelight>
            </Button>
          </div>
          <div className="px-0.5 pb-1">
            <p className="card-price type-body-lg leading-tight text-[var(--color-text-primary)]"><PriceText price={listing.price} format="full" /></p>
            <p className="mt-0.5 type-body text-[var(--color-text-primary)]">{formatBedBathSqftLine(listing.beds, listing.baths, listing.sqft, { separator: '   ', spacedSqft: false })}</p>
          </div>
        </div>
        {saveSheet}
        {savePrompt}
      </>
    );
  }

  if (variant === 'full') {
    return (
      <>
        <div className={cn('flex flex-col bg-white rounded-[24px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.06)]', className)}>
          <div className="relative aspect-video overflow-hidden bg-[var(--color-surface)]">
            <ListingImage src={displayImages[0]} alt="" fallbackIndex={0} className="w-full h-full object-cover" />
            <ListingFeatureBadge listing={listing} />
            {showSoldBadge && isSold && <SoldListingBadge />}
            <Button
              variant="overlay"
              shape="circle"
              size="sm"
              className="absolute right-3 top-3"
              onClick={handleSaveClick}
              aria-label={resolvedLiked ? 'Unsave listing' : 'Save listing'}
            >
              <HeartDelight activeKey={heartDelightKey}>
                <Heart size={14} className={cn(resolvedLiked ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]')} />
              </HeartDelight>
            </Button>
          </div>
          <div className="p-4">
            <p className="card-price type-heading text-[var(--color-text-primary)]"><PriceText price={listing.price} format="full" /></p>
            <div className="mt-1 flex flex-col gap-[1px]">
              <p className="type-body text-[var(--color-text-primary)]">{formatBedBathSqftLine(listing.beds, listing.baths, listing.sqft)}</p>
              <ListingAddressRow className="gap-1 type-caption text-[var(--color-text-secondary)]" iconSize={11}>
                {listing.address}
              </ListingAddressRow>
              <p className="type-micro mt-1 uppercase leading-[1.15] tracking-[0.02em] text-[#A6ADB8]">{mlsLine}</p>
            </div>
          </div>
        </div>
        {saveSheet}
        {savePrompt}
      </>
    );
  }

  // Carousel variant — fixed height, image scrolls vertically, info is static
  return (
    <>
      <div
        className={cn(
          carouselWidth
            ? 'group relative flex shrink-0 flex-col rounded-[24px] bg-white no-select overflow-hidden'
            : 'group relative flex w-72 shrink-0 flex-col rounded-[24px] bg-white no-select overflow-hidden',
          'shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]',
          className
        )}
        style={{ minHeight: carouselTotalHeight, width: carouselWidth }}
      >
        {/* Image strip: swiping here changes photos instead of moving the carousel. */}
        <div
          ref={imageAreaRef}
          data-card-image="true"
          className="relative overflow-hidden bg-[var(--color-surface)]"
          style={{
            height: carouselImageHeight,
            touchAction: passThrough ? 'pan-x pan-y' : imageTouchMode === 'vertical-scroll' ? 'pan-y pinch-zoom' : 'none',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (imagePointerMoved.current) {
              imagePointerMoved.current = false;
              return;
            }
            openListingPage();
          }}
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onPointerDown={handleImagePointerDown}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={() => {
            imagePointerStart.current = null;
            if (stripRef.current) {
              const w = getContainerWidth();
              stripRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              stripRef.current.style.transform = `translateX(${-imgIndex * w}px)`;
            }
          }}
          onWheel={handleImageWheel}
        >
          <ListingFeatureBadge listing={listing} />
          {showSoldBadge && isSold && <SoldListingBadge />}
          {/* Horizontal strip — all images laid out side-by-side; translateX drives the slide */}
          <div
            ref={stripRef}
            className="flex h-full"
            style={{ width: `${displayImages.length * 100}%`, willChange: 'transform' }}
          >
            {displayImages.map((src, i) => (
              <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / displayImages.length}%` }}>
                <ListingImage src={src} alt="" fallbackIndex={i} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Image dots */}
          {displayImages.length > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1">
              {getVisibleDotIndexes(displayImages.length, imgIndex).map((i) => (
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
        </div>

        {displayImages.length > 1 && (
          <div
            className="pointer-events-none absolute inset-x-3 z-20 hidden -translate-y-1/2 items-center justify-between opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 lg:flex"
            style={{ top: carouselImageHeight / 2 }}
          >
            {imgIndex > 0 ? (
              <Button
                variant="overlay"
                shape="circle"
                size="xs"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
              >
                <ChevronLeft size={14} />
              </Button>
            ) : <span />}
            {imgIndex < displayImages.length - 1 ? (
              <Button
                variant="overlay"
                shape="circle"
                size="xs"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
              >
                <ChevronRight size={14} />
              </Button>
            ) : <span />}
          </div>
        )}

        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          {topRightSlot}
          <Button
            variant="overlay"
            shape="circle"
            size="sm"
            onClick={handleSaveClick}
            aria-label={resolvedLiked ? 'Unsave listing' : 'Save listing'}
          >
            <HeartDelight activeKey={heartDelightKey}>
              <Heart
                size={14}
                className={cn(resolvedLiked ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]')}
              />
            </HeartDelight>
          </Button>
        </div>

        {/* Info — static, touching this area lets horizontal carousel scroll */}
        <button
          className="block min-h-[78px] bg-white px-3.5 pb-4 pt-2 text-left"
          style={{ touchAction: contentTouchMode === 'vertical-scroll' ? 'pan-y pinch-zoom' : 'pan-x' }}
          onClick={openListingPage}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="card-price type-body-lg text-[var(--color-text-primary)]"><PriceText price={listing.price} format="full" /></p>
              <div className="mt-0.5 flex flex-col gap-[1px]">
                <p className="truncate type-body text-[var(--color-text-primary)]">{formatBedBathSqftLine(listing.beds, listing.baths, listing.sqft, { separator: '\u00a0\u00a0', spacedSqft: false })}</p>
                <p className="pr-2 type-caption text-[var(--color-text-secondary)] line-clamp-2">
                  {listing.address}
                </p>
                <p className="type-micro mt-1 pr-2 uppercase leading-[1.15] tracking-[0.02em] text-[#A6ADB8] line-clamp-1">
                  {mlsLine}
                </p>
              </div>
            </div>
            <span className="mt-0.5 shrink-0 type-caption text-[var(--color-text-tertiary)]">
              {formatDaysOnMarket(listing.daysOnMarket)}
            </span>
          </div>
        </button>
      </div>
      {saveSheet}
        {savePrompt}
    </>
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
    <Image
      src={failedSrc === src ? fallbackSrc : src}
      alt={alt}
      width={900}
      height={675}
      className={className}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function getCardImages(images: string[]) {
  const available = images.length > 0 ? images : LISTING_IMAGE_FALLBACKS;
  return Array.from({ length: CARD_IMAGE_COUNT }, (_, index) => available[index % available.length] ?? LISTING_IMAGE_FALLBACKS[index % LISTING_IMAGE_FALLBACKS.length]);
}

function getVisibleDotIndexes(total: number, activeIndex: number) {
  if (total <= 4) return Array.from({ length: total }, (_, index) => index);
  const start = Math.min(Math.max(0, activeIndex - 1), total - 4);
  return Array.from({ length: 4 }, (_, index) => start + index);
}
