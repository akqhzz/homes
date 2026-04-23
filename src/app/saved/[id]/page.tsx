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
      <div className="flex h-full flex-col overflow-hidden bg-[#FCFCFB]">
        <div className="border-b border-[#F0F1F2] bg-white/92 px-4 pb-4 pt-4 backdrop-blur-xl lg:px-8 lg:pb-5 lg:pt-6">
          <CollectionWorkspaceHeader
            title={collection.name}
            listingCount={listings.length}
            collaborators={collection.collaborators}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-4">
              {mobileView === 'list' ? (
                <CollectionListingsGrid listings={listings} />
              ) : (
                <div className="relative h-full min-h-[28rem] overflow-hidden rounded-[28px] bg-[#EEF2F6] shadow-[0_16px_40px_rgba(15,23,41,0.08)]">
                  <MapView listings={listings} showListings />
                  {isCarouselVisible && listings.length > 0 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
                      <ListingsCarousel listings={listings} className="pointer-events-auto pb-2" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <CollectionViewToggle
                value={mobileView}
                onChange={setMobileView}
                className="pointer-events-auto"
              />
            </div>
          </div>

          <div className="hidden h-full gap-4 px-6 py-5 lg:flex">
            <div className="flex min-w-0 flex-[0_0_46%] flex-col">
              <div className="mb-3 px-2">
                <p className="type-label text-[#6B7280]">Map view</p>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded-[30px] bg-[#EEF2F6] shadow-[0_20px_50px_rgba(15,23,41,0.08)]">
                <MapView listings={listings} showListings />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[#F0F1F2] bg-white">
              <div className="border-b border-[#F5F6F7] px-6 py-4">
                <p className="type-label text-[#6B7280]">Saved listings</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <CollectionListingsGrid listings={listings} />
              </div>
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
