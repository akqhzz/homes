'use client';
import { Sparkles, TrendingUp, Heart, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { MOCK_FOR_YOU, MOCK_LISTINGS } from '@/lib/mock-data';
import { ForYouItem } from '@/lib/types';
import PageShell from '@/components/templates/PageShell';
import { useUIStore } from '@/store/uiStore';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';

const ListingDetailSheet = dynamic(() => import('@/components/organisms/ListingDetailSheet'), { ssr: false });

const TYPE_CONFIG: Record<ForYouItem['type'], { icon: React.ReactNode; label: string; color: string }> = {
  listing:              { icon: <Heart size={12} />,     label: 'New Match',    color: 'bg-red-50 text-red-500' },
  'price-drop':        { icon: <TrendingUp size={12} />, label: 'Price Drop',   color: 'bg-green-50 text-green-600' },
  'neighborhood-insight': { icon: <MapPin size={12} />, label: 'Neighbourhood', color: 'bg-blue-50 text-blue-600' },
  'market-update':     { icon: <TrendingUp size={12} />, label: 'Market',       color: 'bg-amber-50 text-amber-600' },
};

export default function ForYouPage() {
  const { activePanel, openListingDetail } = useUIStore();

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-4 pt-12 lg:pt-6 pb-4 flex-shrink-0 border-b border-[#F5F6F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F1729] flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F1729]">For You</h1>
              <p className="text-xs text-[#9CA3AF]">Personalized picks & insights</p>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto pb-24">
          {MOCK_FOR_YOU.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const listing = item.listingId ? MOCK_LISTINGS.find((l) => l.id === item.listingId) : null;

            return (
              <button
                key={item.id}
                onClick={() => listing && openListingDetail(listing.id)}
                className="w-full flex flex-col text-left hover:bg-[#FAFAFA] transition-colors border-b border-[#F5F6F7]"
              >
                {item.imageUrl && (
                  <div className="w-full aspect-[16/9] overflow-hidden bg-[#F5F6F7]">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="px-4 py-4">
                  <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-2', config.color)}>
                    {config.icon}
                    {config.label}
                  </span>
                  <p className="font-bold text-[#0F1729] leading-snug">{item.title}</p>
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{item.description}</p>
                  {listing && (
                    <div className="mt-3 flex items-center gap-3 bg-[#F5F6F7] rounded-xl p-3">
                      <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#0F1729]">{formatPrice(listing.price)}</p>
                        <p className="text-xs text-[#9CA3AF]">{listing.beds}bd · {listing.baths}ba · {listing.address}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#9CA3AF] mt-3">
                    {new Date(item.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {activePanel === 'listing-detail' && <ListingDetailSheet key="detail" />}
      </AnimatePresence>
    </PageShell>
  );
}
