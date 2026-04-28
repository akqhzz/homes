'use client';
import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';

export default function ListingVisitTracker({ listingId }: { listingId: string }) {
  const markVisitedListing = useMapStore((state) => state.markVisitedListing);

  useEffect(() => {
    markVisitedListing(listingId);
  }, [listingId, markVisitedListing]);

  return null;
}
