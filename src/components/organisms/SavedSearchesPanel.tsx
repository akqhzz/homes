'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
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

interface SearchMenuState {
  searchId: string;
  right: number;
  bottom: number;
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
  const { searches, saveSearch, activeSearchId, setActiveSearchId, renameSearch, deleteSearch } = useSavedSearchStore();
  const canSaveCurrent = hasActiveCriteria ?? activeFilterCount() > 0;
  const [newSearchName, setNewSearchName] = useState('');
  const [saving, setSaving] = useState(canSaveCurrent && !activeSearchId);
  const [updatedSearchId, setUpdatedSearchId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1024));
  const [desktopPosition, setDesktopPosition] = useState<{ top: number; left: number } | null>(null);
  const [menuState, setMenuState] = useState<SearchMenuState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
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
    if (!isDesktop) return;
    const updateDesktopPosition = () => {
      const trigger = document.querySelector('[data-saved-search-trigger="true"]') as HTMLElement | null;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelWidth = 420;
      const viewportPadding = 24;
      setDesktopPosition({
        top: rect.bottom + 14,
        left: Math.min(Math.max(rect.right - panelWidth, viewportPadding), window.innerWidth - panelWidth - viewportPadding),
      });
    };

    updateDesktopPosition();
    window.addEventListener('resize', updateDesktopPosition);
    window.addEventListener('scroll', updateDesktopPosition, true);
    return () => {
      window.removeEventListener('resize', updateDesktopPosition);
      window.removeEventListener('scroll', updateDesktopPosition, true);
    };
  }, [isDesktop]);

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

  const closeMenu = () => {
    setMenuState(null);
    setConfirmDeleteId(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, searchId: string) => {
    event.stopPropagation();
    if (menuState?.searchId === searchId) {
      closeMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({
      searchId,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.top + 4,
    });
    setConfirmDeleteId(null);
  };

  const startRename = (id: string, name: string) => {
    closeMenu();
    setRenamingId(id);
    setRenameName(name);
  };

  const finishRename = () => {
    const name = renameName.trim();
    if (!renamingId) return;
    if (!name) {
      setRenamingId(null);
      setRenameName('');
      return;
    }
    renameSearch(renamingId, name);
    setRenamingId(null);
    setRenameName('');
  };

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    if (activeSearchId === confirmDeleteId) onDeselectSearch?.();
    deleteSearch(confirmDeleteId);
    closeMenu();
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
                'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
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
                <div className="flex items-start justify-between gap-2">
                  {renamingId === search.id ? (
                    <input
                      value={renameName}
                      onChange={(event) => setRenameName(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === 'Enter') finishRename();
                        if (event.key === 'Escape') {
                          setRenamingId(null);
                          setRenameName('');
                        }
                      }}
                      onBlur={finishRename}
                      className="h-8 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#0F1729] outline-none focus:border-[#0F1729]"
                      autoFocus
                    />
                  ) : (
                    <p className="min-w-0 flex-1 truncate font-heading text-sm text-[#0F1729]">{search.name}</p>
                  )}
                  <button
                    type="button"
                    onClick={(event) => openMenu(event, search.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-white hover:text-[#0F1729]"
                    aria-label="Saved search options"
                  >
                    <Ellipsis size={16} />
                  </button>
                </div>
                <p className="type-caption text-[#9CA3AF] mt-0.5">
                  {search.locations.map(l => l.name).join(', ')}
                </p>
                <div className="mt-1.5 flex items-end justify-between gap-3">
                  <div className="min-h-[30px]">
                    {search.newListingsCount && search.newListingsCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#0F1729] text-white type-caption font-medium rounded-full">
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
                  ) : isSelected ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleLoadSearch(search);
                      }}
                      className="shrink-0 rounded-full bg-[#F5F6F7] px-3 py-2 type-caption text-[#0F1729]"
                    >
                      Unselect
                    </button>
                  ) : null}
                </div>
              </div>
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
          heightClassName="max-h-[86dvh]"
        >
          {content}
        </MobileDrawer>
      )}
      {isDesktop && (
        <div
          ref={desktopPanelRef}
          className="fixed z-[60] max-h-[min(640px,calc(100vh-12rem))] w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
          style={
            desktopPosition
              ? { top: desktopPosition.top, left: desktopPosition.left }
              : { top: 70, left: '50%', marginLeft: -210 }
          }
        >
          {content}
        </div>
      )}
      {typeof document !== 'undefined' && menuState && createPortal(
        <>
          <div className="fixed inset-0 z-[65]" onClick={closeMenu} />
          <AnimatePresence>
            {!confirmDeleteId && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="fixed z-[70] w-56 rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
                style={{ right: menuState.right, bottom: menuState.bottom }}
              >
                {(() => {
                  const active = searches.find((search) => search.id === menuState.searchId);
                  if (!active) return null;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => startRename(active.id, active.name)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7]">
                          <Pencil size={15} className="text-[#0F1729]" />
                        </div>
                        <span className="type-body font-medium text-[#0F1729]">Rename Search</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(active.id)}
                        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-red-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                          <Trash2 size={15} className="text-[#EF4444]" />
                        </div>
                        <span className="type-body font-medium text-[#EF4444]">Delete Search</span>
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}
            {confirmDeleteId && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="fixed z-[70] w-72 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
                style={{ right: menuState.right, bottom: menuState.bottom }}
              >
                <p className="type-heading text-[#0F1729]">Delete saved search?</p>
                <p className="mt-2 type-body text-[#6B7280]">This will remove it from your saved searches.</p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="rounded-full bg-[#F5F6F7] px-4 py-2 type-label text-[#0F1729]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="rounded-full bg-[#EF4444] px-4 py-2 type-label text-white"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
