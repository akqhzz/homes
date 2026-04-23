'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownWideNarrow, LayoutList, Map, Tags } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';
import CollectionListingsGrid from '@/components/organisms/CollectionListingsGrid';
import { Collection } from '@/lib/types';
import BackButton from '@/components/atoms/BackButton';
import { cn } from '@/lib/utils/cn';

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
const ListingsCarousel = dynamic(() => import('@/components/organisms/ListingsCarousel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });

type CollectionListingItem = (typeof MOCK_LISTINGS)[0] & {
  collectionData: Collection['listings'][number];
};

type CollectionView = 'list' | 'map';
type SortOption = 'manual' | 'price-asc' | 'price-desc';

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
  const { collections } = useSavedStore();
  const { activePanel, isCarouselVisible, setCarouselVisible } = useUIStore();
  const setSelectedListingId = useMapStore((state) => state.setSelectedListingId);
  const setViewState = useMapStore((state) => state.setViewState);
  const [mobileView, setMobileView] = useState<CollectionView>('list');
  const [sort, setSort] = useState<SortOption>('manual');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const collection = collections.find((item) => item.id === id);

  const listings = collection ? getCollectionListings(collection) : [];
  const sortedListings = sortCollectionListings(listings, sort);

  useEffect(() => {
    setCarouselVisible(false);
    setSelectedListingId(null);
  }, [id, setCarouselVisible, setSelectedListingId]);

  useEffect(() => {
    setViewState(getCollectionViewport(collection ? getCollectionListings(collection) : []));
  }, [collection, setViewState]);

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

  return (
    <PageShell showBottomNav={false} showDesktopHeader={false} desktopWide>
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="bg-white px-4 pb-4 pt-4 lg:px-8 lg:pb-5 lg:pt-6">
          <CollectionWorkspaceHeader
            title={collection.name}
            subtitle={`${listings.length} listing${listings.length === 1 ? '' : 's'}`}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:hidden">
            {mobileView === 'list' ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-4">
                <CollectionListingsGrid listings={sortedListings} cardTall />
              </div>
            ) : (
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden bg-[#EEF2F6]">
                  <MapView listings={sortedListings} showListings />
                </div>
                {isCarouselVisible && sortedListings.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-22 z-20">
                    <ListingsCarousel listings={sortedListings} className="pointer-events-auto pb-2" />
                  </div>
                )}
              </div>
            )}

            {showSortMenu && mobileView === 'list' && (
              <div className="pointer-events-none fixed inset-x-0 bottom-[6.75rem] z-30 flex justify-center px-4">
                <div className="pointer-events-auto w-[min(22rem,100%)] rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                  {SORT_OPTIONS.map((option) => {
                    const active = sort === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSort(option.value);
                          setShowSortMenu(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors',
                          active ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]'
                        )}
                      >
                        <span className="type-btn">{option.label}</span>
                        {active && <span className="type-caption text-[#0F1729]">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <div className="pointer-events-auto flex items-center gap-2">
                <BackButton
                  iconOnly
                  className="h-11 w-11 shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[#F5F6F7]"
                />
                <div className="flex items-center rounded-full bg-white px-1.5 py-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]">
                  <button
                    type="button"
                    aria-label={mobileView === 'list' ? 'Map view' : 'List view'}
                    onClick={() => {
                      setShowSortMenu(false);
                      setMobileView((value) => (value === 'list' ? 'map' : 'list'));
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#0F1729] transition-colors hover:bg-[#F5F6F7]"
                  >
                    {mobileView === 'list' ? <Map size={18} /> : <LayoutList size={18} />}
                  </button>
                  <button
                    type="button"
                    aria-label="Sort"
                    disabled={mobileView !== 'list'}
                    onClick={() => {
                      if (mobileView === 'list') setShowSortMenu((value) => !value);
                    }}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                      mobileView === 'list'
                        ? 'text-[#0F1729] hover:bg-[#F5F6F7]'
                        : 'text-[#C4C4C4]'
                    )}
                  >
                    <ArrowDownWideNarrow size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Tags"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#C4C4C4] transition-colors hover:bg-[#F5F6F7]"
                  >
                    <Tags size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden h-full gap-4 px-6 py-5 lg:flex">
            <div className="flex min-w-0 flex-[0_0_46%] flex-col">
              <div className="min-h-0 flex-1 overflow-hidden rounded-[30px] bg-[#EEF2F6] shadow-[0_20px_50px_rgba(15,23,41,0.08)]">
                <MapView listings={sortedListings} showListings />
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto py-1">
              <CollectionListingsGrid listings={sortedListings} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activePanel === 'listing-detail' && <ListingDetailSheet key="detail" />}
      </AnimatePresence>
    </PageShell>
  );
}
