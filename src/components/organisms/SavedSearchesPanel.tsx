'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Plus } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { Coordinates, SavedSearch } from '@/lib/types';
import Button from '@/components/atoms/Button';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import { cn } from '@/lib/utils/cn';

interface SavedSearchesPanelProps {
  hasActiveCriteria?: boolean;
  currentBoundary?: Coordinates[];
  currentNeighborhoodIds?: string[];
  onApplySearch?: (search: SavedSearch) => void;
}

export default function SavedSearchesPanel({
  hasActiveCriteria,
  currentBoundary = [],
  currentNeighborhoodIds = [],
  onApplySearch,
}: SavedSearchesPanelProps) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const { selectedLocations, filters, setLocations, replaceFilters } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { searches, saveSearch, activeSearchId, setActiveSearchId } = useSavedSearchStore();
  const canSaveCurrent = hasActiveCriteria ?? activeFilterCount() > 0;
  const [newSearchName, setNewSearchName] = useState('');
  const [saving, setSaving] = useState(canSaveCurrent && !activeSearchId);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1024));
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!saving) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [saving]);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isDesktop) return;
      const target = event.target as HTMLElement;
      if (target.closest('[data-saved-search-trigger="true"]')) return;
      if (!desktopPanelRef.current?.contains(target)) setActivePanel('none');
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isDesktop, setActivePanel]);

  const handleLoadSearch = (search: SavedSearch) => {
    setActiveSearchId(search.id);
    setLocations(search.locations);
    replaceFilters(search.filters);
    onApplySearch?.(search);
    setActivePanel('none');
  };

  const handleSaveCurrent = () => {
    const trimmedName = newSearchName.trim();
    if (!trimmedName) return;
    saveSearch({
      name: trimmedName,
      locations: selectedLocations,
      filters,
      areaBoundary: currentBoundary,
      neighborhoodIds: currentNeighborhoodIds,
    });
    setSaving(false);
    setNewSearchName('');
  };

  const content = (
    <>
      {/* Save current search */}
      <div className="px-4 py-4 border-b border-[#F5F6F7]">
        <p className="font-heading text-base text-[#0F1729] mb-3">Save Current Search</p>
        {saving ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              placeholder="Search name..."
              className="h-12 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
              autoFocus={canSaveCurrent}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrent()}
            />
            <Button size="lg" onClick={handleSaveCurrent} className="h-12 px-5">Save</Button>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            className="flex items-center gap-2 w-full px-4 py-3 border border-dashed border-[#D1D5DB] rounded-xl text-sm text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729] transition-colors"
          >
            <Plus size={16} />
            Save &quot;{selectedLocations.length > 0 ? selectedLocations.map(l => l.name).join(', ') : 'Current Search'}&quot;
          </button>
        )}
      </div>

      {/* Saved searches list */}
      <div className="px-4 py-4">
        <p className="font-heading text-base text-[#0F1729] mb-3">My Searches</p>
        <div className="flex flex-col gap-3">
          {searches.map((search) => {
            const isSelected = activeSearchId === search.id;
            return (
            <button
              key={search.id}
              onClick={() => handleLoadSearch(search)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                isSelected
                  ? 'border-[#6B7280] bg-white shadow-[inset_0_0_0_1px_#6B7280]'
                  : 'border-transparent bg-[#F5F6F7] hover:bg-[#EBEBEB]'
              )}
            >
              {search.thumbnail && (
                <Image
                  src={search.thumbnail}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm text-[#0F1729]">{search.name}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {search.locations.map(l => l.name).join(', ')}
                </p>
                {search.newListingsCount && search.newListingsCount > 0 && (
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-[#0F1729] text-white text-xs font-medium rounded-full">
                    {search.newListingsCount} new
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-[#9CA3AF] flex-shrink-0" />
            </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {!isDesktop && (
        <MobileDrawer
          title="Saved Searches"
          onClose={() => setActivePanel('none')}
          heightClassName="h-[74dvh]"
        >
          {content}
        </MobileDrawer>
      )}
      {isDesktop && (
        <div
          ref={desktopPanelRef}
          className="fixed left-1/2 top-[64px] z-[60] ml-[164px] max-h-[calc(100vh-9rem)] w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
        >
          <div className="px-4 pt-4">
            <p className="font-heading text-lg text-[#0F1729]">Saved Searches</p>
          </div>
          {content}
        </div>
      )}
    </>
  );
}
