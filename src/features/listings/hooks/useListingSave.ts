'use client';

import { useCallback } from 'react';
import { useSavedStore } from '@/store/savedStore';

export function useListingSave(listingId: string) {
  const isSaved = useSavedStore((state) => state.likedListingIds.has(listingId));
  const saveListing = useSavedStore((state) => state.saveListing);
  const unsaveListing = useSavedStore((state) => state.unsaveListing);

  const save = useCallback(() => {
    saveListing(listingId);
  }, [listingId, saveListing]);

  const unsave = useCallback(() => {
    unsaveListing(listingId);
  }, [listingId, unsaveListing]);

  return { isSaved, save, unsave };
}
