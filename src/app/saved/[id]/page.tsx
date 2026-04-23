'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { useMapStore } from '@/store/mapStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import CollectionViewToggle, {
  type CollectionView,
} from '@/components/molecules/CollectionViewToggle';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';
import CollectionListingsGrid from '@/components/organisms/CollectionListingsGrid';
import { Collection } from '@/lib/types';
import BackButton from '@/components/atoms/BackButton';

const MapView = dynamic(() => import('@/components/organisms/MapView'), { ssr: false });
const ListingsCarousel = dynamic(() => import('@/components/organisms/ListingsCarousel'), { ssr: false });
const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });

type CollectionListingItem = (typeof MOCK_LISTINGS)[0] & {
  collectionData: Collection['listings'][number];
};

function getCollectionListings(collection: Collection): CollectionListingItem[] {
  return [...collection.listings]
    .sort((a, b) => a.order - b.order)
    .map((collectionListing) => {
      const listing = MOCK_LISTINGS.find((item) => item.id === collectionListing.listingId);
      return listing ? { ...listing, collectionData: collectionListing } : null;
    })
    .filter(Boolean) as CollectionListingItem[];
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

  const collection = collections.find((item) => item.id === id);

  const listings = collection ? getCollectionListings(collection) : [];

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
                <CollectionListingsGrid listings={listings} />
              </div>
            ) : (
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden bg-[#EEF2F6]">
                  <MapView listings={listings} showListings />
                </div>
                {isCarouselVisible && listings.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20">
                    <ListingsCarousel listings={listings} className="pointer-events-auto pb-2" />
                  </div>
                )}
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
                <CollectionViewToggle
                  value={mobileView}
                  onChange={setMobileView}
                />
              </div>
            </div>
          </div>

          <div className="hidden h-full gap-4 px-6 py-5 lg:flex">
            <div className="flex min-w-0 flex-[0_0_46%] flex-col">
              <div className="min-h-0 flex-1 overflow-hidden rounded-[30px] bg-[#EEF2F6] shadow-[0_20px_50px_rgba(15,23,41,0.08)]">
                <MapView listings={listings} showListings />
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto py-1">
              <CollectionListingsGrid listings={listings} />
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
