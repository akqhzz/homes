import type { BoundingBox } from './geo';
import type { Listing } from '@/lib/types';

export function getListingsInViewport(listings: Listing[], viewportBounds: BoundingBox | null) {
  if (!viewportBounds) return listings;
  const [west, south, east, north] = viewportBounds;
  return listings.filter((listing) => {
    const { lng, lat } = listing.coordinates;
    return lng >= west && lng <= east && lat >= south && lat <= north;
  });
}

export function rankCardModeListings(options: {
  filteredListings: Listing[];
  scopedListings: Listing[];
  visitedListingIds: string[];
  savedListingIds: Iterable<string>;
  hasBoundaryScope: boolean;
}) {
  const { filteredListings, scopedListings, visitedListingIds, savedListingIds, hasBoundaryScope } = options;
  const visitedSet = new Set(visitedListingIds);
  const savedSet = new Set(savedListingIds);
  const scopedIds = new Set(scopedListings.map((listing) => listing.id));

  const rankByCardFreshness = (items: Listing[]) => [
    ...items.filter((listing) => !visitedSet.has(listing.id) && !savedSet.has(listing.id)),
    ...items.filter((listing) => !visitedSet.has(listing.id) && savedSet.has(listing.id)),
    ...items.filter((listing) => visitedSet.has(listing.id) && !savedSet.has(listing.id)),
    ...items.filter((listing) => visitedSet.has(listing.id) && savedSet.has(listing.id)),
  ];

  const rankedScoped = rankByCardFreshness(scopedListings);

  if (hasBoundaryScope) {
    return rankedScoped;
  }

  const remaining = filteredListings.filter((listing) => !scopedIds.has(listing.id));
  return [...rankedScoped, ...rankByCardFreshness(remaining)];
}
