'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Ellipsis } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { Coordinates, SavedSearch } from '@/lib/types';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import RenameDeletePopover from '@/components/molecules/RenameDeletePopover';
import { cn } from '@/lib/utils/cn';
import { getSavedSearchCriteriaSummary } from '@/lib/utils/search-display';

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
      if (target.closest('[data-rename-delete-popover="true"]')) return;
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
        <p className="mb-3 type-heading text-[var(--color-text-primary)]">Save Current Search</p>
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
        <p className="mb-3 type-heading text-[var(--color-text-primary)]">My Searches</p>
        <div className="flex flex-col gap-3">
          {searches.map((search) => {
            const isSelected = activeSearchId === search.id;
            const showUpdatedState = updatedSearchId === search.id;
            const criteriaSummary = getSavedSearchCriteriaSummary(search);
            const hasNewListings = Boolean(search.newListingsCount && search.newListingsCount > 0);

            return (
            <div
              key={search.id}
              role="button"
              tabIndex={0}
              onClick={() => handleLoadSearch(search)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleLoadSearch(search);
                }
              }}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                isSelected
                  ? 'border-[var(--color-text-secondary)] bg-white shadow-[inset_0_0_0_1px_var(--color-text-secondary)]'
                  : 'border-transparent bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
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
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {renamingId === search.id ? (
                    <div className="flex h-8 items-center rounded-xl border border-[var(--color-border)] bg-white pl-3 pr-1.5">
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
                        className="type-body min-w-0 flex-1 bg-transparent text-[var(--color-text-primary)] outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          finishRename();
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                        aria-label="Finish rename"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <p className="type-heading-sm min-w-0 truncate text-[var(--color-text-primary)]">{search.name}</p>
                  )}
                  <div className="mt-0.5">
                    <p className="min-w-0 flex-1 truncate type-caption text-[var(--color-text-tertiary)]">
                      {criteriaSummary}
                    </p>
                  </div>
                  {hasNewListings && (
                    <span className="type-caption mt-2 inline-flex self-start rounded-full bg-[var(--color-brand-600)] px-2 py-0.5 text-[var(--color-text-inverse)]">
                      {search.newListingsCount} new
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={(event) => openMenu(event, search.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-white hover:text-[var(--color-text-primary)]"
                    aria-label="Saved search options"
                  >
                    <Ellipsis size={16} />
                  </button>
                  <div className="flex items-center justify-end gap-2">
                    {showUpdatedState ? (
                      <span className="shrink-0 rounded-full border border-[var(--color-success)] bg-[var(--color-brand-50)] px-3 py-2 type-caption text-[var(--color-success)]">
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
                        className="shrink-0 rounded-full bg-[var(--color-text-primary)] px-3 py-2 type-caption text-[var(--color-text-inverse)]"
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
                        className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-2 type-caption text-[var(--color-text-primary)]"
                      >
                        Unselect
                      </button>
                    ) : (
                      <span className="h-8" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>
            </div>
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
      {menuState && (
        <RenameDeletePopover
          open
          confirmOpen={!!confirmDeleteId}
          right={menuState.right}
          bottom={menuState.bottom}
          renameLabel="Rename"
          deleteLabel="Delete"
          deleteTitle="Delete saved search?"
          deleteDescription="This will remove it from your saved searches."
          onClose={closeMenu}
          onRename={() => {
            const active = searches.find((search) => search.id === menuState.searchId);
            if (active) startRename(active.id, active.name);
          }}
          onRequestDelete={() => requestDelete(menuState.searchId)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onConfirmDelete={confirmDelete}
        />
      )}
    </>
  );
}
