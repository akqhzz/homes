import type { Collection } from '@/lib/types';

export const DEFAULT_COLLECTION_ID = 'col-my-favorites';

export const DEFAULT_COLLECTION: Collection = {
  id: DEFAULT_COLLECTION_ID,
  name: 'My Favorites',
  listings: [],
  collaborators: [],
  tags: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};

export function withDefaultCollection(collections: Collection[]) {
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

export function removeListingFromCollections(collections: Collection[], listingId: string, updatedAt: string) {
  return collections.map((collection) => removeListingFromCollection(collection, listingId, updatedAt));
}

export function addListingToCollection(
  collections: Collection[],
  collectionId: string,
  listingId: string,
  addedAt: string
) {
  return withDefaultCollection(collections).map((collection) => {
    if (collection.id !== collectionId) return collection;
    if (collection.listings.some((listing) => listing.listingId === listingId)) return collection;
    return {
      ...collection,
      listings: [
        ...collection.listings,
        { listingId, addedAt, notes: '', tags: [], order: collection.listings.length },
      ],
      updatedAt: addedAt,
    };
  });
}

export function removeListingFromCollection(collection: Collection, listingId: string, updatedAt: string) {
  return {
    ...collection,
    listings: collection.listings
      .filter((listing) => listing.listingId !== listingId)
      .map((listing, index) => ({ ...listing, order: index })),
    updatedAt,
  };
}

export function removeListingFromCollectionById(
  collections: Collection[],
  collectionId: string,
  listingId: string,
  updatedAt: string
) {
  return collections.map((collection) =>
    collection.id === collectionId ? removeListingFromCollection(collection, listingId, updatedAt) : collection
  );
}

export function createCollection(collections: Collection[], id: string, name: string, createdAt: string) {
  const normalizedCollections = withDefaultCollection(collections);
  const defaultCollection = normalizedCollections.find((collection) => collection.id === DEFAULT_COLLECTION_ID);
  const otherCollections = normalizedCollections.filter((collection) => collection.id !== DEFAULT_COLLECTION_ID);
  const newCollection = {
    id,
    name,
    listings: [],
    collaborators: [],
    tags: [],
    createdAt,
    updatedAt: createdAt,
  };

  return [
    newCollection,
    ...otherCollections,
    ...(defaultCollection ? [defaultCollection] : []),
  ];
}

export function renameCollection(collections: Collection[], id: string, name: string, updatedAt: string) {
  if (id === DEFAULT_COLLECTION_ID) return collections;
  return collections.map((collection) =>
    collection.id === id ? { ...collection, name, updatedAt } : collection
  );
}

export function deleteCollection(collections: Collection[], id: string) {
  if (id === DEFAULT_COLLECTION_ID) return collections;
  return collections.filter((collection) => collection.id !== id);
}

export function reorderCollectionListings(
  collections: Collection[],
  collectionId: string,
  fromIndex: number,
  toIndex: number,
  updatedAt: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    const listings = [...collection.listings].sort((a, b) => a.order - b.order);
    const [moved] = listings.splice(fromIndex, 1);
    if (!moved) return collection;
    listings.splice(toIndex, 0, moved);
    return {
      ...collection,
      listings: listings.map((listing, index) => ({ ...listing, order: index })),
      updatedAt,
    };
  });
}

export function addCollectionTag(
  collections: Collection[],
  collectionId: string,
  tag: string,
  updatedAt: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    if (collection.tags.includes(tag)) return collection;
    return {
      ...collection,
      tags: [...collection.tags, tag],
      updatedAt,
    };
  });
}

export function renameCollectionTag(
  collections: Collection[],
  collectionId: string,
  oldTag: string,
  newTag: string,
  updatedAt: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    const normalized = newTag.trim();
    if (!normalized || oldTag === normalized) return collection;
    return {
      ...collection,
      tags: collection.tags.map((tag) => (tag === oldTag ? normalized : tag)),
      listings: collection.listings.map((listing) => ({
        ...listing,
        tags: listing.tags.map((tag) => (tag === oldTag ? normalized : tag)),
      })),
      updatedAt,
    };
  });
}

export function deleteCollectionTag(
  collections: Collection[],
  collectionId: string,
  tag: string,
  updatedAt: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return {
      ...collection,
      tags: collection.tags.filter((item) => item !== tag),
      listings: collection.listings.map((listing) => ({
        ...listing,
        tags: listing.tags.filter((item) => item !== tag),
      })),
      updatedAt,
    };
  });
}

export function updateListingNote(
  collections: Collection[],
  collectionId: string,
  listingId: string,
  note: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return {
      ...collection,
      listings: collection.listings.map((listing) =>
        listing.listingId === listingId ? { ...listing, notes: note } : listing
      ),
    };
  });
}

export function addTagToListing(
  collections: Collection[],
  collectionId: string,
  listingId: string,
  tag: string,
  updatedAt: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return {
      ...collection,
      listings: collection.listings.map((listing) =>
        listing.listingId === listingId && !listing.tags.includes(tag)
          ? { ...listing, tags: [...listing.tags, tag] }
          : listing
      ),
      tags: collection.tags.includes(tag) ? collection.tags : [...collection.tags, tag],
      updatedAt,
    };
  });
}

export function removeTagFromListing(
  collections: Collection[],
  collectionId: string,
  listingId: string,
  tag: string
) {
  return collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    return {
      ...collection,
      listings: collection.listings.map((listing) =>
        listing.listingId === listingId
          ? { ...listing, tags: listing.tags.filter((item) => item !== tag) }
          : listing
      ),
    };
  });
}
