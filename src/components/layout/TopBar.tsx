'use client';
import { useRef, useState } from 'react';
import { Pencil, Search, SlidersHorizontal, SquareDashedMousePointer, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { useOutsidePointerDown } from '@/hooks/useOutsidePointerDown';
import Button from '@/components/ui/Button';
import ActionRow from '@/components/ui/ActionRow';

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

  useOutsidePointerDown({
    refs: [areaMenuRef],
    enabled: showAreaMenu,
    onOutside: () => setShowAreaMenu(false),
  });

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
      <div className="flex w-full max-w-[360px] items-center gap-2.5">
        <div ref={areaMenuRef} className="relative shrink-0">
          <Button
            variant="elevated"
            shape="circle"
            size="control"
            onClick={handleAreaClick}
            active={hasAppliedArea}
            className="relative"
            aria-label="Area selection"
            aria-pressed={hasAppliedArea}
          >
            <SquareDashedMousePointer
              size={18}
              className="text-[var(--color-text-primary)]"
            />
            {hasAppliedArea && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 type-nano leading-none text-white">
                1
              </span>
            )}
          </Button>
          {showAreaMenu && (
            <div className="absolute left-0 top-12 z-30 w-40 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
              <ActionRow
                onClick={handleOpenAreaSelect}
                leading={<SquareDashedMousePointer size={15} />}
              >
                <span>Select area</span>
              </ActionRow>
              <ActionRow
                onClick={handleOpenDrawArea}
                leading={<Pencil size={15} />}
              >
                <span>Draw</span>
              </ActionRow>
              {hasAppliedArea && (
                <ActionRow
                  onClick={handleClearArea}
                  leading={<Trash2 size={15} />}
                >
                  <span>Clear area</span>
                </ActionRow>
              )}
            </div>
          )}
        </div>

        <motion.div layoutId="map-search-bar" className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-full bg-white px-4 py-2.5 shadow-[var(--shadow-control)] min-h-[44px] no-select">
          <button
            onClick={() => setActivePanel('search')}
            className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden text-left"
          >
            <Search size={17} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
            {selectedLocations.length > 0 || hasAppliedArea ? (
              <span className="inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-full bg-[var(--color-brand-surface)] px-2.5 py-0.5 type-body font-medium text-[var(--color-brand-text)]">
                <span className="min-w-0 truncate">{locationLabel}</span>
              </span>
            ) : (
              <span className="min-w-0 flex-1 truncate type-body font-medium text-[var(--color-text-tertiary)]">
                {locationLabel}
              </span>
            )}
          </button>
        </motion.div>

        <Button
          variant="elevated"
          size="control"
          onClick={() => setActivePanel('filter')}
          active={filterCount > 0}
          className="relative shrink-0 type-btn"
        >
          <SlidersHorizontal size={16} className="text-[var(--color-text-primary)]" />
          Filter
          {filterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 type-nano leading-none text-white">
              {filterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
