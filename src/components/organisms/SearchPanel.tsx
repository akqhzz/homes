'use client';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ArrowLeft, SquareDashedMousePointer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Location } from '@/lib/types';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import SearchLocationChip from '@/components/molecules/SearchLocationChip';
import SearchLocationResultItem from '@/components/molecules/SearchLocationResultItem';

interface SearchPanelProps {
  hasAppliedArea?: boolean;
  areaSummaryLabel?: string;
  onOpenAreaSelect?: () => void;
  onEditArea?: () => void;
  onClearArea?: () => void;
}

export default function SearchPanel({ hasAppliedArea = false, areaSummaryLabel, onOpenAreaSelect, onEditArea, onClearArea }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const areaMenuRef = useRef<HTMLDivElement>(null);
  const { selectedLocations, addLocation, removeLocation, clearLocations } = useSearchStore();
  const { setActivePanel, setAreaSelectMode } = useUIStore();
  const { results, isLoading } = useLocationSearch(query, selectedLocations);

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
    if (hasAppliedArea) {
      setShowAreaMenu((value) => !value);
      return;
    }
    if (onOpenAreaSelect) {
      onOpenAreaSelect();
      return;
    }
    setAreaSelectMode(true);
    setActivePanel('area-select');
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#F5F6F7]"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedLocations.length === 0 ? 'Where?' : 'Add another...'}
                className="min-w-20 flex-1 bg-transparent type-body text-[#0F1729] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
            {(query || selectedLocations.length > 0) && (
              <button
                onClick={() => { setQuery(''); clearLocations(); }}
                className="shrink-0 text-[#9CA3AF] hover:text-[#0F1729]"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div ref={areaMenuRef} className="relative hidden shrink-0 lg:block">
            <button
              onClick={handleAreaClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-colors no-select hover:bg-[#F5F6F7]"
              aria-label="Area select"
            >
              <SquareDashedMousePointer size={18} className="text-[#0F1729]" />
            </button>
            {showAreaMenu && (
              <div className="absolute right-0 top-12 z-30 w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
                <button
                  onClick={() => {
                    setShowAreaMenu(false);
                    onEditArea?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left font-button text-[#0F1729] hover:bg-[#F5F6F7]"
                >
                  Edit area
                </button>
                <button
                  onClick={() => {
                    setShowAreaMenu(false);
                    onClearArea?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left font-button text-[#6B7280] hover:bg-[#F5F6F7]"
                >
                  Clear area
                </button>
              </div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.04, duration: 0.16 }}
          className="mt-2 max-h-[62dvh] overflow-y-auto rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
        >
          {(selectedLocations.length > 0 || (hasAppliedArea && areaSummaryLabel)) && (
            <div className="flex items-center gap-2 border-b border-[#F5F6F7] px-2 py-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
                {selectedLocations.map((loc) => (
                  <SearchLocationChip
                    key={loc.id}
                    location={loc}
                    onRemove={() => removeLocation(loc.id)}
                  />
                ))}
                {hasAppliedArea && areaSummaryLabel && (
                  <SearchLocationChip
                    label={areaSummaryLabel}
                    onRemove={() => onClearArea?.()}
                  />
                )}
              </div>
              <button onClick={clearLocations} className="shrink-0 rounded-full bg-[#F5F6F7] px-3 py-1 text-sm font-medium text-[#6B7280] hover:text-[#0F1729]">
                Clear
              </button>
            </div>
          )}
        <div className="py-1">
          <AnimatePresence>
            {filtered.map((loc, index) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <SearchLocationResultItem
                  location={loc}
                  onSelect={() => handleSelect(loc)}
                  highlighted={index === 0 && Boolean(query.trim())}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <p className="text-sm text-[#9CA3AF] text-center py-8">Searching locations…</p>
          )}
          {filtered.length === 0 && query && (
            <p className="text-sm text-[#9CA3AF] text-center py-8">No results for &quot;{query}&quot;</p>
          )}
        </div>
        </motion.div>
      </motion.div>
    </>
  );
}
