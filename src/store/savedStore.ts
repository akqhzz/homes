'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection } from '@/lib/types';
import {
  DEFAULT_COLLECTION_ID,
  addCollectionTag,
  addListingToCollection,
  addTagToListing,
  createCollection,
  deleteCollection,
  deleteCollectionTag,
  removeListingFromCollectionById,
  removeListingFromCollections,
  removeTagFromListing,
  renameCollection,
  renameCollectionTag,
  reorderCollectionListings,
  updateListingNote,
  withDefaultCollection,
} from '@/features/collections/lib/collectionActions';

export { DEFAULT_COLLECTION_ID };

interface SavedStore {
  collections: Collection[];
  likedListingIds: Set<string>;
  listingNotes: Record<string, string>;

  saveListing: (listingId: string) => void;
  unsaveListing: (listingId: string) => void;
  toggleLike: (listingId: string) => void;
  isLiked: (listingId: string) => boolean;
  addToCollection: (collectionId: string, listingId: string) => void;
  removeFromCollection: (collectionId: string, listingId: string) => void;
  removeFromAllCollections: (listingId: string) => void;
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addCollectionTag: (collectionId: string, tag: string) => void;
  renameCollectionTag: (collectionId: string, oldTag: string, newTag: string) => void;
  deleteCollectionTag: (collectionId: string, tag: string) => void;
  reorderListings: (collectionId: string, fromIndex: number, toIndex: number) => void;
  updateListingNote: (collectionId: string, listingId: string, note: string) => void;
  setListingNote: (listingId: string, note: string) => void;
  addTagToListing: (collectionId: string, listingId: string, tag: string) => void;
  removeTagFromListing: (collectionId: string, listingId: string, tag: string) => void;

  swipeDislike: (listingId: string) => void;
}

export const useSavedStore = create<SavedStore>()(
  persist(
    (set, get) => ({
      collections: withDefaultCollection([]),
      likedListingIds: new Set<string>(),
      listingNotes: {},

      saveListing: (listingId) =>
        set((s) => {
          if (s.likedListingIds.has(listingId)) return {};
          return { likedListingIds: new Set(s.likedListingIds).add(listingId) };
        }),

      unsaveListing: (listingId) =>
        set((s) => ({
          likedListingIds: new Set([...s.likedListingIds].filter((id) => id !== listingId)),
          collections: removeListingFromCollections(s.collections, listingId, new Date().toISOString()),
        })),

      toggleLike: (listingId) =>
        set((s) => {
          const next = new Set(s.likedListingIds);
          if (next.has(listingId)) next.delete(listingId);
          else next.add(listingId);
          return { likedListingIds: next };
        }),

      isLiked: (listingId) => get().likedListingIds.has(listingId),

      addToCollection: (collectionId, listingId) =>
        set((s) => ({
          collections: addListingToCollection(s.collections, collectionId, listingId, new Date().toISOString()),
        })),

      removeFromCollection: (collectionId, listingId) =>
        set((s) => ({
          collections: removeListingFromCollectionById(s.collections, collectionId, listingId, new Date().toISOString()),
        })),

      removeFromAllCollections: (listingId) =>
        set((s) => ({
          collections: removeListingFromCollections(s.collections, listingId, new Date().toISOString()),
        })),

      createCollection: (name) => {
        const id = `col-${Date.now()}`;
        set((s) => ({
          collections: createCollection(s.collections, id, name, new Date().toISOString()),
        }));
        return id;
      },

      renameCollection: (id, name) => {
        if (id === DEFAULT_COLLECTION_ID) return;
        set((s) => ({
          collections: renameCollection(s.collections, id, name, new Date().toISOString()),
        }));
      },

      deleteCollection: (id) => {
        if (id === DEFAULT_COLLECTION_ID) return;
        set((s) => ({ collections: deleteCollection(s.collections, id) }));
      },

      addCollectionTag: (collectionId, tag) =>
        set((s) => ({
          collections: addCollectionTag(s.collections, collectionId, tag, new Date().toISOString()),
        })),

      renameCollectionTag: (collectionId, oldTag, newTag) =>
        set((s) => ({
          collections: renameCollectionTag(s.collections, collectionId, oldTag, newTag, new Date().toISOString()),
        })),

      deleteCollectionTag: (collectionId, tag) =>
        set((s) => ({
          collections: deleteCollectionTag(s.collections, collectionId, tag, new Date().toISOString()),
        })),

      reorderListings: (collectionId, fromIndex, toIndex) =>
        set((s) => ({
          collections: reorderCollectionListings(s.collections, collectionId, fromIndex, toIndex, new Date().toISOString()),
        })),

      updateListingNote: (collectionId, listingId, note) =>
        set((s) => ({
          collections: updateListingNote(s.collections, collectionId, listingId, note),
          listingNotes: { ...s.listingNotes, [listingId]: note },
        })),

      setListingNote: (listingId, note) =>
        set((s) => ({
          listingNotes: { ...s.listingNotes, [listingId]: note },
          collections: s.collections.map((collection) =>
            collection.listings.some((listing) => listing.listingId === listingId)
              ? {
                  ...collection,
                  listings: collection.listings.map((listing) =>
                    listing.listingId === listingId ? { ...listing, notes: note } : listing
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        })),

      addTagToListing: (collectionId, listingId, tag) =>
        set((s) => ({
          collections: addTagToListing(s.collections, collectionId, listingId, tag, new Date().toISOString()),
        })),

      removeTagFromListing: (collectionId, listingId, tag) =>
        set((s) => ({
          collections: removeTagFromListing(s.collections, collectionId, listingId, tag),
        })),

      swipeDislike: () => {
        // Cards mode advances locally; there is no undo UI or downstream read of disliked state.
      },
    }),
    {
      name: 'homes-saved-v2',
      // Serialize Sets properly
      partialize: (s) => ({
        collections: withDefaultCollection(s.collections),
        likedListingIds: Array.from(s.likedListingIds),
        listingNotes: s.listingNotes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.collections = withDefaultCollection(state.collections);
          state.likedListingIds = new Set(state.likedListingIds as unknown as string[]);
          state.listingNotes = state.listingNotes ?? {};
        }
      },
    }
  )
);
