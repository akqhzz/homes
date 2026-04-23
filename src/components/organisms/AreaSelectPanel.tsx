'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Pencil, Plus, Redo2, RotateCcw, Undo2, X } from 'lucide-react';
import { Neighborhood } from '@/lib/types';
import { MOCK_LISTINGS, MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import { cn } from '@/lib/utils/cn';

const CARD_WIDTH = 312;
const CARD_GAP = 10;
const SWIPE_THRESHOLD = 34;
const AREA_NEIGHBORHOODS = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhood.id !== 'nbh-king-west');

interface AreaSelectPanelProps {
  focusedNeighborhood: Neighborhood | null;
  focusToken?: number;
  selectedNeighborhoods: Set<string>;
  isDrawing: boolean;
  pointCount: number;
  canUndoBoundary: boolean;
  canRedoBoundary: boolean;
  onBack: () => void;
  onApply: () => void;
  onToggleDrawing: () => void;
  onCancelDrawing: () => void;
  onToggleNeighborhood: (id: string) => void;
  onFocusNeighborhood: (neighborhood: Neighborhood) => void;
  onCloseNeighborhood: () => void;
  onClearDrawing: () => void;
  onUndoBoundary: () => void;
  onRedoBoundary: () => void;
  onClearSelection: () => void;
}

