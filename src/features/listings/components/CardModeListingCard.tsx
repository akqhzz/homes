'use client';
import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDaysOnMarket } from '@/lib/utils/format';
import { getMapboxToken, getStaticMapPreviewUrl } from '@/lib/mapbox';
import MapListingPin from '@/features/listings/components/MapListingPin';
import PriceText from '@/features/listings/components/PriceText';
import {
  FALLBACK_LISTING_IMAGES,
  getCardsModeListingImages,
} from '@/features/listings/lib/cardsModeData';

const MAPBOX_TOKEN = getMapboxToken();
const SWIPE_COMMIT_DISTANCE = 96;
const SWIPE_COMMIT_VELOCITY = 520;
const SWIPE_EXIT_DURATION = 480;
const CARD_MODE_IMAGE_HEIGHT = 305;
const DETAIL_CHIP_CLASS =
  'type-caption pointer-events-auto inline-flex h-7 items-center gap-0.5 rounded-full bg-[var(--color-surface)] px-2.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]';

export type CardSwipeAction = 'pass' | 'save';

interface CardModeListingCardProps {
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
}

export default function CardModeListingCard({
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
}: CardModeListingCardProps) {
  const [dragX, setDragX] = useState(0);
  const images = getCardsModeListingImages(listing);
  const mapPreviewSrc = getStaticMapPreviewUrl(listing.coordinates, MAPBOX_TOKEN);
  const imagePullStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const activeSaveStampOpacity = active ? Math.max(previewAction === 'save' ? 1 : 0, Math.min(1, Math.max(0, dragX / 96))) : 0;
  const activePassStampOpacity = active ? Math.max(previewAction === 'pass' ? 1 : 0, Math.min(1, Math.max(0, -dragX / 96))) : 0;
  const exitX = swipeExitAction === 'save' ? width + 150 : swipeExitAction === 'pass' ? -width - 150 : 0;
  const exitRotate = swipeExitAction === 'save' ? 15 : swipeExitAction === 'pass' ? -15 : 0;
  const cardAnimate = swipeExitAction
    ? { x: exitX, y: 0, rotate: exitRotate, scale: 1, opacity: 1 }
    : active
    ? { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
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
      dragElastic={0.62}
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
            className="h-full overflow-y-auto rounded-[22px] bg-white"
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
