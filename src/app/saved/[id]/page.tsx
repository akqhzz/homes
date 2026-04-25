'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownWideNarrow, LayoutList, Map, Tag } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';
import CollectionListingsGrid from '@/components/organisms/CollectionListingsGrid';
import CollectionListingsCarousel from '@/components/organisms/CollectionListingsCarousel';
import { Collection } from '@/lib/types';
import BackButton from '@/components/atoms/BackButton';
import ControlPillButton from '@/components/atoms/ControlPillButton';
import OverlayCloseButton from '@/components/atoms/OverlayCloseButton';
import DesktopSortMenu from '@/components/molecules/DesktopSortMenu';
import SortOptionsDrawer from '@/components/molecules/SortOptionsDrawer';
import CollectionTagsPanel from '@/components/organisms/CollectionTagsPanel';
import AnchoredPopover from '@/components/molecules/AnchoredPopover';
import { cn } from '@/lib/utils/cn';

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
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
  const router = useRouter();
  const handleClosePage = () => {
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.push('/');
      return;
    }
    router.back();
  };
  const {
    collections,
    addCollectionTag,
    renameCollectionTag,
    deleteCollectionTag,
    addTagToListing,
    removeTagFromListing,
    removeFromCollection,
  } = useSavedStore();
  const isLiked = useSavedStore((state) => state.isLiked);
  const toggleLike = useSavedStore((state) => state.toggleLike);
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
  const [pendingRemovalByCollection, setPendingRemovalByCollection] = useState<Record<string, string[]>>({});
  const pendingRemovalIdsRef = useRef<string[]>([]);

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
  const pendingRemovalIds = useMemo(
    () => (collection ? pendingRemovalByCollection[collection.id] ?? [] : []),
    [collection, pendingRemovalByCollection]
  );
  const mobileHeaderProgress = mobileView === 'map' ? 1 : compactMobileHeaderProgress;

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

  useEffect(() => {
    pendingRemovalIdsRef.current = pendingRemovalIds;
  }, [pendingRemovalIds]);

  useEffect(() => {
    const collectionId = collection?.id;
    return () => {
      if (!collectionId) return;
      pendingRemovalIdsRef.current.forEach((listingId) => removeFromCollection(collectionId, listingId));
    };
  }, [collection?.id, removeFromCollection]);

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

  const handleCollectionLikeToggle = (listingId: string) => {
    if (!collection) return;
    const pendingRemoval = pendingRemovalIds.includes(listingId);
    if (!pendingRemoval && isLiked(listingId)) {
      toggleLike(listingId);
      setPendingRemovalByCollection((current) => ({
        ...current,
        [collection.id]: [...(current[collection.id] ?? []), listingId],
      }));
      return;
    }
    setPendingRemovalByCollection((current) => ({
      ...current,
      [collection.id]: (current[collection.id] ?? []).filter((id) => id !== listingId),
    }));
  };

  const handleCollectionResave = (listingId: string, collectionId: string) => {
    if (!collection) return;
    if (collection.id !== collectionId) return;
    setPendingRemovalByCollection((current) => ({
      ...current,
      [collection.id]: (current[collection.id] ?? []).filter((id) => id !== listingId),
    }));
  };

  return (
    <PageShell showBottomNav={false} showDesktopHeader={false} desktopWide>
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="relative hidden bg-white px-4 pb-4 pt-4 lg:block lg:px-8 lg:pb-5 lg:pt-6">
          <CollectionWorkspaceHeader
            className="lg:min-h-0"
            title={collection.name}
            subtitle={`${listings.length} listing${listings.length === 1 ? '' : 's'}`}
            compact={mobileView === 'map'}
            compactProgress={mobileHeaderProgress}
            rightSlot={(
              <>
                <ControlPillButton
                  onClick={(event) => {
                    setDesktopSortAnchor(null);
                    setTagPanelState({ mode: 'filter', anchorRect: event.currentTarget.getBoundingClientRect() });
                  }}
                  active={hasActiveTagFilters}
                  badge={hasActiveTagFilters ? activeTagFilters.length : null}
                >
                  <Tag size={16} />
                  Tags
                </ControlPillButton>
                <ControlPillButton
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
                >
                  <ArrowDownWideNarrow size={16} />
                  Sort
                </ControlPillButton>
              </>
            )}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="relative flex h-full flex-col lg:hidden">
            {mobileView === 'list' && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
                <div
                  className="relative bg-white/94 px-4 backdrop-blur-[10px] transition-[padding,min-height] duration-300 ease-out"
                  style={{
                    paddingTop: `calc(env(safe-area-inset-top, 0px) + ${0.66 - mobileHeaderProgress * 0.2}rem)`,
                    paddingBottom: `${0.4 - mobileHeaderProgress * 0.32}rem`,
                    minHeight: `${68 - mobileHeaderProgress * 28}px`,
                  }}
                >
                  <OverlayCloseButton
                    onClick={handleClosePage}
                    className="pointer-events-auto absolute right-4"
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.42rem)' }}
                    variant="glass"
                  />
                  <div className="px-10">
                    <CollectionWorkspaceHeader
                      showBackButton={false}
                      title={collection.name}
                      subtitle={`${listings.length} listing${listings.length === 1 ? '' : 's'}`}
                      compactProgress={mobileHeaderProgress}
                      className="min-h-[2.5rem]"
                    />
                  </div>
                </div>
              </div>
            )}
            {mobileView === 'list' ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-[5.35rem] [overflow-anchor:none]"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', scrollBehavior: 'smooth' }}
                onScroll={(event) => {
                  const raw = Math.max(0, Math.min(1, event.currentTarget.scrollTop / 240));
                  const eased = raw * raw * (3 - 2 * raw);
                  setCompactMobileHeaderProgress(eased);
                }}
              >
                <CollectionListingsGrid
                  listings={sortedListings}
                  currentCollectionId={collection.id}
                  cardTall
                  onTagClick={(listingId) => setTagPanelState({ mode: 'assign', listingId, anchorRect: null })}
                  pendingRemovalIds={pendingRemovalIds}
                  onToggleListingLike={handleCollectionLikeToggle}
                  onSavedListing={handleCollectionResave}
                />
              </div>
            ) : (
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden bg-[#EEF2F6]">
                  <MapView listings={sortedListings} showListings />
                </div>
                <OverlayCloseButton
                  onClick={handleClosePage}
                  className="absolute right-4 z-30"
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
                  variant="glass"
                />
                {isCarouselVisible && sortedListings.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20">
                    <CollectionListingsCarousel
                      listings={sortedListings}
                      currentCollectionId={collection.id}
                      pendingRemovalIds={pendingRemovalIds}
                      onToggleListingLike={handleCollectionLikeToggle}
                      onSavedListing={handleCollectionResave}
                      onTagClick={(listingId) => setTagPanelState({ mode: 'assign', listingId, anchorRect: null })}
                      className="pointer-events-auto pb-2"
                    />
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
              <div className="pointer-events-auto flex items-center gap-2">
                <BackButton
                  iconOnly
                  className="h-11 w-11 shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[#F5F6F7]"
                />
                <div className="relative flex h-11 items-center rounded-full bg-white p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]">
                  <div
                    className={cn(
                      'absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full bg-[#0F1729] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      mobileView === 'map' && 'translate-x-full'
                    )}
                  />
                  <button
                    type="button"
                    aria-label="List view"
                    onClick={() => {
                      setShowSortDrawer(false);
                      setTagPanelState(null);
                      setMobileView('list');
                    }}
                    className={cn(
                      'relative z-10 flex h-full items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      mobileView === 'list' ? 'text-white' : 'text-[#0F1729]'
                    )}
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Map view"
                    onClick={() => {
                      setShowSortDrawer(false);
                      setTagPanelState(null);
                      setMobileView('map');
                    }}
                    className={cn(
                      'relative z-10 flex h-full items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      mobileView === 'map' ? 'text-white' : 'text-[#0F1729]'
                    )}
                  >
                    <Map size={16} />
                  </button>
                </div>
                <ControlPillButton
                  onClick={() => {
                    setShowSortDrawer(false);
                    setTagPanelState({ mode: 'filter', anchorRect: null });
                  }}
                  active={hasActiveTagFilters}
                  badge={hasActiveTagFilters ? activeTagFilters.length : null}
                  className="h-11 w-11 justify-center px-0"
                  aria-label="Tags"
                >
                  <Tag size={18} />
                </ControlPillButton>
                {mobileView === 'list' && (
                  <ControlPillButton
                    onClick={() => {
                      setTagPanelState(null);
                      setShowSortDrawer(true);
                    }}
                    className="h-11 w-11 justify-center px-0"
                    aria-label="Sort"
                  >
                    <ArrowDownWideNarrow size={18} />
                  </ControlPillButton>
                )}
              </div>
            </div>
          </div>

          <div className="hidden h-full w-full min-w-0 flex-1 overflow-hidden lg:flex">
            <div className="relative min-h-0 min-w-0 flex-1 self-stretch lg:mr-2 lg:mt-4 lg:overflow-hidden lg:rounded-tr-[28px]">
              <MapView listings={sortedListings} showListings />
            </div>

            <div className="hidden h-full shrink-0 overflow-hidden lg:block lg:w-[688px] 3xl:w-[1024px]">
              <div className="h-full overflow-y-auto px-4 py-4">
                <CollectionListingsGrid
                  listings={sortedListings}
                  currentCollectionId={collection.id}
                  onTagClick={(listingId, anchorRect) => {
                    setDesktopSortAnchor(null);
                    setTagPanelState({ mode: 'assign', listingId, anchorRect });
                  }}
                  pendingRemovalIds={pendingRemovalIds}
                  onToggleListingLike={handleCollectionLikeToggle}
                  onSavedListing={handleCollectionResave}
                />
              </div>
            </div>

            <AnchoredPopover
              open={!!desktopSortAnchor}
              anchorRect={desktopSortAnchor}
              onClose={() => setDesktopSortAnchor(null)}
              className="fixed z-[60]"
            >
              <DesktopSortMenu
                options={SORT_OPTIONS}
                value={sort}
                onChange={(value) => {
                  setSort(value);
                  setDesktopSortAnchor(null);
                }}
              />
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
