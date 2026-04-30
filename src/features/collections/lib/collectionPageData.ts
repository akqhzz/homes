import type { Collection, Listing } from '@/lib/types';

export type CollectionListingItem = Listing & {
  collectionData: Collection['listings'][number];
};

export type CollectionSortOption = 'manual' | 'price-asc' | 'price-desc';

export const COLLECTION_SORT_OPTIONS: Array<{ value: CollectionSortOption; label: string }> = [
  { value: 'manual', label: 'Saved order' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
];

export function getCollectionListings(
  collection: Collection,
  listingCatalog: Listing[]
): CollectionListingItem[] {
  return [...collection.listings]
    .sort((a, b) => a.order - b.order)
    .map((collectionListing) => {
      const listing = listingCatalog.find((item) => item.id === collectionListing.listingId);
      return listing ? { ...listing, collectionData: collectionListing } : null;
    })
    .filter(Boolean) as CollectionListingItem[];
}

export function sortCollectionListings(
  listings: CollectionListingItem[],
  sort: CollectionSortOption
) {
  if (sort === 'manual') return listings;
  return [...listings].sort((a, b) =>
    sort === 'price-asc' ? a.price - b.price : b.price - a.price
  );
}

export function getCollectionViewport(
  listings: Listing[]
): { longitude: number; latitude: number; zoom: number } {
  if (listings.length === 0) {
    return { longitude: -79.3832, latitude: 43.6532, zoom: 11.8 };
  }

  const latitude =
    listings.reduce((sum, listing) => sum + listing.coordinates.lat, 0) / listings.length;
  const longitude =
    listings.reduce((sum, listing) => sum + listing.coordinates.lng, 0) / listings.length;

  return {
    longitude,
    latitude,
    zoom: listings.length === 1 ? 13.8 : 12.7,
  };
}
