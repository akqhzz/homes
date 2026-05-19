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
    const baselineSnapshot = searchToSnapshot(activeSavedSearch);
    setBaselineSnapshots((snapshots) => ({
      ...snapshots,
      [activeSavedSearch.id]: baselineSnapshot,
    }));
  }, [activeSavedSearch]);

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
