'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Coordinates, Location, SavedSearch, SearchFilters } from '@/lib/types';
import {
  areSearchSnapshotsEqual,
  createSearchSnapshot,
  searchToSnapshot,
  type SearchSnapshot,
} from '@/lib/search/utils';

interface UseSavedSearchSessionOptions {
  searches: SavedSearch[];
  activeSearchId: string | null;
  selectedLocations: Location[];
  filters: SearchFilters;
  appliedBoundaries: Coordinates[][];
  appliedNeighborhoods: Set<string>;
  setActiveSearchDirty: (value: boolean) => void;
  updateSearch: (id: string, input: {
    name: string;
    locations: Location[];
    filters: SearchFilters;
    areaBoundary?: Coordinates[];
    areaBoundaries?: Coordinates[][];
    neighborhoodIds?: string[];
  }) => void;
}

export function useSavedSearchSession({
  searches,
  activeSearchId,
  selectedLocations,
  filters,
  appliedBoundaries,
  appliedNeighborhoods,
  setActiveSearchDirty,
  updateSearch,
}: UseSavedSearchSessionOptions) {
  const previousActiveSearchIdRef = useRef<string | null>(null);
  const knownSearchIdsRef = useRef<Set<string>>(new Set());
  const [baselineSnapshots, setBaselineSnapshots] = useState<Record<string, SearchSnapshot>>({});
  const activeSavedSearch = useMemo(
    () => searches.find((search) => search.id === activeSearchId) ?? null,
    [activeSearchId, searches]
  );
  const currentSnapshot = useMemo(
    () => createSearchSnapshot(selectedLocations, filters, appliedBoundaries, appliedNeighborhoods),
    [appliedBoundaries, appliedNeighborhoods, filters, selectedLocations]
  );

  useEffect(() => {
    if (!activeSavedSearch || previousActiveSearchIdRef.current === activeSavedSearch.id) return;
    previousActiveSearchIdRef.current = activeSavedSearch.id;
    // A just-created search already reflects the live state, so baseline it from
    // the current snapshot — otherwise re-deriving from the saved object can
    // differ slightly and flag it dirty (showing "Update?") the moment it's made.
    const isFreshlyCreated = !knownSearchIdsRef.current.has(activeSavedSearch.id);
    const baselineSnapshot = isFreshlyCreated ? currentSnapshot : searchToSnapshot(activeSavedSearch);
    setBaselineSnapshots((snapshots) => ({
      ...snapshots,
      [activeSavedSearch.id]: baselineSnapshot,
    }));
  }, [activeSavedSearch, currentSnapshot]);

  // Remember which searches we've already seen so the next activation can tell a
  // freshly-created search from one that's being loaded.
  useEffect(() => {
    searches.forEach((search) => knownSearchIdsRef.current.add(search.id));
  }, [searches]);

  useEffect(() => {
    if (activeSavedSearch) return;
    previousActiveSearchIdRef.current = null;
  }, [activeSavedSearch]);

  const activeSearchDirty = useMemo(() => {
    if (!activeSavedSearch) return false;
    return !areSearchSnapshotsEqual(currentSnapshot, baselineSnapshots[activeSavedSearch.id] ?? searchToSnapshot(activeSavedSearch));
  }, [activeSavedSearch, baselineSnapshots, currentSnapshot]);

  useEffect(() => {
    setActiveSearchDirty(activeSearchDirty);
  }, [activeSearchDirty, setActiveSearchDirty]);

  const updateActiveSearch = (searchId: string) => {
    setBaselineSnapshots((snapshots) => ({
      ...snapshots,
      [searchId]: currentSnapshot,
    }));
    setActiveSearchDirty(false);
    updateSearch(searchId, {
      name: searches.find((search) => search.id === searchId)?.name ?? 'Saved Search',
      locations: selectedLocations,
      filters,
      areaBoundary: appliedBoundaries[0],
      areaBoundaries: appliedBoundaries,
      neighborhoodIds: [...appliedNeighborhoods],
    });
  };

  return {
    activeSavedSearch,
    activeSearchDirty,
    updateActiveSearch,
  };
}
