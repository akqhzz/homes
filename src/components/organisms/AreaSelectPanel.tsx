'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Layers, Pencil, Plus, Redo2, RotateCcw, Satellite, Store, Undo2 } from 'lucide-react';
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
  selectedNeighborhoods: Set<string>;
  isDrawing: boolean;
  isSatelliteMode: boolean;
  showAmenities: boolean;
  pointCount: number;
  canUndoBoundary: boolean;
  canRedoBoundary: boolean;
  onBack: () => void;
  onApply: () => void;
  onToggleDrawing: () => void;
  onCancelDrawing: () => void;
  onToggleSatellite: () => void;
  onToggleAmenities: () => void;
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
  selectedNeighborhoods,
  isDrawing,
  isSatelliteMode,
  showAmenities,
  pointCount,
  canUndoBoundary,
  canRedoBoundary,
  onBack,
  onApply,
  onToggleDrawing,
  onCancelDrawing,
  onToggleSatellite,
  onToggleAmenities,
  onToggleNeighborhood,
  onFocusNeighborhood,
  onCloseNeighborhood,
  onClearDrawing,
  onUndoBoundary,
  onRedoBoundary,
  onClearSelection,
}: AreaSelectPanelProps) {
  const setAreaSelectMode = useUIStore((s) => s.setAreaSelectMode);
  const [showLayerOptions, setShowLayerOptions] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(390);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instantMove, setInstantMove] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);

  const selectedCount = selectedNeighborhoods.size;
  const hasSelection = selectedCount > 0 || pointCount > 0;
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
        requestAnimationFrame(() => setInstantMove(false));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [focusedNeighborhood]);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => node.removeEventListener('touchmove', handleTouchMove);
  }, []);

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
          <div className="absolute left-4 right-4 top-4 flex items-center gap-2">
            <div className="pointer-events-auto flex h-11 min-w-0 flex-1 items-center rounded-full bg-white px-2.5 text-sm text-[#0F1729] shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex w-full items-center gap-2.5">
                <button
                  onClick={handleBack}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <p className="min-w-0 flex-1 truncate font-normal leading-tight">{title}</p>
              </div>
            </div>
            <button
              onClick={onApply}
              className="pointer-events-auto h-11 rounded-full bg-[#0F1729] px-4 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)]"
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
                <p className="font-semibold leading-tight">Tap map to draw</p>
                <p className="text-xs text-[#6B7280]">{pointCount} point{pointCount === 1 ? '' : 's'} placed</p>
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
            <div className="relative pointer-events-auto">
              <AnimatePresence>
                {showLayerOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute bottom-14 right-0 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_6px_18px_rgba(15,23,41,0.16)]"
                  >
                    <button
                      onClick={onToggleSatellite}
                      className={cn(
                        'flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors',
                        isSatelliteMode ? 'bg-[#0F1729] text-white' : 'text-[#0F1729] hover:bg-[#F5F6F7]'
                      )}
                    >
                      <Satellite size={15} />
                      Satellite
                    </button>
                    <button
                      onClick={onToggleAmenities}
                      className={cn(
                        'flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors',
                        showAmenities ? 'bg-[#0F1729] text-white' : 'text-[#0F1729] hover:bg-[#F5F6F7]'
                      )}
                    >
                      <Store size={15} />
                      Amenities
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <FloatingActionButton size="md" onClick={() => setShowLayerOptions((value) => !value)} aria-label="Map layers">
                <Layers size={18} />
              </FloatingActionButton>
            </div>
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
            <button onClick={onClearSelection} className="flex h-9 items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-[#0F1729] shadow-[var(--shadow-control)]">
              Clear
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {focusedNeighborhood && (
          <motion.div
            ref={carouselRef}
            key="neighborhood-carousel"
            initial={{ y: 26, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 26, opacity: 0, scale: 0.98 }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 overflow-visible pt-3 lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <motion.div
              className="pointer-events-auto flex overflow-visible"
              animate={{ x: Math.max(0, (viewportWidth - CARD_WIDTH) / 2) - currentIndex * (CARD_WIDTH + CARD_GAP) }}
              transition={instantMove ? { duration: 0 } : { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ gap: CARD_GAP, touchAction: 'none', willChange: 'transform' }}
              onPointerDownCapture={handlePointerDown}
              onPointerUpCapture={handlePointerUp}
              onPointerCancelCapture={() => { dragStartRef.current = null; }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onWheel={handleWheel}
            >
              {AREA_NEIGHBORHOODS.map((neighborhood) => {
                const included = selectedNeighborhoods.has(neighborhood.id);
                return (
                  <article
                    key={neighborhood.id}
                    className="flex h-[124px] w-[312px] shrink-0 gap-2 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-[0_10px_30px_rgba(15,23,41,0.18)]"
                  >
                    <img src={neighborhood.thumbnail} alt="" className="h-full w-[104px] shrink-0 rounded-xl object-cover" draggable={false} />
                    <div className="flex min-w-0 flex-1 flex-col py-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1729]">{neighborhood.name}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">{neighborhood.listingCount} listings</span>
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">{formatAvgPrice(neighborhood.avgPrice)}</span>
                          <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">Walk {neighborhood.walkScore}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleNeighborhood(neighborhood.id)}
                        className={cn(
                          'mt-2 flex h-11 w-[88px] items-center justify-center gap-1.5 self-end rounded-full px-3 text-xs font-semibold transition-colors',
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
