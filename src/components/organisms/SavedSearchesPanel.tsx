'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { Coordinates, SavedSearch } from '@/lib/types';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import { cn } from '@/lib/utils/cn';

interface SavedSearchesPanelProps {
  hasActiveCriteria?: boolean;
  currentBoundary?: Coordinates[];
  currentNeighborhoodIds?: string[];
  activeSearchDirty?: boolean;
  onSelectSearch?: (search: SavedSearch) => void;
  onDeselectSearch?: () => void;
  onUpdateSearch?: (searchId: string) => void;
}

export default function SavedSearchesPanel({
  hasActiveCriteria,
  currentBoundary = [],
  currentNeighborhoodIds = [],
  activeSearchDirty = false,
  onSelectSearch,
  onDeselectSearch,
  onUpdateSearch,
}: SavedSearchesPanelProps) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const { selectedLocations, filters, setLocations, replaceFilters } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { searches, saveSearch, activeSearchId, setActiveSearchId } = useSavedSearchStore();
  const canSaveCurrent = hasActiveCriteria ?? activeFilterCount() > 0;
  const [newSearchName, setNewSearchName] = useState('');
  const [saving, setSaving] = useState(canSaveCurrent && !activeSearchId);
  const [updatedSearchId, setUpdatedSearchId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1024));
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const updateFeedbackTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (updateFeedbackTimeoutRef.current) {
        window.clearTimeout(updateFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadSearch = (search: SavedSearch) => {
    if (activeSearchId === search.id) {
      setActiveSearchId(null);
      onDeselectSearch?.();
      setActivePanel('none');
      return;
    }
    setActiveSearchId(search.id);
    setLocations(search.locations);
    replaceFilters(search.filters);
    onSelectSearch?.(search);
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
      <div className="px-4 py-4">
        <p className="type-heading text-[#0F1729] mb-3">Save Current Search</p>
        <CreateInlineField
          open={saving}
          onOpenChange={setSaving}
          value={newSearchName}
          onValueChange={setNewSearchName}
          placeholder="Search name..."
          collapsedLabel={`Save "${selectedLocations.length > 0 ? selectedLocations.map((l) => l.name).join(', ') : 'Current Search'}"`}
          onSubmit={handleSaveCurrent}
          inputRef={inputRef}
          autoFocus={canSaveCurrent}
          submitLabel="Save"
        />
      </div>

      {/* Saved searches list */}
      <div className="px-4 py-4">
        <p className="type-heading text-[#0F1729] mb-3">My Searches</p>
        <div className="flex flex-col gap-3">
          {searches.map((search) => {
            const isSelected = activeSearchId === search.id;
            const showUpdatedState = updatedSearchId === search.id;
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
                <p className="type-caption text-[#9CA3AF] mt-0.5">
                  {search.locations.map(l => l.name).join(', ')}
                </p>
                {search.newListingsCount && search.newListingsCount > 0 && (
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-[#0F1729] text-white type-caption font-medium rounded-full">
                    {search.newListingsCount} new
                  </span>
                )}
              </div>
              {showUpdatedState ? (
                <span className="shrink-0 rounded-full bg-[#E8F8F1] px-3 py-2 type-caption text-[#0B8A62]">
                  Updated
                </span>
              ) : isSelected && activeSearchDirty ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateSearch?.(search.id);
                    setUpdatedSearchId(search.id);
                    if (updateFeedbackTimeoutRef.current) {
                      window.clearTimeout(updateFeedbackTimeoutRef.current);
                    }
                    updateFeedbackTimeoutRef.current = window.setTimeout(() => {
                      setUpdatedSearchId((current) => (current === search.id ? null : current));
                    }, 1400);
                  }}
                  className="shrink-0 rounded-full bg-[#0F1729] px-3 py-2 type-caption text-white"
                >
                  Update?
                </button>
              ) : (
                <ChevronRight size={18} className="text-[#9CA3AF] flex-shrink-0" />
              )}
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
          className="fixed left-1/2 top-[70px] z-[60] -ml-[232px] max-h-[calc(100vh-9rem)] w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
        >
          {content}
        </div>
      )}
    </>
  );
}
