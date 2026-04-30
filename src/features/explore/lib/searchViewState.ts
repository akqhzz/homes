import { getBoundsCenter, getSuggestedZoom } from '@/lib/geo';
import { getAreaScopeBounds } from '@/lib/search/filters';
import type { Coordinates, SavedSearch } from '@/lib/types';

export function getSearchViewState(
  selectedLocations: SavedSearch['locations'],
  boundaries: Coordinates[][],
  neighborhoodIds: Set<string>
) {
  const bounds = getAreaScopeBounds(selectedLocations, boundaries, neighborhoodIds);

  if (!bounds) return null;

  const center = getBoundsCenter(bounds);
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: getSuggestedZoom(bounds),
  };
}
