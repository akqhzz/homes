'use client';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection } from '@/lib/types';
import { DEFAULT_COLLECTION_ID, useSavedStore } from '@/store/savedStore';

interface QuickSaveStore {
  preferredCollectionIds: string[];
  rememberCollections: (collectionIds: string[]) => void;
}

// Shared so every listing card (and card mode) sees the same "last saved"
// collections reactively — including collections that were just created.
const useQuickSaveStore = create<QuickSaveStore>()(
  persist(
    (set) => ({
      preferredCollectionIds: [],
      rememberCollections: (collectionIds) => set({ preferredCollectionIds: collectionIds }),
    }),
    { name: 'homes-quick-save-collection' }
  )
);

/**
 * Resolves the collection(s) a one-tap "quick save" should drop a listing into,
 * mirroring the set of collections the user last saved to. Falls back to the
 * first non-default collection when nothing has been saved yet.
 */
export function useQuickSaveCollection() {
  const collections = useSavedStore((state) => state.collections);
  const preferredCollectionIds = useQuickSaveStore((state) => state.preferredCollectionIds);
  const rememberCollections = useQuickSaveStore((state) => state.rememberCollections);

  const fallbackCollection = useMemo(
    () => collections.find((collection) => collection.id !== DEFAULT_COLLECTION_ID) ?? collections[0],
    [collections]
  );
  const quickSaveCollections = useMemo<Collection[]>(() => {
    const preferred = preferredCollectionIds
      .map((id) => collections.find((collection) => collection.id === id))
      .filter((collection): collection is Collection => Boolean(collection));
    if (preferred.length > 0) return preferred;
    return fallbackCollection ? [fallbackCollection] : [];
  }, [collections, fallbackCollection, preferredCollectionIds]);

  return { quickSaveCollections, rememberCollections };
}