export default function AreaSelectPanel({
  focusedNeighborhood,
  focusToken = 0,
  selectedNeighborhoods,
  isDrawing,
  pointCount,
  canUndoBoundary,
  canRedoBoundary,
  onBack,
  onApply,
  onToggleDrawing,
  onCancelDrawing,
  onToggleNeighborhood,
  onFocusNeighborhood,
  onCloseNeighborhood,
  onClearDrawing,
  onUndoBoundary,
  onRedoBoundary,
  onClearSelection,
}: AreaSelectPanelProps) {
  const setAreaSelectMode = useUIStore((s) => s.setAreaSelectMode);
  const [viewportWidth, setViewportWidth] = useState(390);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instantMove, setInstantMove] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);

  const selectedCount = selectedNeighborhoods.size;
  const hasSelection = selectedCount > 0 || pointCount > 0;
  const focusedIndex = focusedNeighborhood
    ? AREA_NEIGHBORHOODS.findIndex((neighborhood) => neighborhood.id === focusedNeighborhood.id)
    : -1;
  const carouselIndex = focusedIndex >= 0 ? focusedIndex : currentIndex;
  const title = hasSelection
    ? selectedCount > 0
      ? `${selectedCount} area${selectedCount === 1 ? '' : 's'} · ${selectedNeighborhoodCount(selectedNeighborhoods)} listings`
      : `${MOCK_LISTINGS.length} listings`
    : 'Choose your area';

  const handleBack = () => {
    setAreaSelectMode(false);
    onBack();
  };

  useLayoutEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useLayoutEffect(() => {
    if (!focusedNeighborhood) return;
    const index = AREA_NEIGHBORHOODS.findIndex((nbh) => nbh.id === focusedNeighborhood.id);
    if (index >= 0) {
      const frame = requestAnimationFrame(() => {
        setInstantMove(true);
        setCurrentIndex(index);
        window.setTimeout(() => setInstantMove(false), 180);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [focusedNeighborhood, focusToken]);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node || !focusedNeighborhood) return;
    const handleTouchStart = () => {
      wheelLockRef.current = false;
    };
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    node.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    node.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    const previousHtmlOverscrollX = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscrollX = document.body.style.overscrollBehaviorX;
    const previousHtmlTouchAction = document.documentElement.style.touchAction;
    const previousBodyTouchAction = document.body.style.touchAction;
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.touchAction = 'pan-y';
    document.body.style.touchAction = 'pan-y';

    const handleDocumentTouchMove = (event: TouchEvent) => {
      const target = event.target as Node | null;
      if (target && node.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false, capture: true });
    return () => {
      node.removeEventListener('touchstart', handleTouchStart, { capture: true });
      node.removeEventListener('touchmove', handleTouchMove, { capture: true });
      node.removeEventListener('wheel', handleWheel, { capture: true });
      document.removeEventListener('touchmove', handleDocumentTouchMove, { capture: true });
      document.documentElement.style.overscrollBehaviorX = previousHtmlOverscrollX;
      document.body.style.overscrollBehaviorX = previousBodyOverscrollX;
      document.documentElement.style.touchAction = previousHtmlTouchAction;
      document.body.style.touchAction = previousBodyTouchAction;
    };
  }, [focusedNeighborhood]);

  const goToNeighborhood = (index: number) => {
    const nextIndex = Math.max(0, Math.min(AREA_NEIGHBORHOODS.length - 1, index));
    setInstantMove(false);
    setCurrentIndex(nextIndex);
    onFocusNeighborhood(AREA_NEIGHBORHOODS[nextIndex]);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dy > 36 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      setInstantMove(true);
      onCloseNeighborhood();
      return;
    }
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    goToNeighborhood(currentIndex + (dx < 0 ? 1 : -1));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) event.preventDefault();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 18) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    goToNeighborhood(currentIndex + (event.deltaX > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 320);
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        {!isDrawing ? (
          <div className="absolute left-4 right-4 top-4 flex items-center gap-2 lg:block">
            <div className="pointer-events-auto flex h-11 min-w-0 flex-1 items-center rounded-full bg-white/70 px-2.5 text-sm text-[#0F1729] backdrop-blur-xl lg:w-[340px] lg:flex-none">
              <div className="flex w-full items-center gap-2.5">
                <button
                  onClick={handleBack}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <p className="min-w-0 flex-1 truncate type-body leading-tight">{title}</p>
              </div>
            </div>
            <button
              onClick={onApply}
              className="pointer-events-auto h-11 rounded-full bg-[#0F1729]/92 px-4 type-label text-white backdrop-blur-xl transition-colors hover:bg-[#0F1729] lg:absolute lg:right-0 lg:top-0"
            >
              Done
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-4 right-4 top-4 rounded-full bg-white px-4 py-2.5 text-sm text-[#0F1729] shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <Pencil size={15} />
              <div className="min-w-0 flex-1">
                <p className="type-label leading-tight">Tap map to draw</p>
                <p className="type-caption text-[#6B7280]">{pointCount} point{pointCount === 1 ? '' : 's'} placed</p>
              </div>
              {pointCount > 0 && (
                <button onClick={onClearDrawing} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {!isDrawing && !focusedNeighborhood ? (
          <div
            className="absolute bottom-0 right-5 flex flex-col items-end gap-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <FloatingActionButton size="md" onClick={onToggleDrawing} aria-label="Draw boundary">
              <Pencil size={18} />
            </FloatingActionButton>
          </div>
        ) : isDrawing ? (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pointer-events-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <Button variant="secondary" size="md" onClick={onCancelDrawing}>
              Cancel
            </Button>
            <FloatingActionButton
              size="md"
              onClick={onToggleDrawing}
              aria-label="Done drawing"
              className="bg-[#0F1729] text-white hover:bg-[#0F1729]"
            >
              <Check size={18} />
            </FloatingActionButton>
          </div>
        ) : null}

        {hasSelection && !isDrawing && !focusedNeighborhood && (
          <div
            className="absolute bottom-0 left-5 flex items-center gap-2 pointer-events-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <button onClick={onUndoBoundary} disabled={!canUndoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
              <Undo2 size={15} />
            </button>
            <button onClick={onRedoBoundary} disabled={!canRedoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
              <Redo2 size={15} />
            </button>
            <button onClick={onClearSelection} className="flex h-9 items-center justify-center rounded-full bg-white px-3 type-label text-[#0F1729] shadow-[var(--shadow-control)]">
              Clear
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {focusedNeighborhood && (
          <>
          <motion.div
            ref={carouselRef}
            key="neighborhood-carousel"
            initial={{ y: 26, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 26, opacity: 0, scale: 0.98 }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 overflow-visible pt-3 lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)', touchAction: 'none', overscrollBehavior: 'none' }}
          >
            <motion.div
              key={`area-track-${focusToken}`}
              className="pointer-events-auto flex overflow-visible"
              initial={false}
              animate={{ x: Math.max(0, (viewportWidth - CARD_WIDTH) / 2) - carouselIndex * (CARD_WIDTH + CARD_GAP) }}
              transition={instantMove || carouselIndex !== currentIndex ? { duration: 0 } : { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ gap: CARD_GAP, touchAction: 'none', willChange: 'transform' }}
              onPointerDownCapture={handlePointerDown}
              onPointerUpCapture={handlePointerUp}
              onPointerCancelCapture={() => { dragStartRef.current = null; }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => { touchStartRef.current = null; }}
              onWheel={handleWheel}
            >
              {AREA_NEIGHBORHOODS.map((neighborhood) => {
                const included = selectedNeighborhoods.has(neighborhood.id);
                return (
                  <article
                    key={neighborhood.id}
                    className="flex h-[152px] w-[312px] shrink-0 gap-2 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-[0_10px_30px_rgba(15,23,41,0.18)]"
                  >
                    <Image src={neighborhood.thumbnail} alt="" width={104} height={136} className="h-full w-[104px] shrink-0 rounded-xl object-cover" draggable={false} />
                    <div className="flex min-w-0 flex-1 flex-col py-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-label text-[#0F1729]">{neighborhood.name}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 type-micro text-[#6B7280]">{neighborhood.listingCount} listings</span>
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 type-micro text-[#6B7280]">{formatAvgPrice(neighborhood.avgPrice)}</span>
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 type-micro text-[#6B7280]">Walk {neighborhood.walkScore}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleNeighborhood(neighborhood.id)}
                        className={cn(
                          'mt-2 flex h-9 w-[92px] items-center justify-center gap-1.5 self-end rounded-full px-3 type-caption font-semibold transition-colors',
                          included ? 'bg-[#0F1729] text-white' : 'bg-[#F5F6F7] text-[#0F1729]'
                        )}
                      >
                        {included ? <Check size={13} /> : <Plus size={13} />}
                        {included ? 'Included' : 'Include'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </motion.div>
          <motion.div
            key="desktop-neighborhood-card"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-1/2 z-40 hidden w-[420px] -translate-x-1/2 gap-3 overflow-hidden rounded-2xl bg-white p-3 text-left shadow-[0_12px_34px_rgba(15,23,41,0.18)] lg:flex"
          >
            <Image src={focusedNeighborhood.thumbnail} alt="" width={128} height={112} className="h-28 w-32 shrink-0 rounded-xl object-cover" draggable={false} />
            <div className="flex min-w-0 flex-1 flex-col">
              <button
                onClick={onCloseNeighborhood}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
                aria-label="Close neighborhood card"
              >
                <X size={14} />
              </button>
              <p className="truncate type-body-lg font-semibold text-[#0F1729]">{focusedNeighborhood.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#F5F6F7] px-2 py-1 type-fine text-[#6B7280]">{focusedNeighborhood.listingCount} listings</span>
                <span className="rounded-full bg-[#F5F6F7] px-2 py-1 type-fine text-[#6B7280]">{formatAvgPrice(focusedNeighborhood.avgPrice)}</span>
                <span className="rounded-full bg-[#F5F6F7] px-2 py-1 type-fine text-[#6B7280]">Walk {focusedNeighborhood.walkScore}</span>
              </div>
              <button
                onClick={() => onToggleNeighborhood(focusedNeighborhood.id)}
                className={cn(
                  'mt-auto flex h-10 items-center justify-center gap-1.5 rounded-full px-4 type-label transition-colors',
                  selectedNeighborhoods.has(focusedNeighborhood.id) ? 'bg-[#0F1729] text-white' : 'bg-[#F5F6F7] text-[#0F1729]'
                )}
              >
                {selectedNeighborhoods.has(focusedNeighborhood.id) ? <Check size={14} /> : <Plus size={14} />}
                {selectedNeighborhoods.has(focusedNeighborhood.id) ? 'Included' : 'Include'}
              </button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function selectedNeighborhoodCount(selectedNeighborhoods: Set<string>) {
  return AREA_NEIGHBORHOODS.reduce((total, neighborhood) => {
    if (!selectedNeighborhoods.has(neighborhood.id)) return total;
    return total + neighborhood.listingCount;
  }, 0);
}
