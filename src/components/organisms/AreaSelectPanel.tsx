'use client';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Pencil, Plus, Redo2, Undo2, X } from 'lucide-react';
import { Neighborhood } from '@/lib/types';
import { MOCK_LISTINGS, MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';
import { useUIStore } from '@/store/uiStore';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import { cn } from '@/lib/utils/cn';

const AREA_NEIGHBORHOODS = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhood.id !== 'nbh-king-west');

interface AreaSelectPanelProps {
  focusedNeighborhood: Neighborhood | null;
  focusToken?: number;
  selectedNeighborhoods: Set<string>;
  hasVisibleBoundary?: boolean;
  isDrawing: boolean;
  pointCount: number;
  canUndoBoundary: boolean;
  canRedoBoundary: boolean;
  onBack: () => void;
  onApply: () => void;
  onToggleDrawing: () => void;
  onToggleNeighborhood: (id: string) => void;
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
  hasVisibleBoundary = false,
  isDrawing,
  pointCount,
  canUndoBoundary,
  canRedoBoundary,
  onBack,
  onApply,
  onToggleDrawing,
  onToggleNeighborhood,
  onCloseNeighborhood,
  onClearDrawing,
  onUndoBoundary,
  onRedoBoundary,
  onClearSelection,
}: AreaSelectPanelProps) {
  const setAreaSelectMode = useUIStore((s) => s.setAreaSelectMode);
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
  const desktopTopLabel = isDrawing ? 'Tap map to draw' : title;
  const mobileTopLabel = isDrawing ? 'Tap map to draw' : title;
  const showDesktopClear = isDrawing ? pointCount > 0 : hasVisibleBoundary;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute left-4 right-4 top-4 flex items-center gap-2 lg:flex lg:items-center">
          <div className="hidden w-full items-center justify-between gap-4 lg:flex">
            <div className="pointer-events-auto flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={isDrawing ? onToggleDrawing : handleBack}
                className="flex h-11 min-w-0 max-w-[320px] items-center rounded-full bg-white/70 px-2.5 pr-12 text-left text-sm text-[#0F1729] backdrop-blur-xl"
                aria-label={isDrawing ? 'Back to area selection' : 'Close area selection'}
              >
                <div className="flex w-full items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]">
                    <ArrowLeft size={16} strokeWidth={2.4} />
                  </span>
                  <p className="min-w-0 flex-1 truncate type-body leading-tight">{desktopTopLabel}</p>
                </div>
              </button>
              {showDesktopClear && (
                <button
                  onClick={isDrawing ? onClearDrawing : onClearSelection}
                  className="h-11 rounded-full bg-white px-4 type-btn text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
                >
                  {isDrawing ? 'Clear' : 'Clear Areas'}
                </button>
              )}
            </div>
            <div className="pointer-events-auto flex shrink-0 items-center gap-2">
              <button onClick={onUndoBoundary} disabled={!canUndoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
                <Undo2 size={15} />
              </button>
              <button onClick={onRedoBoundary} disabled={!canRedoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
                <Redo2 size={15} />
              </button>
              <button
                onClick={onApply}
                className="h-11 shrink-0 rounded-full bg-[#0F1729]/92 px-5 type-label text-white backdrop-blur-xl transition-colors hover:bg-[#0F1729] lg:px-9"
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={isDrawing ? onToggleDrawing : handleBack}
              className={cn(
                'pointer-events-auto flex h-11 min-w-0 items-center rounded-full bg-white/70 px-2.5 pr-10 text-left text-sm text-[#0F1729] backdrop-blur-xl',
                isDrawing ? 'max-w-none flex-1' : 'max-w-[212px] flex-1'
              )}
              aria-label={isDrawing ? 'Back to area selection' : 'Close area selection'}
            >
              <div className="flex w-full items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729]">
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </span>
                <p className="min-w-0 flex-1 truncate type-body leading-tight">{mobileTopLabel}</p>
              </div>
            </button>
            {!isDrawing && (
              <button
                onClick={onApply}
                className="pointer-events-auto ml-auto h-11 rounded-full bg-[#0F1729]/92 px-5 type-label text-white backdrop-blur-xl transition-colors hover:bg-[#0F1729] lg:px-9"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {!isDrawing && !focusedNeighborhood ? (
          <div
            className="absolute bottom-0 right-5 flex flex-col items-end gap-3 lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <FloatingActionButton size="md" onClick={onToggleDrawing} aria-label="Draw boundary">
              <Pencil size={18} />
            </FloatingActionButton>
          </div>
        ) : null}

        {hasSelection && !isDrawing && !focusedNeighborhood && (
          <div
            className="absolute bottom-0 left-5 flex items-center gap-2 pointer-events-auto lg:hidden"
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

        {isDrawing && (
          <>
            <div
              className="absolute bottom-0 left-5 flex items-center gap-2 pointer-events-auto lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <button onClick={onClearDrawing} disabled={pointCount === 0} className="flex h-9 items-center justify-center rounded-full bg-white px-3 type-label text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
                Clear
              </button>
              <button onClick={onUndoBoundary} disabled={!canUndoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
                <Undo2 size={15} />
              </button>
              <button onClick={onRedoBoundary} disabled={!canRedoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] disabled:opacity-35">
                <Redo2 size={15} />
              </button>
            </div>

            <div
              className="absolute bottom-0 right-5 pointer-events-auto lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <button
                onClick={onApply}
                className="h-11 rounded-full bg-[#0F1729]/92 px-6 type-label text-white backdrop-blur-xl transition-colors hover:bg-[#0F1729]"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {focusedNeighborhood && (
          <>
          <motion.div
            key={`neighborhood-card-${focusedNeighborhood.id}-${focusToken}`}
            initial={{ y: 26, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 26, opacity: 0, scale: 0.98 }}
            transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 overflow-visible pt-3 lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <article className="pointer-events-auto relative mx-auto flex h-[138px] w-[336px] gap-2 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-[0_10px_30px_rgba(15,23,41,0.18)]">
              <button
                onClick={onCloseNeighborhood}
                className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
                aria-label="Close neighborhood card"
              >
                <X size={14} />
              </button>
              <Image src={focusedNeighborhood.thumbnail} alt="" width={100} height={124} className="h-full w-[100px] shrink-0 rounded-xl object-cover" draggable={false} />
              <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-8">
                <div className="min-w-0 flex-1">
                  <p className="truncate type-heading text-[#0F1729]">{focusedNeighborhood.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-micro text-[var(--color-brand-text)]">🏠 {focusedNeighborhood.listingCount} listings</span>
                    <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-micro text-[var(--color-brand-text)]">💵 Avg {formatAvgPrice(focusedNeighborhood.avgPrice)}</span>
                    <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-micro text-[var(--color-brand-text)]">🚶 Walk {focusedNeighborhood.walkScore}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const included = selectedNeighborhoods.has(focusedNeighborhood.id);
                    onToggleNeighborhood(focusedNeighborhood.id);
                    if (included) onCloseNeighborhood();
                  }}
                  className={cn(
                    'absolute bottom-2 right-2 flex h-9 w-[92px] items-center justify-center gap-1.5 rounded-full px-3 type-caption font-semibold transition-colors',
                    selectedNeighborhoods.has(focusedNeighborhood.id) ? 'bg-[#0F1729] text-white' : 'bg-[#F5F6F7] text-[#0F1729]'
                  )}
                >
                  {selectedNeighborhoods.has(focusedNeighborhood.id) ? <Check size={13} /> : <Plus size={13} />}
                  {selectedNeighborhoods.has(focusedNeighborhood.id) ? 'Included' : 'Include'}
                </button>
              </div>
            </article>
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
              <p className="truncate type-heading text-[#0F1729]">{focusedNeighborhood.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-fine text-[var(--color-brand-text)]">🏠 {focusedNeighborhood.listingCount} listings</span>
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-fine text-[var(--color-brand-text)]">💵 Avg {formatAvgPrice(focusedNeighborhood.avgPrice)}</span>
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-fine text-[var(--color-brand-text)]">🚶 Walk {focusedNeighborhood.walkScore}</span>
              </div>
              <button
                onClick={() => {
                  const included = selectedNeighborhoods.has(focusedNeighborhood.id);
                  onToggleNeighborhood(focusedNeighborhood.id);
                  if (included) onCloseNeighborhood();
                }}
                className={cn(
                  'mt-auto mr-0 flex h-10 w-fit items-center justify-center gap-1.5 self-end rounded-full px-4 type-label transition-colors',
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
