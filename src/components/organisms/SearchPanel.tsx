'use client';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ArrowLeft, Layers, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Location } from '@/lib/types';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import SearchLocationChip from '@/components/molecules/SearchLocationChip';

const LOCATION_SUGGESTIONS: Location[] = [
  { id: 'loc-downtown', name: 'Toronto Downtown', type: 'area', coordinates: { lat: 43.6532, lng: -79.3832 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-midtown', name: 'Midtown', type: 'area', coordinates: { lat: 43.6966, lng: -79.4031 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-annex', name: 'Annex', type: 'neighborhood', coordinates: { lat: 43.6680, lng: -79.4050 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-yorkville', name: 'YorkVille', type: 'neighborhood', coordinates: { lat: 43.6700, lng: -79.3930 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-kensington', name: 'Kensington', type: 'neighborhood', coordinates: { lat: 43.6545, lng: -79.4030 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-queen-west', name: 'Queen West', type: 'neighborhood', coordinates: { lat: 43.6475, lng: -79.4200 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-king-west', name: 'King West', type: 'neighborhood', coordinates: { lat: 43.6440, lng: -79.3970 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-scarborough', name: 'Scarborough', type: 'area', coordinates: { lat: 43.7731, lng: -79.2576 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-etobicoke', name: 'Etobicoke', type: 'area', coordinates: { lat: 43.6435, lng: -79.5653 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-north-york', name: 'North York', type: 'area', coordinates: { lat: 43.7615, lng: -79.4111 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-mississauga', name: 'Mississauga', type: 'city', coordinates: { lat: 43.5890, lng: -79.6441 }, city: 'Mississauga', province: 'ON' },
  { id: 'loc-markham', name: 'Markham', type: 'city', coordinates: { lat: 43.8561, lng: -79.3370 }, city: 'Markham', province: 'ON' },
];

interface SearchPanelProps {
  hasAppliedArea?: boolean;
  onEditArea?: () => void;
  onClearArea?: () => void;
}

export default function SearchPanel({ hasAppliedArea = false, onEditArea, onClearArea }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const areaMenuRef = useRef<HTMLDivElement>(null);
  const { selectedLocations, addLocation, removeLocation, clearLocations } = useSearchStore();
  const { setActivePanel, setAreaSelectMode } = useUIStore();

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

  const filtered = query.trim()
    ? LOCATION_SUGGESTIONS.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) &&
          !selectedLocations.some((s) => s.id === l.id)
      )
    : LOCATION_SUGGESTIONS.filter((l) => !selectedLocations.some((s) => s.id === l.id));

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
        className="fixed left-4 right-4 top-4 z-[60]"
      >
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[var(--shadow-control)]">
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
              className="min-w-20 flex-1 bg-transparent text-sm text-[#0F1729] outline-none placeholder:text-[#9CA3AF]"
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
          <div ref={areaMenuRef} className="relative shrink-0">
            <button
              onClick={handleAreaClick}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F5F6F7] hover:text-[#0F1729]"
              aria-label="Area select"
            >
              <Layers size={17} />
            </button>
            {showAreaMenu && (
              <div className="absolute right-0 top-10 z-30 w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]">
                <button
                  onClick={() => {
                    setShowAreaMenu(false);
                    onEditArea?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
                >
                  Edit area
                </button>
                <button
                  onClick={() => {
                    setShowAreaMenu(false);
                    onClearArea?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left font-medium text-[#6B7280] hover:bg-[#F5F6F7]"
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
          className="mt-2 max-h-[62dvh] overflow-y-auto rounded-3xl bg-white py-2 shadow-[0_12px_30px_rgba(15,23,41,0.16)]"
        >
          {selectedLocations.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
                {selectedLocations.map((loc) => (
                  <SearchLocationChip
                    key={loc.id}
                    location={loc}
                    onRemove={() => removeLocation(loc.id)}
                  />
                ))}
              </div>
              <button onClick={clearLocations} className="shrink-0 rounded-full bg-[#F5F6F7] px-3 py-1 text-sm font-medium text-[#6B7280] hover:text-[#0F1729]">
                Clear
              </button>
            </div>
          )}
        <div className="px-4 py-3">
          <AnimatePresence>
            {filtered.map((loc) => (
              <motion.button
                key={loc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-start gap-3 py-3.5 border-b border-[#F5F6F7] text-left hover:bg-[#F9F9F9] -mx-4 px-4 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#F5F6F7] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={15} className="text-[#9CA3AF]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1729]">
                    {query ? (
                      <>
                        <span className="font-bold">{loc.name.slice(0, query.length)}</span>
                        {loc.name.slice(query.length)}
                      </>
                    ) : loc.name}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {loc.city ? `${loc.city}, ON` : 'ON'}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && query && (
            <p className="text-sm text-[#9CA3AF] text-center py-8">No results for &quot;{query}&quot;</p>
          )}
        </div>
        </motion.div>
      </motion.div>
    </>
  );
}
