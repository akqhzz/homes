export type MobileCarouselSelectionSource = 'marker' | 'carousel' | null;

export interface MobileCarouselSelectionState {
  mobileCarouselListingId: string | null;
  mobileCarouselSelectionSource: MobileCarouselSelectionSource;
  mobileCarouselSelectionVersion: number;
}

export function setMobileCarouselSelection(
  state: MobileCarouselSelectionState,
  listingId: string | null,
  source: MobileCarouselSelectionSource = null
): MobileCarouselSelectionState {
  return {
    mobileCarouselListingId: listingId,
    mobileCarouselSelectionSource: source,
    mobileCarouselSelectionVersion: state.mobileCarouselSelectionVersion + 1,
  };
}

export function markListingVisited(visitedListingIds: string[], listingId: string) {
  return visitedListingIds.includes(listingId)
    ? visitedListingIds
    : [...visitedListingIds, listingId];
}
