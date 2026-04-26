import { pointInBoundingBox, type BoundingBox } from '@/lib/geo';
import type { Listing } from '@/lib/types';

export function getListingsInViewport(listings: Listing[], viewportBounds: BoundingBox | null) {
  if (!viewportBounds) return listings;
  return listings.filter((listing) => pointInBoundingBox(listing.coordinates, viewportBounds));
}

export function rankCardModeListings(options: {
  filteredListings: Listing[];
  scopedListings: Listing[];
  visitedListingIds: string[];
  hasBoundaryScope: boolean;
}) {
  const { filteredListings, scopedListings, visitedListingIds, hasBoundaryScope } = options;
  const visitedSet = new Set(visitedListingIds);
  const scopedIds = new Set(scopedListings.map((listing) => listing.id));

  const unvisitedScoped = scopedListings.filter((listing) => !visitedSet.has(listing.id));
  const visitedScoped = scopedListings.filter((listing) => visitedSet.has(listing.id));

  if (hasBoundaryScope) {
    return [...unvisitedScoped, ...visitedScoped];
  }

  const remaining = filteredListings.filter((listing) => !scopedIds.has(listing.id));
  return [...unvisitedScoped, ...visitedScoped, ...remaining];
}
