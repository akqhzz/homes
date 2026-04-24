'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Location } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';

interface UseLocationSearchResult {
  results: Location[];
  isLoading: boolean;
}

export function useLocationSearch(
  query: string,
  selectedLocations: Location[],
  enabled = true
): UseLocationSearchResult {
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

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
    .filter((location) => !selectedLocations.some((selected) => selected.id === location.id));

  useEffect(() => {
    if (!enabled || !deferredQuery) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/mapbox/search?q=${encodeURIComponent(deferredQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setResults([]);
          return;
        }

        const payload = (await response.json()) as { results?: Location[] };
        const excludedIds = new Set(selectedLocations.map((location) => location.id));
        setResults((payload.results ?? []).filter((location) => !excludedIds.has(location.id)));
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
  }, [deferredQuery, enabled, selectedLocations]);

  return {
    results: !enabled ? [] : deferredQuery ? results : fallbackResults,
    isLoading: enabled && Boolean(deferredQuery) ? isLoading : false,
  };
}
