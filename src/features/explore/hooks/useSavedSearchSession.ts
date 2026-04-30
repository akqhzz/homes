'use client';
import { useEffect, useMemo } from 'react';
import type { Coordinates, Location, SavedSearch, SearchFilters } from '@/lib/types';
import {
  areSearchSnapshotsEqual,
  createSearchSnapshot,
  searchToSnapshot,
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
  const activeSavedSearch = useMemo(
    () => searches.find((search) => search.id === activeSearchId) ?? null,
    [activeSearchId, searches]
  );

  const activeSearchDirty = useMemo(() => {
    if (!activeSavedSearch) return false;
    return !areSearchSnapshotsEqual(
      createSearchSnapshot(selectedLocations, filters, appliedBoundaries, appliedNeighborhoods),
      searchToSnapshot(activeSavedSearch)
    );
  }, [activeSavedSearch, appliedBoundaries, appliedNeighborhoods, filters, selectedLocations]);

  useEffect(() => {
    setActiveSearchDirty(activeSearchDirty);
  }, [activeSearchDirty, setActiveSearchDirty]);

  const updateActiveSearch = (searchId: string) => {
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
