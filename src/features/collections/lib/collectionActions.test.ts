import assert from 'node:assert/strict';
import test from 'node:test';
import type { Collection } from '@/lib/types';
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
} from './collectionActions.ts';

const now = '2026-04-29T00:00:00.000Z';

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'col-1',
    name: 'Collection',
    listings: [],
    collaborators: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test('withDefaultCollection restores the required default collection identity', () => {
  const collections = withDefaultCollection([
    collection({ id: DEFAULT_COLLECTION_ID, name: 'Renamed default', tags: ['saved'] }),
    collection({ id: 'col-other', name: 'Other' }),
  ]);

  assert.deepEqual(collections.map((item) => item.id), ['col-other', DEFAULT_COLLECTION_ID]);
  assert.equal(collections[1].name, 'My Favorites');
  assert.deepEqual(collections[1].tags, ['saved']);
});

test('addListingToCollection appends a listing once and assigns order', () => {
  const collections = addListingToCollection([collection()], 'col-1', 'lst-1', now);
  const duplicateAttempt = addListingToCollection(collections, 'col-1', 'lst-1', '2026-04-30T00:00:00.000Z');

  assert.equal(collections[0].listings.length, 1);
  assert.deepEqual(collections[0].listings[0], {
    listingId: 'lst-1',
    addedAt: now,
    notes: '',
    tags: [],
    order: 0,
  });
  assert.equal(duplicateAttempt[0], collections[0]);
});

test('remove listing helpers compact order values', () => {
  const source = collection({
    listings: [
      { listingId: 'lst-1', addedAt: now, notes: '', tags: [], order: 0 },
      { listingId: 'lst-2', addedAt: now, notes: '', tags: [], order: 1 },
      { listingId: 'lst-3', addedAt: now, notes: '', tags: [], order: 2 },
    ],
  });

  const byCollection = removeListingFromCollectionById([source], 'col-1', 'lst-2', '2026-04-30T00:00:00.000Z');
  assert.deepEqual(byCollection[0].listings.map((listing) => [listing.listingId, listing.order]), [
    ['lst-1', 0],
    ['lst-3', 1],
  ]);
  assert.equal(byCollection[0].updatedAt, '2026-04-30T00:00:00.000Z');

  const fromAll = removeListingFromCollections([source, collection({ id: 'col-2', listings: source.listings })], 'lst-1', now);
  assert.deepEqual(fromAll.map((item) => item.listings.map((listing) => listing.listingId)), [
    ['lst-2', 'lst-3'],
    ['lst-2', 'lst-3'],
  ]);
});

test('create, rename, and delete collection respect default collection guardrails', () => {
  const created = createCollection([], 'col-new', 'Weekend tours', now);
  assert.deepEqual(created.map((item) => item.id), ['col-new', DEFAULT_COLLECTION_ID]);

  const renamed = renameCollection(created, 'col-new', 'Shortlist', '2026-04-30T00:00:00.000Z');
  assert.equal(renamed[0].name, 'Shortlist');
  assert.equal(renamed[0].updatedAt, '2026-04-30T00:00:00.000Z');

  const defaultRename = renameCollection(renamed, DEFAULT_COLLECTION_ID, 'Nope', now);
  assert.equal(defaultRename[1].name, 'My Favorites');

  const deleteDefault = deleteCollection(renamed, DEFAULT_COLLECTION_ID);
  assert.equal(deleteDefault, renamed);

  const deleted = deleteCollection(renamed, 'col-new');
  assert.deepEqual(deleted.map((item) => item.id), [DEFAULT_COLLECTION_ID]);
});

test('createCollection inserts new collections before older user collections', () => {
  const source = [
    collection({ id: 'col-older', name: 'Older' }),
    collection({ id: DEFAULT_COLLECTION_ID, name: 'My Favorites' }),
  ];

  const created = createCollection(source, 'col-newer', 'Newer', now);

  assert.deepEqual(created.map((item) => item.id), ['col-newer', 'col-older', DEFAULT_COLLECTION_ID]);
});

