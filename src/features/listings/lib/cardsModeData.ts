import type { Listing } from '@/lib/types';

export const CARD_MODE_IMAGE_COUNT = 8;

export const FALLBACK_LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
];

export type CardsModeSortMode = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

export const CARDS_MODE_SORT_OPTIONS: { value: CardsModeSortMode; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'newest', label: 'Newest first' },
];

export function sortCardsModeListings(listings: Listing[], sortMode: CardsModeSortMode) {
  const next = [...listings];
  if (sortMode === 'price-asc') return next.sort((a, b) => a.price - b.price);
  if (sortMode === 'price-desc') return next.sort((a, b) => b.price - a.price);
  if (sortMode === 'newest') return next.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
  return next;
}

export function getCardsModeListingImages(listing: Pick<Listing, 'images'>) {
  const available = listing.images.length > 0 ? listing.images : FALLBACK_LISTING_IMAGES;
  return Array.from(
    { length: CARD_MODE_IMAGE_COUNT },
    (_, index) => available[index % available.length] || FALLBACK_LISTING_IMAGES[index % FALLBACK_LISTING_IMAGES.length]
  );
}
