'use client';
import type { RefObject } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ControlPillButton from '@/components/ui/ControlPillButton';
import { FilterPanelBody, FilterPanelFooter } from '@/features/search/components/FilterPanel';

interface DesktopFilterControlProps {
  containerRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  filterCount: number;
  totalListings?: number;
  onToggle: () => void;
  onDone: () => void;
}

export default function DesktopFilterControl({
  containerRef,
  open,
  filterCount,
  totalListings,
  onToggle,
  onDone,
}: DesktopFilterControlProps) {
  return (
    <div ref={containerRef} className="relative">
      <ControlPillButton
        onClick={onToggle}
        active={filterCount > 0}
        badge={filterCount > 0 ? filterCount : null}
        aria-label="Filters"
      >
        <SlidersHorizontal size={16} className="text-[var(--color-text-primary)]" />
        Filter
      </ControlPillButton>
      {open && (
        <div className="absolute right-0 top-[58px] z-[80] flex max-h-[min(640px,calc(100vh-12rem))] w-[390px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
          <div className="flex-1 overflow-y-auto">
            <FilterPanelBody />
          </div>
          <div className="sticky bottom-0 border-t border-[var(--color-surface)] bg-white p-4">
            <FilterPanelFooter totalListings={totalListings} onDone={onDone} />
          </div>
        </div>
      )}
    </div>
  );
}
