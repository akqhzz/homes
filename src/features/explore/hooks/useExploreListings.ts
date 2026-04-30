'use client';
import { useMemo } from 'react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import type { BoundingBox } from '@/lib/geo';
import { getListingsInViewport, rankCardModeListings } from '@/lib/listing-scope';
import { applyFilters, filterListingsBySearchArea } from '@/lib/search/filters';
import type { Coordinates, Location, SearchFilters } from '@/lib/types';

interface UseExploreListingsOptions {
  filters: SearchFilters;
  selectedLocations: Location[];
  appliedBoundaries: Coordinates[][];
  appliedNeighborhoods: Set<string>;
  viewportBounds: BoundingBox | null;
  visitedListingIds: string[];
  activeFilterCount: number;
}

export function useExploreListings({
  filters,
  selectedLocations,
  appliedBoundaries,
  appliedNeighborhoods,
  viewportBounds,
  visitedListingIds,
  activeFilterCount,
}: UseExploreListingsOptions) {
  const hasAppliedArea = appliedBoundaries.length > 0 || appliedNeighborhoods.size > 0;
  const hasSearchBoundary = selectedLocations.some((location) => (location.boundary?.length ?? 0) > 2);
  const hasVisibleBoundary = hasAppliedArea || hasSearchBoundary;

  const filteredListings = useMemo(
    () =>
      filterListingsBySearchArea(
        applyFilters(MOCK_LISTINGS, filters),
        selectedLocations,
        appliedBoundaries,
        appliedNeighborhoods
      ),
    [appliedBoundaries, appliedNeighborhoods, filters, selectedLocations]
  );

  const scopedListings = useMemo(
    () => (hasVisibleBoundary ? filteredListings : getListingsInViewport(filteredListings, viewportBounds)),
    [filteredListings, hasVisibleBoundary, viewportBounds]
  );

  const cardsModeListings = useMemo(
    () =>
      rankCardModeListings({
        filteredListings,
        scopedListings,
        visitedListingIds,
        hasBoundaryScope: hasVisibleBoundary,
      }),
    [filteredListings, hasVisibleBoundary, scopedListings, visitedListingIds]
  );

  return {
    cardsModeListings,
    filteredListings,
    hasActiveSearchCriteria: hasAppliedArea || activeFilterCount > 0 || selectedLocations.length > 0,
    hasAppliedArea,
    hasSearchBoundary,
    hasVisibleBoundary,
    scopedListings,
  };
}
