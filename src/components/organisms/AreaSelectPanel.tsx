'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Layers, Pencil, RotateCcw, Satellite, Store } from 'lucide-react';
import { Neighborhood } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import { cn } from '@/lib/utils/cn';

const NEIGHBORHOOD_CARD_WIDTH = 264;
const NEIGHBORHOOD_CARD_GAP = 10;

interface AreaSelectPanelProps {
  focusedNeighborhood: Neighborhood | null;
  selectedNeighborhoods: Set<string>;
  isDrawing: boolean;
  isSatelliteMode: boolean;
  showAmenities: boolean;
  pointCount: number;
  onBack: () => void;
  onApply: () => void;
  onToggleDrawing: () => void;
  onCancelDrawing: () => void;
  onToggleSatellite: () => void;
  onToggleAmenities: () => void;
  onToggleNeighborhood: (id: string) => void;
  onCloseNeighborhood: () => void;
  onClearDrawing: () => void;
}

export default function AreaSelectPanel({
  focusedNeighborhood,
  selectedNeighborhoods,
  isDrawing,
  isSatelliteMode,
  showAmenities,
  pointCount,
  onBack,
  onApply,
  onToggleDrawing,
  onCancelDrawing,
  onToggleSatellite,
  onToggleAmenities,
  onToggleNeighborhood,
  onCloseNeighborhood,
  onClearDrawing,
}: AreaSelectPanelProps) {
  const setAreaSelectMode = useUIStore((s) => s.setAreaSelectMode);
  const [showLayerOptions, setShowLayerOptions] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    setAreaSelectMode(false);
    onBack();
  };

  useLayoutEffect(() => {
    if (!focusedNeighborhood || !carouselRef.current) return;
    const index = MOCK_NEIGHBORHOODS.findIndex((nbh) => nbh.id === focusedNeighborhood.id);
    if (index === -1) return;
    const containerWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: Math.max(0, index * (NEIGHBORHOOD_CARD_WIDTH + NEIGHBORHOOD_CARD_GAP) - (containerWidth - NEIGHBORHOOD_CARD_WIDTH) / 2),
      behavior: 'smooth',
    });
  }, [focusedNeighborhood]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        {!isDrawing ? (
          <div className="absolute left-4 right-4 top-4 flex items-center gap-2">
            <div className="pointer-events-auto min-w-0 flex-1 rounded-full bg-white px-3 py-2.5 text-sm text-[#0F1729] shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">Choose your search area</p>
                  <p className="truncate text-xs text-[#6B7280]">Tap neighborhoods or draw a custom boundary</p>
                </div>
              </div>
            </div>
            <button
              onClick={onApply}
              className="pointer-events-auto h-[52px] rounded-full bg-[#0F1729] px-5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)]"
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
      </div>

      <AnimatePresence>
        {focusedNeighborhood && (
          <motion.div
            key={focusedNeighborhood.id}
            initial={{ y: 26, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 26, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 150, damping: 26, mass: 0.42 }}
            className="pointer-events-none absolute inset-x-0 bottom-[82px] z-40 lg:hidden"
          >
            <div
              ref={carouselRef}
              className="pointer-events-auto flex gap-2.5 overflow-x-auto py-2 scrollbar-hide"
              style={{
                scrollSnapType: 'x proximity',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                touchAction: 'pan-x',
                paddingLeft: 'calc(50% - 132px)',
                paddingRight: 'calc(50% - 132px)',
              }}
            >
              {MOCK_NEIGHBORHOODS.map((neighborhood) => {
                const included = selectedNeighborhoods.has(neighborhood.id);
                const active = neighborhood.id === focusedNeighborhood.id;
                return (
                  <motion.article
                    key={neighborhood.id}
                    animate={{ scale: active ? 1 : 0.94 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 25, mass: 0.35 }}
                    className="flex h-[104px] w-[264px] shrink-0 gap-2 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-[0_8px_24px_rgba(15,23,41,0.14)]"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <img src={neighborhood.thumbnail} alt="" className="h-full w-[92px] shrink-0 rounded-xl object-cover" draggable={false} />
                    <div className="flex min-w-0 flex-1 flex-col py-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1729]">{neighborhood.name}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-[#6B7280] line-clamp-2">
                          {neighborhood.listingCount} listings · Avg. {formatAvgPrice(neighborhood.avgPrice)}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-[#9CA3AF] line-clamp-2">
                          {neighborhood.description}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleNeighborhood(neighborhood.id)}
                        className={cn(
                          'mt-1 h-7 rounded-full px-3 text-xs font-semibold transition-colors',
                          included ? 'bg-[#0F1729] text-white' : 'bg-[#F5F6F7] text-[#0F1729]'
                        )}
                      >
                        {included ? 'Included' : 'Include'}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
              <button
                onClick={onCloseNeighborhood}
                className="my-auto h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#6B7280] shadow-[0_4px_16px_rgba(15,23,41,0.12)]"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
