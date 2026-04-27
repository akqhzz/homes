'use client';
import { useEffect, useRef, useState } from 'react';
import { Pencil, Search, SlidersHorizontal, SquareDashedMousePointer, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
const ROUND_CONTROL_CLASS =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-colors no-select hover:bg-[var(--color-surface)]';
const AREA_MENU_ITEM_CLASS = 'w-full rounded-xl px-3 py-2 text-left hover:bg-[var(--color-surface)]';

interface TopBarProps {
  hasAppliedArea?: boolean;
  compactAreaChipLabel?: string;
  onOpenAreaSelect?: () => void;
  onOpenDrawAreaSelect?: () => void;
  onEditArea?: () => void;
  onClearArea?: () => void;
}

export default function TopBar({
  hasAppliedArea = false,
  compactAreaChipLabel,
  onOpenAreaSelect,
  onOpenDrawAreaSelect,
  onEditArea,
  onClearArea,
}: TopBarProps) {
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const areaMenuRef = useRef<HTMLDivElement>(null);
  const { selectedLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { setActivePanel, setAreaSelectMode } = useUIStore();

  const filterCount = activeFilterCount();
  const locationLabel = compactAreaChipLabel
    ?? (selectedLocations.length === 0
      ? hasAppliedArea
        ? '1 area'
        : 'Add an area'
      : selectedLocations.length === 1
      ? selectedLocations[0].name.split(',')[0]?.trim() || selectedLocations[0].name
      : `${selectedLocations.length} area${selectedLocations.length === 1 ? '' : 's'}`);

  const handleAreaClick = () => {
    setShowAreaMenu((value) => !value);
  };

  const handleOpenAreaSelect = () => {
    setShowAreaMenu(false);
    if (hasAppliedArea) {
      onEditArea?.();
      return;
    }
    if (onOpenAreaSelect) {
      onOpenAreaSelect();
      return;
    }
    setAreaSelectMode(true);
    setActivePanel('area-select');
  };

  const handleOpenDrawArea = () => {
    setShowAreaMenu(false);
    onOpenDrawAreaSelect?.();
  };

  const handleClearArea = () => {
    setShowAreaMenu(false);
    onClearArea?.();
  };

  useEffect(() => {
    if (!showAreaMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!areaMenuRef.current?.contains(event.target as Node)) setShowAreaMenu(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showAreaMenu]);

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
      <div className="flex w-full max-w-[360px] items-center gap-2.5">
        <div ref={areaMenuRef} className="relative shrink-0">
          <button
            onClick={handleAreaClick}
            className={ROUND_CONTROL_CLASS}
            aria-label="Area selection"
          >
            <SquareDashedMousePointer size={18} className="text-[var(--color-text-primary)]" />
          </button>
          {showAreaMenu && (
            <div className="absolute left-0 top-12 z-30 w-40 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
              <button onClick={handleOpenAreaSelect} className={cn(AREA_MENU_ITEM_CLASS, 'flex items-center gap-2 text-[var(--color-text-primary)]')}>
                <SquareDashedMousePointer size={15} />
                <span>Select area</span>
              </button>
              <button onClick={handleOpenDrawArea} className={cn(AREA_MENU_ITEM_CLASS, 'flex items-center gap-2 text-[var(--color-text-primary)]')}>
                <Pencil size={15} />
                <span>Draw</span>
              </button>
              {hasAppliedArea && (
                <button onClick={handleClearArea} className={cn(AREA_MENU_ITEM_CLASS, 'flex items-center gap-2 text-[var(--color-text-primary)]')}>
                  <Trash2 size={15} />
                  <span>Clear area</span>
                </button>
              )}
            </div>
          )}
        </div>

        <motion.div layoutId="map-search-bar" className="flex flex-1 items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-[var(--shadow-control)] min-h-[44px] no-select">
          <button
            onClick={() => setActivePanel('search')}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <Search size={17} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
            {selectedLocations.length > 0 || hasAppliedArea ? (
              <span className="inline-flex max-w-full items-center truncate rounded-full bg-[var(--color-brand-surface)] px-2.5 py-0.5 type-body font-medium text-[var(--color-brand-text)]">
                {locationLabel}
              </span>
            ) : (
              <span className="type-body font-medium text-[var(--color-text-tertiary)] flex-1 truncate">
                {locationLabel}
              </span>
            )}
          </button>
        </motion.div>

        <button
          onClick={() => setActivePanel('filter')}
          className={cn(
            'relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-colors no-select',
            filterCount > 0 && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
          )}
        >
          <SlidersHorizontal size={16} className="text-[var(--color-text-primary)]" />
          Filter
          {filterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 type-nano leading-none text-white">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
