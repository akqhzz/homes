'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownWideNarrow, LayoutList, ListFilter, Map } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils/cn';
import PageShell from '@/components/layout/PageShell';
import CollectionWorkspaceHeader from '@/features/collections/components/CollectionWorkspaceHeader';
import CollectionListingsGrid from '@/features/collections/components/CollectionListingsGrid';
import CollectionListingsCarousel from '@/features/collections/components/CollectionListingsCarousel';
import BackButton from '@/components/navigation/BackButton';
import ControlPillButton from '@/components/ui/ControlPillButton';
import OverlayCloseButton from '@/components/navigation/OverlayCloseButton';
import DesktopSortMenu from '@/components/ui/DesktopSortMenu';
import SortOptionsDrawer from '@/components/ui/SortOptionsDrawer';
import SegmentedControl from '@/components/ui/SegmentedControl';
import CollectionTagsPanel from '@/features/collections/components/CollectionTagsPanel';
import AnchoredPopover from '@/components/ui/AnchoredPopover';
import {
  COLLECTION_SORT_OPTIONS,
  type CollectionSortOption,
  getCollectionListings,
  getCollectionViewport,
  sortCollectionListings,
} from '@/features/collections/lib/collectionPageData';

const MapView = dynamic(() => import('@/features/map/MapView'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/features/listings/components/ListingDetailSheet'), { ssr: false });

type CollectionView = 'list' | 'map';
type TagPanelState =
  | null
  | { mode: 'filter'; anchorRect: DOMRect | null }
  | { mode: 'assign'; listingId: string; anchorRect: DOMRect | null };

interface CollectionPageClientProps {
  collectionId: string;
}

export default function CollectionPageClient({ collectionId }: CollectionPageClientProps) {
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
  const { activePanel, isCarouselVisible, isDesktopMapExpanded, setCarouselVisible, setDesktopMapExpanded } = useUIStore();
  const setSelectedListingId = useMapStore((state) => state.setSelectedListingId);
  const setMobileCarouselListingId = useMapStore((state) => state.setMobileCarouselListingId);
  const setViewState = useMapStore((state) => state.setViewState);

  const [mobileView, setMobileView] = useState<CollectionView>('list');
  const [sort, setSort] = useState<CollectionSortOption>('manual');
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [desktopSortAnchor, setDesktopSortAnchor] = useState<DOMRect | null>(null);
  const [tagPanelState, setTagPanelState] = useState<TagPanelState>(null);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [pendingRemovalByCollection, setPendingRemovalByCollection] = useState<Record<string, string[]>>({});
  const pendingRemovalIdsRef = useRef<string[]>([]);

  const collection = collections.find((item) => item.id === collectionId);
  const listings = collection ? getCollectionListings(collection, MOCK_LISTINGS) : [];
  const availableTags = Array.from(
    new Set([...(collection?.tags ?? []), ...listings.flatMap((listing) => listing.collectionData.tags)])
  );
  const hasCreatedTags = availableTags.length > 0;
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
  const mobileHeaderProgress = mobileView === 'map' ? 1 : 0;

  useEffect(() => {
    setCarouselVisible(false);
    setDesktopMapExpanded(false);
    setSelectedListingId(null);
    setMobileCarouselListingId(null, null);
    return () => setDesktopMapExpanded(false);
  }, [collectionId, setCarouselVisible, setDesktopMapExpanded, setMobileCarouselListingId, setSelectedListingId]);

  useEffect(() => {
    setViewState(getCollectionViewport(sortedListings));
  }, [sortedListings, setViewState]);

  useEffect(() => {
    if (mobileView !== 'map') {
      setCarouselVisible(false);
      setSelectedListingId(null);
      setMobileCarouselListingId(null, null);
    }
  }, [mobileView, setCarouselVisible, setMobileCarouselListingId, setSelectedListingId]);

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
          <p className="text-[var(--color-text-tertiary)]">Collection not found</p>
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

  const tagPanelTitle = tagPanelState?.mode === 'assign' ? 'Assign tags' : 'Filter by tags';
  const tagPanelMode = tagPanelState?.mode === 'assign' ? 'assign' : 'filter';
  const selectedPanelTags =
    tagPanelState?.mode === 'assign'
      ? assigningListing?.collectionData.tags ?? []
      : activeTagFilters;
  const handleTogglePanelTag = (tag: string) => {
    if (tagPanelState?.mode === 'assign' && tagPanelState.listingId) {
      toggleListingTag(tagPanelState.listingId, tag);
      return;
    }
    setActiveTagFilters((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };
  const handleRenameCollectionTag = (oldTag: string, newTag: string) => {
    renameCollectionTag(collection.id, oldTag, newTag);
  };
  const handleDeleteCollectionTag = (tag: string) => {
    deleteCollectionTag(collection.id, tag);
    setActiveTagFilters((current) => current.filter((item) => item !== tag));
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
            titleClassName="type-title"
            compact={mobileView === 'map'}
            compactProgress={mobileHeaderProgress}
            rightSlot={(
              <>
                {hasCreatedTags && (
                  <ControlPillButton
                    onClick={(event) => {
                      setDesktopSortAnchor(null);
                      setTagPanelState({ mode: 'filter', anchorRect: event.currentTarget.getBoundingClientRect() });
                    }}
                    active={hasActiveTagFilters}
                    badge={hasActiveTagFilters ? activeTagFilters.length : null}
                  >
                    <ListFilter size={16} />
                    Tags
                  </ControlPillButton>
                )}
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
                  className="relative bg-white/94 px-4 backdrop-blur-[10px]"
                  style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.52rem)',
                    paddingBottom: '0.3rem',
                    minHeight: '54px',
                  }}
                >
                  <OverlayCloseButton
                    onClick={handleClosePage}
                    className="pointer-events-auto absolute right-4"
                    style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.42rem)' }}
                    variant="overlay"
                  />
                  <div className="px-10">
                    <CollectionWorkspaceHeader
                      showBackButton={false}
                      title={collection.name}
                      titleClassName="type-heading"
                      compactProgress={0}
                      className="min-h-[2rem]"
                    />
                  </div>
                </div>
              </div>
            )}
            {mobileView === 'list' ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-[3.65rem] [overflow-anchor:none]"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
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
                  variant="overlay"
                />
                <AnimatePresence>
                  {isCarouselVisible && sortedListings.length > 0 && (
                    <motion.div
                      initial={{ y: 28, opacity: 0, scale: 0.965 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 28, opacity: 0, scale: 0.965 }}
                      transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0, 0.1, 1] }}
                      style={{ touchAction: 'none' }}
                      className="pointer-events-none absolute inset-x-0 bottom-14 z-20"
                    >
                    <CollectionListingsCarousel
                      listings={sortedListings}
                      currentCollectionId={collection.id}
                      pendingRemovalIds={pendingRemovalIds}
                      onToggleListingLike={handleCollectionLikeToggle}
                      onSavedListing={handleCollectionResave}
                      onTagClick={(listingId) => setTagPanelState({ mode: 'assign', listingId, anchorRect: null })}
                      className="pointer-events-auto pb-2"
                    />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <SortOptionsDrawer
              title="Sort cards"
              open={showSortDrawer}
              value={sort}
              options={COLLECTION_SORT_OPTIONS}
              onClose={() => setShowSortDrawer(false)}
              onChange={setSort}
            />

            <CollectionTagsPanel
              title={tagPanelTitle}
              open={tagPanelState !== null}
              mode={tagPanelMode}
              availableTags={availableTags}
              selectedTags={selectedPanelTags}
              onClose={() => setTagPanelState(null)}
              onToggleTag={handleTogglePanelTag}
              onCreateTag={createTag}
              onRenameTag={handleRenameCollectionTag}
              onDeleteTag={handleDeleteCollectionTag}
            />

            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <div className="pointer-events-auto flex items-center gap-2">
                <BackButton
                  iconOnly
                  className="h-11 w-11 shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[var(--color-surface)]"
                />
                <SegmentedControl
                  value={mobileView}
                  onChange={(nextView) => {
                    setShowSortDrawer(false);
                    setTagPanelState(null);
                    setMobileView(nextView);
                  }}
                  options={[
                    { value: 'list', label: 'List view', icon: <LayoutList size={16} /> },
                    { value: 'map', label: 'Map view', icon: <Map size={16} /> },
                  ]}
                  showLabels={false}
                />
                {hasCreatedTags && (
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
                    <ListFilter size={18} />
                  </ControlPillButton>
                )}
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
            <div
              className={cn(
                'relative min-h-0 min-w-0 flex-1 self-stretch lg:overflow-hidden',
                isDesktopMapExpanded ? 'lg:mr-0 lg:mt-0 lg:rounded-none' : 'lg:mr-2 lg:mt-4 lg:rounded-tr-[28px]'
              )}
            >
              <MapView listings={sortedListings} showListings />
            </div>

            {!isDesktopMapExpanded && <div className="hidden h-full shrink-0 overflow-hidden lg:block lg:w-[688px] 3xl:w-[1024px]">
              <div className="h-full overflow-y-auto px-4 py-4">
                <CollectionListingsGrid
                  listings={sortedListings}
                  currentCollectionId={collection.id}
                  cardTall
                  onTagClick={(listingId, anchorRect) => {
                    setDesktopSortAnchor(null);
                    setTagPanelState({ mode: 'assign', listingId, anchorRect });
                  }}
                  pendingRemovalIds={pendingRemovalIds}
                  onToggleListingLike={handleCollectionLikeToggle}
                  onSavedListing={handleCollectionResave}
                />
              </div>
            </div>}

            <AnchoredPopover
              open={!!desktopSortAnchor}
              anchorRect={desktopSortAnchor}
              onClose={() => setDesktopSortAnchor(null)}
              className="fixed z-[60]"
            >
              <DesktopSortMenu
                options={COLLECTION_SORT_OPTIONS}
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
                  title={tagPanelTitle}
                  open={!!tagPanelState}
                  mode={tagPanelMode}
                  availableTags={availableTags}
                  selectedTags={selectedPanelTags}
                  onClose={() => setTagPanelState(null)}
                  onToggleTag={handleTogglePanelTag}
                  onCreateTag={createTag}
                  onRenameTag={handleRenameCollectionTag}
                  onDeleteTag={handleDeleteCollectionTag}
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
