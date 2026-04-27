'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Location } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { getMatchingNeighborhoodId } from '@/lib/search/utils';

interface UseLocationSearchResult {
  results: Location[];
  isLoading: boolean;
}

function getExcludedNeighborhoodIdSet(selectedLocations: Location[], excludedNeighborhoodIds: string[]) {
  const excludedMatchedNeighborhoodIds = new Set(excludedNeighborhoodIds);

  selectedLocations.forEach((location) => {
    const matchingNeighborhoodId = getMatchingNeighborhoodId(location);
    if (matchingNeighborhoodId) excludedMatchedNeighborhoodIds.add(matchingNeighborhoodId);
  });

  return excludedMatchedNeighborhoodIds;
}

function shouldExcludeLocation(
  location: Location,
  excludedLocationIds: Set<string>,
  excludedNeighborhoodIdSet: Set<string>
) {
  if (excludedLocationIds.has(location.id)) return true;
  const matchingNeighborhoodId = getMatchingNeighborhoodId(location);
  return matchingNeighborhoodId ? excludedNeighborhoodIdSet.has(matchingNeighborhoodId) : false;
}

export function useLocationSearch(
  query: string,
  selectedLocations: Location[],
  enabled = true,
  excludedNeighborhoodIds: string[] = []
): UseLocationSearchResult {
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const excludedIds = new Set(selectedLocations.map((location) => location.id));
  const excludedNeighborhoodIdSet = getExcludedNeighborhoodIdSet(selectedLocations, excludedNeighborhoodIds);

  const fallbackResults = MOCK_NEIGHBORHOODS.slice(0, 8)
    .map<Location>((neighborhood) => ({
      id: neighborhood.id,
      name: neighborhood.name,
      type: 'neighborhood',
      coordinates: neighborhood.coordinates,
      city: neighborhood.city,
      province: 'ON',
      boundary: neighborhood.boundary,
    }))
    .filter((location) => !shouldExcludeLocation(location, excludedIds, excludedNeighborhoodIdSet));

  useEffect(() => {
    if (!enabled || !deferredQuery) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const excludedIds = new Set(selectedLocations.map((location) => location.id));
        const excludedNeighborhoodIdSet = getExcludedNeighborhoodIdSet(selectedLocations, excludedNeighborhoodIds);
        const response = await fetch(`/api/mapbox/search?q=${encodeURIComponent(deferredQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setResults([]);
          return;
        }

        const payload = (await response.json()) as { results?: Location[] };
        setResults(
          (payload.results ?? []).filter(
            (location) => !shouldExcludeLocation(location, excludedIds, excludedNeighborhoodIdSet)
          )
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredQuery, enabled, excludedNeighborhoodIds, selectedLocations]);

  return {
    results: !enabled ? [] : deferredQuery ? results : fallbackResults,
    isLoading: enabled && Boolean(deferredQuery) ? isLoading : false,
  };
}
