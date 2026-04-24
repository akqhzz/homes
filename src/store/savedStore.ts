'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection } from '@/lib/types';

interface SavedStore {
  collections: Collection[];
  likedListingIds: Set<string>;
  dislikedListingIds: Set<string>;

  toggleLike: (listingId: string) => void;
  isLiked: (listingId: string) => boolean;
  addToCollection: (collectionId: string, listingId: string) => void;
  removeFromCollection: (collectionId: string, listingId: string) => void;
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addCollectionTag: (collectionId: string, tag: string) => void;
  renameCollectionTag: (collectionId: string, oldTag: string, newTag: string) => void;
  deleteCollectionTag: (collectionId: string, tag: string) => void;
  reorderListings: (collectionId: string, fromIndex: number, toIndex: number) => void;
  updateListingNote: (collectionId: string, listingId: string, note: string) => void;
  addTagToListing: (collectionId: string, listingId: string, tag: string) => void;
  removeTagFromListing: (collectionId: string, listingId: string, tag: string) => void;

  swipeDislike: (listingId: string) => void;
  swipeUndo: () => void;
  swipeHistory: string[];
}

export const useSavedStore = create<SavedStore>()(
  persist(
    (set, get) => ({
      collections: [],
      likedListingIds: new Set<string>(),
      dislikedListingIds: new Set<string>(),
      swipeHistory: [],

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
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            if (c.listings.some((l) => l.listingId === listingId)) return c;
            return {
              ...c,
              listings: [
                ...c.listings,
                { listingId, addedAt: new Date().toISOString(), notes: '', tags: [], order: c.listings.length },
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      removeFromCollection: (collectionId, listingId) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              listings: c.listings
                .filter((l) => l.listingId !== listingId)
                .map((l, i) => ({ ...l, order: i })),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      createCollection: (name) => {
        const id = `col-${Date.now()}`;
        set((s) => ({
          collections: [
            ...s.collections,
            {
              id,
              name,
              listings: [],
              collaborators: [],
              tags: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      renameCollection: (id, name) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      addCollectionTag: (collectionId, tag) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            if (c.tags.includes(tag)) return c;
            return {
              ...c,
              tags: [...c.tags, tag],
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      renameCollectionTag: (collectionId, oldTag, newTag) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const normalized = newTag.trim();
            if (!normalized || oldTag === normalized) return c;
            return {
              ...c,
              tags: c.tags.map((tag) => (tag === oldTag ? normalized : tag)),
              listings: c.listings.map((listing) => ({
                ...listing,
                tags: listing.tags.map((tag) => (tag === oldTag ? normalized : tag)),
              })),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      deleteCollectionTag: (collectionId, tag) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              tags: c.tags.filter((item) => item !== tag),
              listings: c.listings.map((listing) => ({
                ...listing,
                tags: listing.tags.filter((item) => item !== tag),
              })),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      reorderListings: (collectionId, fromIndex, toIndex) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const listings = [...c.listings].sort((a, b) => a.order - b.order);
            const [moved] = listings.splice(fromIndex, 1);
            listings.splice(toIndex, 0, moved);
            return {
              ...c,
              listings: listings.map((l, i) => ({ ...l, order: i })),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateListingNote: (collectionId, listingId, note) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              listings: c.listings.map((l) =>
                l.listingId === listingId ? { ...l, notes: note } : l
              ),
            };
          }),
        })),

      addTagToListing: (collectionId, listingId, tag) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              listings: c.listings.map((l) =>
                l.listingId === listingId && !l.tags.includes(tag)
                  ? { ...l, tags: [...l.tags, tag] }
                  : l
              ),
              tags: c.tags.includes(tag) ? c.tags : [...c.tags, tag],
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      removeTagFromListing: (collectionId, listingId, tag) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              listings: c.listings.map((l) =>
                l.listingId === listingId
                  ? { ...l, tags: l.tags.filter((t) => t !== tag) }
                  : l
              ),
            };
          }),
        })),

      swipeDislike: (listingId) =>
        set((s) => ({
          dislikedListingIds: new Set([...s.dislikedListingIds, listingId]),
          swipeHistory: [...s.swipeHistory, listingId],
        })),

      swipeUndo: () =>
        set((s) => {
          if (s.swipeHistory.length === 0) return s;
          const prev = [...s.swipeHistory];
          const last = prev.pop()!;
          const disliked = new Set(s.dislikedListingIds);
          disliked.delete(last);
          const liked = new Set(s.likedListingIds);
          liked.delete(last);
          return { swipeHistory: prev, dislikedListingIds: disliked, likedListingIds: liked };
        }),
    }),
    {
      name: 'homes-saved-v2',
      // Serialize Sets properly
      partialize: (s) => ({
        collections: s.collections,
        likedListingIds: Array.from(s.likedListingIds),
        dislikedListingIds: Array.from(s.dislikedListingIds),
        swipeHistory: s.swipeHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.likedListingIds = new Set(state.likedListingIds as unknown as string[]);
          state.dislikedListingIds = new Set(state.dislikedListingIds as unknown as string[]);
        }
      },
    }
  )
);
