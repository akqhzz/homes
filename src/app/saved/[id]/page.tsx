'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import ListingCard from '@/components/molecules/ListingCard';
import Avatar from '@/components/atoms/Avatar';
import dynamic from 'next/dynamic';

const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { collections } = useSavedStore();
  const { activePanel } = useUIStore();

  const collection = collections.find((c) => c.id === id);
  if (!collection) {
    return (
      <PageShell showBottomNav={false}>
        <div className="h-full flex items-center justify-center">
          <p className="text-[#9CA3AF]">Collection not found</p>
        </div>
      </PageShell>
    );
  }

  const sortedListings = [...collection.listings].sort((a, b) => a.order - b.order);
  const listings = sortedListings
    .map((cl) => {
      const listing = MOCK_LISTINGS.find((l) => l.id === cl.listingId);
      return listing ? { ...listing, collectionData: cl } : null;
    })
    .filter(Boolean) as Array<(typeof MOCK_LISTINGS)[0] & { collectionData: (typeof collection.listings)[0] }>;

  return (
    <PageShell showBottomNav={false}>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-4 pt-4 lg:pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F6F7] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-heading text-lg flex-1 text-center text-[#0F1729]">{collection.name}</h1>
            <div className="flex items-center gap-2">
              {collection.collaborators && collection.collaborators.length > 0 && (
                <div className="flex -space-x-1.5">
                  {collection.collaborators.slice(0, 2).map((c) => (
                    <Avatar key={c.id} src={c.avatar} name={c.name} size="sm" className="border-2 border-white" />
                  ))}
                </div>
              )}
              <button className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#F5F6F7]">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {listings.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-1.5">
                <ListingCard listing={listing} variant="grid" />
                {listing.collectionData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-0.5">
                    {listing.collectionData.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-[#F5F6F7] text-[#6B7280] px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {listing.collectionData.notes && (
                  <p className="text-xs text-[#9CA3AF] px-0.5 line-clamp-2">{listing.collectionData.notes}</p>
                )}
              </div>
            ))}
          </div>
          {listings.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📂</div>
              <p className="font-semibold text-[#0F1729]">Empty collection</p>
              <p className="text-sm text-[#9CA3AF] mt-1">Save listings from the map to add them here</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activePanel === 'listing-detail' && <ListingDetailSheet key="detail" />}
      </AnimatePresence>
    </PageShell>
  );
}
