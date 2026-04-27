'use client';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Plus, Redo2, Undo2, X } from 'lucide-react';
import { Neighborhood } from '@/lib/types';
import { MOCK_LISTINGS, MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const AREA_NEIGHBORHOODS = MOCK_NEIGHBORHOODS.filter((neighborhood) => neighborhood.id !== 'nbh-king-west');
const ICON_BUTTON_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)] disabled:opacity-35';
const MOBILE_FLOATING_BAR_STYLE = { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' } as const;

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
  onToggleNeighborhood: (id: string) => void;
  onCloseNeighborhood: () => void;
  onUndoBoundary: () => void;
  onRedoBoundary: () => void;
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
  onToggleNeighborhood,
  onCloseNeighborhood,
  onUndoBoundary,
  onRedoBoundary,
}: AreaSelectPanelProps) {
  const selectedCount = selectedNeighborhoods.size;
  const hasSelection = selectedCount > 0 || pointCount > 0;
  const title = hasSelection
    ? selectedCount > 0
      ? `${selectedCount} area${selectedCount === 1 ? '' : 's'} · ${selectedNeighborhoodCount(selectedNeighborhoods)} listings`
      : `${MOCK_LISTINGS.length} listings`
    : 'Tap any area to pick or remove it';

  const desktopTopLabel = isDrawing ? 'Tap map to draw' : title;
  const mobileTopLabel = isDrawing ? 'Tap map to draw' : title;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute left-4 right-4 top-4 hidden grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 lg:grid">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto flex h-11 items-center justify-center rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)]"
            aria-label="Cancel area selection"
          >
            Cancel
          </button>
          <div className="pointer-events-auto mx-auto flex min-h-11 min-w-0 w-full max-w-[340px] items-center justify-center rounded-full bg-white/70 px-4 py-2 text-[var(--color-text-primary)] backdrop-blur-xl">
            <p className="min-w-0 text-center type-body leading-tight whitespace-normal">{desktopTopLabel}</p>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <button onClick={onUndoBoundary} disabled={!canUndoBoundary} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)] disabled:opacity-35">
              <Undo2 size={15} />
            </button>
            <button onClick={onRedoBoundary} disabled={!canRedoBoundary} className={ICON_BUTTON_CLASS}>
              <Redo2 size={15} />
            </button>
            <button
              onClick={onApply}
              className="h-11 shrink-0 rounded-full bg-[var(--color-text-primary)]/92 px-5 type-label text-white backdrop-blur-xl transition-colors hover:bg-[var(--color-text-primary)] lg:px-9"
            >
              Done
            </button>
          </div>
        </div>

        <div className="absolute left-4 right-4 top-4 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)]"
            aria-label="Back to map"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div className="pointer-events-auto flex h-11 min-w-0 flex-1 items-center rounded-full bg-white/70 px-4 text-[var(--color-text-primary)] backdrop-blur-xl">
            <p className="min-w-0 truncate type-body leading-tight">{mobileTopLabel}</p>
          </div>
          <button
            onClick={onApply}
            className="pointer-events-auto ml-auto h-11 shrink-0 rounded-full bg-[var(--color-text-primary)]/92 px-5 type-label text-white backdrop-blur-xl transition-colors hover:bg-[var(--color-text-primary)]"
          >
            Done
          </button>
        </div>

        {!focusedNeighborhood && (hasSelection || canUndoBoundary || canRedoBoundary) && (
          <div
            className="absolute bottom-0 left-5 flex items-center gap-2 pointer-events-auto lg:hidden"
            style={MOBILE_FLOATING_BAR_STYLE}
          >
            <button onClick={onUndoBoundary} disabled={!canUndoBoundary} className={ICON_BUTTON_CLASS}>
              <Undo2 size={15} />
            </button>
            <button onClick={onRedoBoundary} disabled={!canRedoBoundary} className={ICON_BUTTON_CLASS}>
              <Redo2 size={15} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {focusedNeighborhood && !isDrawing && (
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
                className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                aria-label="Close neighborhood card"
              >
                <X size={14} />
              </button>
              <Image src={focusedNeighborhood.thumbnail} alt="" width={100} height={124} className="h-full w-[100px] shrink-0 rounded-xl object-cover" draggable={false} />
              <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-8">
                <div className="min-w-0 flex-1">
                  <p className="truncate type-heading text-[var(--color-text-primary)]">{focusedNeighborhood.name}</p>
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
                    selectedNeighborhoods.has(focusedNeighborhood.id) ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
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
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                aria-label="Close neighborhood card"
              >
                <X size={14} />
              </button>
              <p className="truncate type-heading text-[var(--color-text-primary)]">{focusedNeighborhood.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-caption text-[var(--color-brand-text)]">🏠 {focusedNeighborhood.listingCount} listings</span>
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-caption text-[var(--color-brand-text)]">💵 Avg {formatAvgPrice(focusedNeighborhood.avgPrice)}</span>
                <span className="rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1.5 type-caption text-[var(--color-brand-text)]">🚶 Walk {focusedNeighborhood.walkScore}</span>
              </div>
              <button
                onClick={() => {
                  const included = selectedNeighborhoods.has(focusedNeighborhood.id);
                  onToggleNeighborhood(focusedNeighborhood.id);
                  if (included) onCloseNeighborhood();
                }}
                className={cn(
                  'mt-auto mr-0 flex h-10 w-fit items-center justify-center gap-1.5 self-end rounded-full px-4 type-label transition-colors',
                  selectedNeighborhoods.has(focusedNeighborhood.id) ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
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
