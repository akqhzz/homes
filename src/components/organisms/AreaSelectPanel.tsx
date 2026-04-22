'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Footprints, Layers, Pencil, RotateCcw, Satellite, Store, Train } from 'lucide-react';
import { Neighborhood } from '@/lib/types';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import { cn } from '@/lib/utils/cn';

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

  const handleBack = () => {
    setAreaSelectMode(false);
    onBack();
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        {!isDrawing ? (
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <FloatingActionButton onClick={handleBack} aria-label="Back" size="md">
              <ArrowLeft size={19} strokeWidth={2.4} />
            </FloatingActionButton>
            <div className="pointer-events-auto rounded-full bg-[#0F1729] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)]">
              <button onClick={onApply}>{MOCK_LISTINGS.length} listings</button>
            </div>
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
                <p className="font-bold leading-tight">Tap map to draw</p>
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

        {!isDrawing ? (
          <div
            className="absolute bottom-0 right-5 flex flex-col items-end gap-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
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
          <FloatingActionButton
            size="md"
            onClick={onToggleDrawing}
            aria-label="Draw boundary"
            className={cn(isDrawing && 'bg-[#0F1729] text-white hover:bg-[#0F1729]')}
          >
            <Pencil size={18} />
          </FloatingActionButton>
        </div>
        ) : (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pointer-events-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
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
        )}
      </div>

      <AnimatePresence>
        {focusedNeighborhood && (
          <MobileDrawer
            key={focusedNeighborhood.id}
            title={focusedNeighborhood.name}
            onClose={onCloseNeighborhood}
            heightClassName="h-[52dvh]"
            contentClassName="px-4 pb-4"
            footer={(
              <Button
                onClick={() => onToggleNeighborhood(focusedNeighborhood.id)}
                fullWidth
                variant={selectedNeighborhoods.has(focusedNeighborhood.id) ? 'primary' : 'secondary'}
              >
                {selectedNeighborhoods.has(focusedNeighborhood.id) && <Check size={15} />}
                {selectedNeighborhoods.has(focusedNeighborhood.id) ? 'Included' : 'Include neighborhood'}
              </Button>
            )}
          >
            <div className="flex gap-3">
              <img
                src={focusedNeighborhood.thumbnail}
                alt={focusedNeighborhood.name}
                className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0F1729]">
                  {focusedNeighborhood.listingCount} listings · {formatAvgPrice(focusedNeighborhood.avgPrice)}
                </p>
                <p className="mt-2 flex gap-4 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><Footprints size={12} />Walk {focusedNeighborhood.walkScore}</span>
                  <span className="flex items-center gap-1"><Train size={12} />Transit {focusedNeighborhood.transitScore}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
                  {focusedNeighborhood.description}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6B7280]">
                  <span className="rounded-xl bg-[#F5F6F7] px-3 py-2">Avg. {formatAvgPrice(focusedNeighborhood.avgPrice)}</span>
                  <span className="rounded-xl bg-[#F5F6F7] px-3 py-2">{focusedNeighborhood.city}</span>
                  <span className="rounded-xl bg-[#F5F6F7] px-3 py-2">Low noise</span>
                  <span className="rounded-xl bg-[#F5F6F7] px-3 py-2">Good transit</span>
                </div>
              </div>
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>
    </>
  );
}
