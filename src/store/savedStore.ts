'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection } from '@/lib/types';

export const DEFAULT_COLLECTION_ID = 'col-my-favorites';

const DEFAULT_COLLECTION: Collection = {
  id: DEFAULT_COLLECTION_ID,
  name: 'My Favorites',
  listings: [],
  collaborators: [],
  tags: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};

function withDefaultCollection(collections: Collection[]) {
  const defaultCollection = collections.find((collection) => collection.id === DEFAULT_COLLECTION_ID);
  const otherCollections = collections.filter((collection) => collection.id !== DEFAULT_COLLECTION_ID);
  return [
    ...otherCollections,
    {
      ...DEFAULT_COLLECTION,
      ...defaultCollection,
      id: DEFAULT_COLLECTION_ID,
      name: DEFAULT_COLLECTION.name,
    },
  ];
}

interface SavedStore {
  collections: Collection[];
  likedListingIds: Set<string>;

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
  addTagToListing: (collectionId: string, listingId: string, tag: string) => void;
  removeTagFromListing: (collectionId: string, listingId: string, tag: string) => void;

  swipeDislike: (listingId: string) => void;
}

export const useSavedStore = create<SavedStore>()(
  persist(
    (set, get) => ({
      collections: withDefaultCollection([]),
      likedListingIds: new Set<string>(),

      saveListing: (listingId) =>
        set((s) => {
          if (s.likedListingIds.has(listingId)) return {};
          return { likedListingIds: new Set(s.likedListingIds).add(listingId) };
        }),

      unsaveListing: (listingId) =>
        set((s) => ({
          likedListingIds: new Set([...s.likedListingIds].filter((id) => id !== listingId)),
          collections: s.collections.map((c) => ({
            ...c,
            listings: c.listings
              .filter((l) => l.listingId !== listingId)
              .map((l, i) => ({ ...l, order: i })),
            updatedAt: new Date().toISOString(),
          })),
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
          collections: withDefaultCollection(s.collections).map((c) => {
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

      removeFromAllCollections: (listingId) =>
        set((s) => ({
          collections: s.collections.map((c) => ({
            ...c,
            listings: c.listings
              .filter((l) => l.listingId !== listingId)
              .map((l, i) => ({ ...l, order: i })),
            updatedAt: new Date().toISOString(),
          })),
        })),

      createCollection: (name) => {
        const id = `col-${Date.now()}`;
        set((s) => ({
          collections: [
            ...withDefaultCollection(s.collections),
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

      renameCollection: (id, name) => {
        if (id === DEFAULT_COLLECTION_ID) return;
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCollection: (id) => {
        if (id === DEFAULT_COLLECTION_ID) return;
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }));
      },

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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.collections = withDefaultCollection(state.collections);
          state.likedListingIds = new Set(state.likedListingIds as unknown as string[]);
        }
      },
    }
  )
);