test('reorderCollectionListings sorts by current order before moving', () => {
  const source = collection({
    listings: [
      { listingId: 'lst-3', addedAt: now, notes: '', tags: [], order: 2 },
      { listingId: 'lst-1', addedAt: now, notes: '', tags: [], order: 0 },
      { listingId: 'lst-2', addedAt: now, notes: '', tags: [], order: 1 },
    ],
  });

  const reordered = reorderCollectionListings([source], 'col-1', 0, 2, '2026-04-30T00:00:00.000Z');

  assert.deepEqual(reordered[0].listings.map((listing) => [listing.listingId, listing.order]), [
    ['lst-2', 0],
    ['lst-3', 1],
    ['lst-1', 2],
  ]);
  assert.equal(reordered[0].updatedAt, '2026-04-30T00:00:00.000Z');
});

test('collection tag helpers add, rename, and delete tags across listings', () => {
  const source = collection({
    tags: ['tour'],
    listings: [
      { listingId: 'lst-1', addedAt: now, notes: '', tags: ['tour', 'maybe'], order: 0 },
      { listingId: 'lst-2', addedAt: now, notes: '', tags: ['tour'], order: 1 },
    ],
  });

  const added = addCollectionTag([source], 'col-1', 'priority', '2026-04-30T00:00:00.000Z');
  assert.deepEqual(added[0].tags, ['tour', 'priority']);
  assert.equal(added[0].updatedAt, '2026-04-30T00:00:00.000Z');
  assert.equal(addCollectionTag(added, 'col-1', 'priority', now)[0], added[0]);

  const renamed = renameCollectionTag(added, 'col-1', 'tour', ' shortlist ', '2026-05-01T00:00:00.000Z');
  assert.deepEqual(renamed[0].tags, ['shortlist', 'priority']);
  assert.deepEqual(renamed[0].listings.map((listing) => listing.tags), [['shortlist', 'maybe'], ['shortlist']]);
  assert.equal(renamed[0].updatedAt, '2026-05-01T00:00:00.000Z');
  assert.equal(renameCollectionTag(renamed, 'col-1', 'shortlist', '   ', now)[0], renamed[0]);

  const deleted = deleteCollectionTag(renamed, 'col-1', 'shortlist', '2026-05-02T00:00:00.000Z');
  assert.deepEqual(deleted[0].tags, ['priority']);
  assert.deepEqual(deleted[0].listings.map((listing) => listing.tags), [['maybe'], []]);
  assert.equal(deleted[0].updatedAt, '2026-05-02T00:00:00.000Z');
});

test('listing note and tag helpers update only matching listing', () => {
  const source = collection({
    tags: ['tour'],
    listings: [
      { listingId: 'lst-1', addedAt: now, notes: '', tags: ['tour'], order: 0 },
      { listingId: 'lst-2', addedAt: now, notes: 'keep', tags: [], order: 1 },
    ],
  });

  const noted = updateListingNote([source], 'col-1', 'lst-2', 'Call agent');
  assert.equal(noted[0].listings[0], source.listings[0]);
  assert.equal(noted[0].listings[1].notes, 'Call agent');
  assert.equal(noted[0].updatedAt, source.updatedAt);

  const tagged = addTagToListing(noted, 'col-1', 'lst-2', 'favorite', '2026-04-30T00:00:00.000Z');
  assert.deepEqual(tagged[0].tags, ['tour', 'favorite']);
  assert.deepEqual(tagged[0].listings[1].tags, ['favorite']);
  assert.equal(tagged[0].updatedAt, '2026-04-30T00:00:00.000Z');

  const duplicate = addTagToListing(tagged, 'col-1', 'lst-2', 'favorite', '2026-05-01T00:00:00.000Z');
  assert.deepEqual(duplicate[0].listings[1].tags, ['favorite']);
  assert.deepEqual(duplicate[0].tags, ['tour', 'favorite']);

  const removed = removeTagFromListing(duplicate, 'col-1', 'lst-2', 'favorite');
  assert.deepEqual(removed[0].listings[1].tags, []);
  assert.deepEqual(removed[0].tags, ['tour', 'favorite']);
  assert.equal(removed[0].updatedAt, duplicate[0].updatedAt);
});
