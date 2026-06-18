'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Bell, Check, ChevronDown, ChevronRight, Ellipsis } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { useSearchStore } from '@/store/searchStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { AlertFrequency, Coordinates, Listing, SavedSearch } from '@/lib/types';
import { applyFilters, filterListingsBySearchArea } from '@/lib/search/filters';
import MobileDrawer from '@/components/ui/MobileDrawer';
import CreateInlineField from '@/components/ui/CreateInlineField';
import RenameDeletePopover from '@/components/ui/RenameDeletePopover';
import ActionRow from '@/components/ui/ActionRow';
import AnchoredPopover from '@/components/ui/AnchoredPopover';
import DesktopSortMenu from '@/components/ui/DesktopSortMenu';
import PhotoFanThumbnail from '@/components/ui/PhotoFanThumbnail';
import { EmptyCollectionIllustration } from '@/features/collections/components/CollectionListingsGrid';
import { cn } from '@/lib/utils/cn';
import { getSavedSearchCriteriaSummary } from '@/lib/utils/search-display';
import { useOutsidePointerDown } from '@/hooks/useOutsidePointerDown';

interface SavedSearchesPanelProps {
  hasActiveCriteria?: boolean;
  currentBoundary?: Coordinates[];
  currentBoundaries?: Coordinates[][];
  currentNeighborhoodIds?: string[];
  activeSearchDirty?: boolean;
  currentListings?: Listing[];
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
  currentBoundaries,
  currentNeighborhoodIds = [],
  activeSearchDirty = false,
  currentListings = [],
  onSelectSearch,
  onDeselectSearch,
  onUpdateSearch,
}: SavedSearchesPanelProps) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const { selectedLocations, filters, setLocations, replaceFilters } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { searches, saveSearch, activeSearchId, setActiveSearchId, renameSearch, deleteSearch, setAlertFrequency } = useSavedSearchStore();
  const visitedListingIds = useMapStore((s) => s.visitedListingIds);
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
  // The per-card email-alert frequency picker is anchored to its badge and lives
  // at panel level so the dots-menu "Email alerts" action can open it too. While
  // it's open the panel suspends its own outside-close: the picker has its own
  // backdrop, so clicking anywhere (including the picker's options) closes just
  // the picker, never the panel or the underlying saved-search card.
  const [alertMenu, setAlertMenu] = useState<{ searchId: string; rect: DOMRect } | null>(null);
  const openAlertMenu = (searchId: string, rect: DOMRect) =>
    setAlertMenu((current) => (current?.searchId === searchId ? null : { searchId, rect }));
  const openAlertMenuForCard = (searchId: string) => {
    const badge = document.querySelector(`[data-alert-badge="${searchId}"]`) as HTMLElement | null;
    if (badge) setAlertMenu({ searchId, rect: badge.getBoundingClientRect() });
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const updateFeedbackTimeoutRef = useRef<number | null>(null);
  const unseenNewCountBySearchId = useMemo(() => {
    const visitedIds = new Set(visitedListingIds);
    return new Map(
      searches.map((search) => [
        search.id,
        getUnseenRecentListingCount(search, visitedIds),
      ])
    );
  }, [searches, visitedListingIds]);

  useEffect(() => {
    if (!saving) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
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

  useOutsidePointerDown({
    refs: [desktopPanelRef],
    enabled: isDesktop && !alertMenu,
    ignoreClosestSelectors: ['[data-saved-search-trigger="true"]', '[data-rename-delete-popover="true"]', '.saved-alert-popover'],
    onOutside: () => setActivePanel('none'),
  });

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
      areaBoundaries: currentBoundaries ?? (currentBoundary.length >= 3 ? [currentBoundary] : []),
      neighborhoodIds: currentNeighborhoodIds,
      thumbnail: getDefaultThumbnailListing(currentListings)?.images[0],
    });
    setSaving(false);
    setNewSearchName('');
  };

  const handleSavingChange = (open: boolean) => {
    setSaving(open);
    if (!open) return;
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
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
          onOpenChange={handleSavingChange}
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
          {searches.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-7 text-center">
              <EmptyCollectionIllustration className="mb-3" />
              <p className="type-heading-sm text-[var(--color-text-primary)]">No saved searches yet</p>
              <p className="mt-1 max-w-[18rem] type-caption text-[var(--color-text-tertiary)]">
                Save your current filters and areas to revisit matching homes here.
              </p>
            </div>
          )}
          {searches.map((search) => {
            const isSelected = activeSearchId === search.id;
            const showUpdatedState = updatedSearchId === search.id;
            const criteriaSummary = getSavedSearchCriteriaSummary(search);
            const unseenNewListingsCount = unseenNewCountBySearchId.get(search.id) ?? 0;
            const hasNewListings = unseenNewListingsCount > 0;

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
                'flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                isSelected
                  ? 'border-[var(--color-text-secondary)] bg-white shadow-[inset_0_0_0_1px_var(--color-text-secondary)]'
                  : 'border-transparent bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-center shadow-[inset_0_0_0_1px_var(--color-border)]">
                {search.thumbnail ? (
                  <Image
                    src={search.thumbnail}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover object-center"
                    draggable={false}
                  />
                ) : (
                  <span className="type-heading-sm text-[var(--color-text-secondary)]">
                    {search.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
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
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {hasNewListings && (
                      <span className="type-micro inline-flex h-7 items-center rounded-full bg-[var(--color-brand-600)] px-2.5 text-[var(--color-text-inverse)]">
                        {unseenNewListingsCount} New
                      </span>
                    )}
                    <AlertBadge
                      searchId={search.id}
                      value={search.alertFrequency ?? 'daily'}
                      open={alertMenu?.searchId === search.id}
                      onToggle={(rect) => openAlertMenu(search.id, rect)}
                    />
                  </div>
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
                      <span className="shrink-0 rounded-full border border-[var(--color-brand-600)] bg-[var(--color-brand-50)] px-3 py-2 type-caption text-[var(--color-brand-700)]">
                        Updated
                      </span>
                    ) : isSelected && activeSearchDirty ? (
                      <>
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
                      </>
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
          {searches.length > 0 && (
            <ActionRow
              onClick={() => { /* All saved searches — not linked yet */ }}
              size="md"
              className="group min-h-[84px] gap-3 border border-[var(--color-border)] bg-white px-4 py-3 font-normal hover:border-[var(--color-border-strong)]"
              leading={<PhotoFanThumbnail images={MOCK_LISTINGS.slice(0, 3).map((listing) => listing.images?.[0]).filter(Boolean) as string[]} />}
              trailing={<ChevronRight size={15} className="shrink-0 text-[var(--color-text-tertiary)]" />}
            >
              <span className="min-w-0 flex-1">
                <span className="type-heading-sm block truncate text-[var(--color-text-primary)]">All Saved Searches</span>
                <span className="block type-caption text-[var(--color-text-tertiary)]">View Every Search You’ve Saved</span>
              </span>
            </ActionRow>
          )}
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
        desktopPosition && (
          <div
            ref={desktopPanelRef}
            className="fixed z-[90] max-h-[min(640px,calc(100vh-12rem))] w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
            style={{ top: desktopPosition.top, left: desktopPosition.left }}
          >
            {content}
          </div>
        )
      )}
      {menuState && (() => {
        const menuSearchId = menuState.searchId;
        return (
        <RenameDeletePopover
          open
          confirmOpen={!!confirmDeleteId}
          right={menuState.right}
          bottom={menuState.bottom}
          renameLabel="Rename"
          deleteLabel="Delete"
          deleteTitle="Delete saved search?"
          deleteDescription="This will remove it from your saved searches."
          extraActionLabel="Email Alerts"
          extraActionIcon={<Bell size={14} />}
          onExtraAction={() => {
            closeMenu();
            openAlertMenuForCard(menuSearchId);
          }}
          onClose={closeMenu}
          onRename={() => {
            const active = searches.find((search) => search.id === menuSearchId);
            if (active) startRename(active.id, active.name);
          }}
          onRequestDelete={() => requestDelete(menuSearchId)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onConfirmDelete={confirmDelete}
        />
        );
      })()}
      {alertMenu && (() => {
        const target = searches.find((search) => search.id === alertMenu.searchId);
        const value = target?.alertFrequency ?? 'daily';
        return (
          <AnchoredPopover
            anchorRect={alertMenu.rect}
            open
            onClose={() => setAlertMenu(null)}
            align="left"
            className="saved-alert-popover fixed z-[120]"
            backdropClassName="z-[110]"
          >
            <DesktopSortMenu
              options={ALERT_OPTIONS}
              value={value}
              onChange={(frequency) => {
                setAlertFrequency(alertMenu.searchId, frequency);
                setAlertMenu(null);
              }}
            />
          </AnchoredPopover>
        );
      })()}
    </>
  );
}

const ALERT_OPTIONS: { value: AlertFrequency; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'none', label: 'No alert' },
];

// Per-card email-alert badge. The frequency picker it opens is owned by the
// panel (so the dots menu can open it too); this just toggles it via onToggle.
function AlertBadge({
  searchId,
  value,
  open,
  onToggle,
}: {
  searchId: string;
  value: AlertFrequency;
  open: boolean;
  onToggle: (rect: DOMRect) => void;
}) {
  const current = ALERT_OPTIONS.find((option) => option.value === value) ?? ALERT_OPTIONS[1];
  const muted = value === 'none';
  return (
    <button
      type="button"
      data-alert-badge={searchId}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(event.currentTarget.getBoundingClientRect());
      }}
      className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-2.5 type-micro text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)]"
    >
      <Bell size={12} className={muted ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-brand-600)]'} />
      {muted ? 'No alert' : `${current.label} alerts`}
      <ChevronDown size={12} className={`text-[var(--color-text-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

function getDefaultThumbnailListing(listings: Listing[]) {
  return [...listings].sort((a, b) => a.daysOnMarket - b.daysOnMarket)[0];
}

function getUnseenRecentListingCount(search: SavedSearch, visitedIds: Set<string>) {
  const matchingListings = filterListingsBySearchArea(
    applyFilters(MOCK_LISTINGS, search.filters),
    search.locations,
    search.areaBoundaries ?? search.areaBoundary ?? [],
    new Set(search.neighborhoodIds ?? [])
  );

  return matchingListings.filter(
    (listing) => listing.daysOnMarket <= 3 && !visitedIds.has(listing.id)
  ).length;
}
