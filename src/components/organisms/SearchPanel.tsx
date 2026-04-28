'use client';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ArrowLeft, SquareDashedMousePointer, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Location } from '@/lib/types';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import SearchLocationChip from '@/components/molecules/SearchLocationChip';
import SearchLocationResultItem from '@/components/molecules/SearchLocationResultItem';
import { AreaChip } from '@/lib/utils/search-display';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';

interface SearchPanelProps {
  hasAppliedArea?: boolean;
  areaChips?: AreaChip[];
  currentNeighborhoodIds?: string[];
  onRemoveLocationChip?: (location: Location) => void;
  onRemoveAreaChip?: (chip: AreaChip) => void;
  onOpenAreaSelect?: () => void;
  onOpenDrawAreaSelect?: () => void;
  onEditArea?: () => void;
  onClearArea?: () => void;
}

export default function SearchPanel({
  hasAppliedArea = false,
  areaChips = [],
  currentNeighborhoodIds = [],
  onRemoveLocationChip,
  onRemoveAreaChip,
  onOpenAreaSelect,
  onOpenDrawAreaSelect,
  onEditArea,
  onClearArea,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const areaMenuRef = useRef<HTMLDivElement>(null);
  const { selectedLocations, addLocation, removeLocation, clearLocations } = useSearchStore();
  const { setActivePanel, setAreaSelectMode } = useUIStore();
  const { results, isLoading } = useLocationSearch(query, selectedLocations, true, currentNeighborhoodIds);
  const locationChipLabels = selectedLocations.map((location) => getPrimaryLocationLabel(location.name));
  const visibleAreaChips = areaChips.filter((chip) => !locationChipLabels.includes(chip.label));

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAreaMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!areaMenuRef.current?.contains(event.target as Node)) setShowAreaMenu(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showAreaMenu]);

  const filtered = results;

  const handleSelect = (loc: Location) => {
    addLocation(loc);
    setQuery('');
    setActivePanel('none');
  };

  const handleClose = () => {
    setActivePanel('none');
  };

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

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close search"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/20"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'tween', duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-4 right-4 top-4 z-[60] lg:left-1/2 lg:right-auto lg:top-20 lg:w-[520px] lg:-translate-x-1/2"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[var(--shadow-control)]">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[var(--color-surface)]"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedLocations.length === 0 ? 'Add an area' : 'Add another...'}
                className="min-w-20 flex-1 bg-transparent type-body text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
            {(query || selectedLocations.length > 0) && (
              <button
                onClick={() => { setQuery(''); }}
                className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div ref={areaMenuRef} className="relative hidden shrink-0 lg:block">
            <button
              onClick={handleAreaClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[var(--shadow-control)] transition-colors no-select hover:bg-[var(--color-surface)]"
              aria-label="Area select"
            >
              <SquareDashedMousePointer size={18} className="text-[var(--color-text-primary)]" />
            </button>
            {showAreaMenu && (
              <div className="absolute right-0 top-12 z-30 w-40 rounded-2xl bg-white p-1.5 type-body shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
                <button
                  onClick={() => {
                    handleOpenAreaSelect();
                  }}
                className="type-btn w-full rounded-xl px-3 py-2 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                >
                  Select area
                </button>
                <button
                  onClick={() => {
                    handleOpenDrawArea();
                  }}
                  className="type-btn w-full rounded-xl px-3 py-2 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                >
                  Draw
                </button>
                {hasAppliedArea && (
                  <button
                    onClick={() => {
                      setShowAreaMenu(false);
                      onClearArea?.();
                    }}
                  className="type-btn w-full rounded-xl px-3 py-2 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                  >
                    Clear area
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="mt-2 max-h-[62dvh] overflow-y-auto rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
        >
          {(selectedLocations.length > 0 || visibleAreaChips.length > 0) && (
            <div className="flex items-center gap-2 border-b border-[var(--color-surface)] px-2 py-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                {selectedLocations.map((loc) => (
                  <SearchLocationChip
                    key={loc.id}
                    location={loc}
                    onRemove={() => {
                      if (onRemoveLocationChip) onRemoveLocationChip(loc);
                      else removeLocation(loc.id);
                    }}
                  />
                ))}
                {visibleAreaChips.map((chip) => (
                  <SearchLocationChip
                    key={chip.id}
                    label={chip.label}
                    onRemove={() => {
                      if (onRemoveAreaChip) onRemoveAreaChip(chip);
                      else onClearArea?.();
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  clearLocations();
                  onClearArea?.();
                }}
                className="type-label shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Clear
              </button>
            </div>
          )}
        <div className="py-1">
          {filtered.map((loc, index) => (
            <SearchLocationResultItem
              key={loc.id}
              location={loc}
              onSelect={() => handleSelect(loc)}
              highlighted={index === 0 && Boolean(query.trim())}
            />
          ))}
          {isLoading && (
            <p className="type-body py-8 text-center text-[var(--color-text-tertiary)]">Searching locations…</p>
          )}
          {filtered.length === 0 && query && (
            <p className="type-body py-8 text-center text-[var(--color-text-tertiary)]">No results for &quot;{query}&quot;</p>
          )}
        </div>
        </motion.div>
      </motion.div>
    </>
  );
}
