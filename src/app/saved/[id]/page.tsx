'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownWideNarrow, LayoutList, Map, Tag } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';
import CollectionListingsGrid from '@/components/organisms/CollectionListingsGrid';
import { Collection } from '@/lib/types';
import BackButton from '@/components/atoms/BackButton';
import SortOptionsDrawer from '@/components/molecules/SortOptionsDrawer';
import CollectionTagsPanel from '@/components/organisms/CollectionTagsPanel';
import AnchoredPopover from '@/components/molecules/AnchoredPopover';
import { cn } from '@/lib/utils/cn';

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
const ListingsCarousel = dynamic(() => import('@/components/organisms/ListingsCarousel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });

type CollectionListingItem = (typeof MOCK_LISTINGS)[0] & {
  collectionData: Collection['listings'][number];
};

type CollectionView = 'list' | 'map';
type SortOption = 'manual' | 'price-asc' | 'price-desc';
type TagPanelState =
  | null
  | { mode: 'filter'; anchorRect: DOMRect | null }
  | { mode: 'assign'; listingId: string; anchorRect: DOMRect | null };

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'manual', label: 'Saved order' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
];

function getCollectionListings(collection: Collection): CollectionListingItem[] {
  return [...collection.listings]
    .sort((a, b) => a.order - b.order)
    .map((collectionListing) => {
      const listing = MOCK_LISTINGS.find((item) => item.id === collectionListing.listingId);
      return listing ? { ...listing, collectionData: collectionListing } : null;
    })
    .filter(Boolean) as CollectionListingItem[];
}

function sortCollectionListings(listings: CollectionListingItem[], sort: SortOption) {
  if (sort === 'manual') return listings;
  return [...listings].sort((a, b) =>
    sort === 'price-asc' ? a.price - b.price : b.price - a.price
  );
}

function getCollectionViewport(
  listings: Array<(typeof MOCK_LISTINGS)[0]>
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

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    collections,
    addCollectionTag,
    renameCollectionTag,
    deleteCollectionTag,
    addTagToListing,
    removeTagFromListing,
  } = useSavedStore();
  const { activePanel, isCarouselVisible, setCarouselVisible } = useUIStore();
  const setSelectedListingId = useMapStore((state) => state.setSelectedListingId);
  const setViewState = useMapStore((state) => state.setViewState);

  const [mobileView, setMobileView] = useState<CollectionView>('list');
  const [sort, setSort] = useState<SortOption>('manual');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [desktopSortAnchor, setDesktopSortAnchor] = useState<DOMRect | null>(null);
  const [tagPanelState, setTagPanelState] = useState<TagPanelState>(null);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [compactMobileHeaderProgress, setCompactMobileHeaderProgress] = useState(0);

  const collection = collections.find((item) => item.id === id);
  const listings = collection ? getCollectionListings(collection) : [];
  const availableTags = Array.from(
    new Set([...(collection?.tags ?? []), ...listings.flatMap((listing) => listing.collectionData.tags)])
  );
  const filteredListings = activeTagFilters.length === 0
    ? listings
    : listings.filter((listing) =>
        listing.collectionData.tags.some((tag) => activeTagFilters.includes(tag))
      );
  const sortedListings = sortCollectionListings(filteredListings, sort);
  const assigningListing = tagPanelState?.mode === 'assign'
    ? listings.find((listing) => listing.id === tagPanelState.listingId) ?? null
    : null;
  const hasActiveTagFilters = activeTagFilters.length > 0;

  useEffect(() => {
    setCarouselVisible(false);
    setSelectedListingId(null);
  }, [id, setCarouselVisible, setSelectedListingId]);

  useEffect(() => {
    setViewState(getCollectionViewport(sortedListings));
  }, [sortedListings, setViewState]);

  useEffect(() => {
    if (mobileView !== 'map') {
      setCarouselVisible(false);
      setSelectedListingId(null);
    }
  }, [mobileView, setCarouselVisible, setSelectedListingId]);

  if (!collection) {
    return (
      <PageShell showBottomNav={false} showDesktopHeader={false} desktopWide>
        <div className="flex h-full items-center justify-center">
          <p className="text-[#9CA3AF]">Collection not found</p>
        </div>
      </PageShell>
    );
  }

  const toggleListingTag = (listingId: string, tag: string) => {
    const listing = listings.find((item) => item.id === listingId);
    if (!listing) return;
    if (listing.collectionData.tags.includes(tag)) {
      removeTagFromListing(collection.id, listingId, tag);
      return;
    }
    addTagToListing(collection.id, listingId, tag);
  };

  const createTag = (tag: string) => {
    addCollectionTag(collection.id, tag);
    if (tagPanelState?.mode === 'assign' && tagPanelState.listingId) {
      addTagToListing(collection.id, tagPanelState.listingId, tag);
      return;
    }
    setActiveTagFilters((current) => (current.includes(tag) ? current : [...current, tag]));
  };

  const desktopActionButtonClassName =
    'flex h-11 items-center gap-2 rounded-full bg-[#F5F6F7] px-4 type-btn text-[#0F1729] transition-colors hover:bg-[#EBEBEB]';

  return (
    <PageShell showBottomNav={false} showDesktopHeader={false} desktopWide>
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="relative bg-white px-4 pb-4 pt-4 lg:px-8 lg:pb-5 lg:pt-6">
          <div className="mb-3 flex justify-start lg:hidden">
            <BackButton
              iconOnly
              className="h-11 w-11 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[#F5F6F7]"
            />
          </div>
          <CollectionWorkspaceHeader
            title={collection.name}
            subtitle={`${listings.length} listing${listings.length === 1 ? '' : 's'}`}
            compact={mobileView === 'map' || compactMobileHeaderProgress >= 0.98}
            compactProgress={mobileView === 'map' ? 1 : compactMobileHeaderProgress}
            rightSlot={(
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    setDesktopSortAnchor(null);
                    setTagPanelState({ mode: 'filter', anchorRect: event.currentTarget.getBoundingClientRect() });
                  }}
                  className={cn(
                    desktopActionButtonClassName,
                    hasActiveTagFilters && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
                  )}
                >
                  <Tag size={16} />
                  Tags
                  {hasActiveTagFilters && (
                    <span className="rounded-full bg-[#0F1729] px-1.5 py-0.5 type-nano text-white">
                      {activeTagFilters.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTagPanelState(null);
                    setDesktopSortAnchor((current) =>
                      current &&
                      current.top === rect.top &&
                      current.left === rect.left &&
                      current.width === rect.width
                        ? null
                        : rect
                    );
                  }}
                  className={desktopActionButtonClassName}
                >
                  <ArrowDownWideNarrow size={16} />
                  Sort
                </button>
              </>
            )}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:hidden">
            {mobileView === 'list' ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-4"
                onScroll={(event) => {
                  const raw = Math.max(0, Math.min(1, event.currentTarget.scrollTop / 120));
                  const eased = 1 - Math.pow(1 - raw, 2);
                  setCompactMobileHeaderProgress(eased);
                }}
              >
                <CollectionListingsGrid
                  listings={sortedListings}
                  cardTall
                  onTagClick={(listingId) => setTagPanelState({ mode: 'assign', listingId, anchorRect: null })}
                />
              </div>
            ) : (
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden bg-[#EEF2F6]">
                  <MapView listings={sortedListings} showListings />
                </div>
                {isCarouselVisible && sortedListings.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20">
                    <ListingsCarousel listings={sortedListings} className="pointer-events-auto pb-2" />
                  </div>
                )}
              </div>
            )}

            <SortOptionsDrawer
              title="Sort cards"
              open={showSortDrawer}
              value={sort}
              options={SORT_OPTIONS}
              onClose={() => setShowSortDrawer(false)}
              onChange={setSort}
            />

            <CollectionTagsPanel
              title={tagPanelState?.mode === 'assign' ? 'Assign tags' : 'Filter by tags'}
              open={tagPanelState !== null}
              mode={tagPanelState?.mode === 'assign' ? 'assign' : 'filter'}
              availableTags={availableTags}
              selectedTags={
                tagPanelState?.mode === 'assign'
                  ? assigningListing?.collectionData.tags ?? []
                  : activeTagFilters
              }
              onClose={() => setTagPanelState(null)}
              onToggleTag={(tag) => {
                if (tagPanelState?.mode === 'assign' && tagPanelState.listingId) {
                  toggleListingTag(tagPanelState.listingId, tag);
                  return;
                }
                setActiveTagFilters((current) =>
                  current.includes(tag)
                    ? current.filter((item) => item !== tag)
                    : [...current, tag]
                );
              }}
              onCreateTag={createTag}
              onRenameTag={(oldTag, newTag) => renameCollectionTag(collection.id, oldTag, newTag)}
              onDeleteTag={(tag) => deleteCollectionTag(collection.id, tag)}
            />

            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <div className="pointer-events-auto flex items-center rounded-full bg-white px-1.5 py-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]">
                <button
                  type="button"
                  aria-label={mobileView === 'list' ? 'Map view' : 'List view'}
                  onClick={() => {
                    setShowSortDrawer(false);
                    setTagPanelState(null);
                    setMobileView((value) => (value === 'list' ? 'map' : 'list'));
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#0F1729] transition-colors hover:bg-[#F5F6F7]"
                >
                  {mobileView === 'list' ? <Map size={18} /> : <LayoutList size={18} />}
                </button>
                {mobileView === 'list' && (
                  <button
                    type="button"
                    aria-label="Sort"
                    onClick={() => {
                      setTagPanelState(null);
                      setShowSortDrawer(true);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#0F1729] transition-colors hover:bg-[#F5F6F7]"
                  >
                    <ArrowDownWideNarrow size={18} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Tags"
                  onClick={() => {
                    setShowSortDrawer(false);
                    setTagPanelState({ mode: 'filter', anchorRect: null });
                  }}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-full text-[#0F1729] transition-colors hover:bg-[#F5F6F7]',
                    hasActiveTagFilters && 'shadow-[inset_0_0_0_1.5px_#374151]'
                  )}
                >
                  <Tag size={18} />
                  {hasActiveTagFilters && (
                    <span className="absolute right-[7px] top-[7px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0F1729] px-1 type-nano text-white">
                      {activeTagFilters.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-[1872px] min-w-0 flex-1 overflow-hidden lg:flex">
            <div className="relative min-w-0 flex-1 lg:m-4 lg:mr-2 lg:overflow-hidden lg:rounded-[28px]">
              <MapView listings={sortedListings} showListings />
            </div>

            <div className="hidden shrink-0 overflow-hidden lg:block lg:w-[688px] 3xl:w-[1024px]">
              <div className="h-full overflow-y-auto px-4 py-4">
                <CollectionListingsGrid
                  listings={sortedListings}
                  onTagClick={(listingId, anchorRect) => {
                    setDesktopSortAnchor(null);
                    setTagPanelState({ mode: 'assign', listingId, anchorRect });
                  }}
                />
              </div>
            </div>

            <AnchoredPopover
              open={!!desktopSortAnchor}
              anchorRect={desktopSortAnchor}
              onClose={() => setDesktopSortAnchor(null)}
              className="fixed z-[60] w-[22rem] rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
            >
              <div>
                {SORT_OPTIONS.map((option) => {
                  const selected = sort === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSort(option.value);
                        setDesktopSortAnchor(null);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors',
                        selected ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]'
                      )}
                    >
                      <span className="type-btn">{option.label}</span>
                      {selected && <span className="type-caption text-[#0F1729]">Active</span>}
                    </button>
                  );
                })}
              </div>
            </AnchoredPopover>

            <AnchoredPopover
              open={!!tagPanelState}
              anchorRect={tagPanelState?.anchorRect ?? null}
              onClose={() => setTagPanelState(null)}
              className="fixed z-[60]"
            >
              <div>
                <CollectionTagsPanel
                  title={tagPanelState?.mode === 'assign' ? 'Assign tags' : 'Filter by tags'}
                  open={!!tagPanelState}
                  mode={tagPanelState?.mode === 'assign' ? 'assign' : 'filter'}
                  availableTags={availableTags}
                  selectedTags={
                    tagPanelState?.mode === 'assign'
                      ? assigningListing?.collectionData.tags ?? []
                      : activeTagFilters
                  }
                  onClose={() => setTagPanelState(null)}
                  onToggleTag={(tag) => {
                    if (tagPanelState?.mode === 'assign' && tagPanelState.listingId) {
                      toggleListingTag(tagPanelState.listingId, tag);
                      return;
                    }
                    setActiveTagFilters((current) =>
                      current.includes(tag)
                        ? current.filter((item) => item !== tag)
                        : [...current, tag]
                    );
                  }}
                  onCreateTag={createTag}
                  onRenameTag={(oldTag, newTag) => renameCollectionTag(collection.id, oldTag, newTag)}
                  onDeleteTag={(tag) => deleteCollectionTag(collection.id, tag)}
                  desktop
                />
              </div>
            </AnchoredPopover>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activePanel === 'listing-detail' && <ListingDetailSheet key="detail" />}
      </AnimatePresence>
    </PageShell>
  );
}
