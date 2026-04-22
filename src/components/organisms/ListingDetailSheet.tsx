'use client';
import { useState } from 'react';
import { Heart, Share2, MapPin, Calendar, Home, Car, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { formatPriceFull, formatDaysOnMarket, formatPropertyType, formatSqft } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import IconButton from '@/components/atoms/IconButton';
import { cn } from '@/lib/utils/cn';
import MobileDrawer from '@/components/molecules/MobileDrawer';

export default function ListingDetailSheet() {
  const detailListingId = useUIStore((s) => s.detailListingId);
  const closeListingDetail = useUIStore((s) => s.closeListingDetail);
  const { toggleLike, isLiked } = useSavedStore();
  const [imgIndex, setImgIndex] = useState(0);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const collections = useSavedStore((s) => s.collections);
  const addToCollection = useSavedStore((s) => s.addToCollection);

  const listing = MOCK_LISTINGS.find((l) => l.id === detailListingId);
  if (!listing) return null;

  const liked = isLiked(listing.id);

  return (
    <MobileDrawer
      title={listing.address.split(',')[0]}
      onClose={closeListingDetail}
      heightClassName="h-[88dvh]"
      contentClassName="p-0"
      footer={(
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => setShowAddToCollection(!showAddToCollection)}
          >
            {showAddToCollection ? 'Cancel' : 'Save to Collection'}
          </Button>
          <Button size="md" className="flex-1">
            Contact Agent
          </Button>
        </div>
      )}
    >
      {/* Image gallery */}
      <div className="relative flex-shrink-0" style={{ height: 300 }}>
        <div className="w-full h-full overflow-hidden">
          <img
            src={listing.images[imgIndex]}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Nav arrows */}
        {imgIndex > 0 && (
          <button
            onClick={() => setImgIndex(i => i - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        {imgIndex < listing.images.length - 1 && (
          <button
            onClick={() => setImgIndex(i => i + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}

        {/* Top controls */}
        <div className="absolute top-4 right-4 flex justify-end">
          <div className="flex gap-2">
            <IconButton variant="glass" size="md">
              <Share2 size={16} />
            </IconButton>
            <IconButton
              onClick={() => toggleLike(listing.id)}
              variant="glass"
              size="md"
            >
              <Heart
                size={16}
                className={cn(liked ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#0F1729]')}
              />
            </IconButton>
          </div>
        </div>

        {/* Image dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {listing.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIndex(i)}
              className={cn(
                'rounded-full transition-all duration-200',
                i === imgIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5">
          {/* Price & basics */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="type-h1 text-[#0F1729]">{formatPriceFull(listing.price)}</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                {listing.beds} bed · {listing.baths} bath · {formatSqft(listing.sqft)} sqft
              </p>
            </div>
            <span className="text-xs text-[#9CA3AF] bg-[#F5F6F7] px-2.5 py-1 rounded-full mt-1">
              {formatDaysOnMarket(listing.daysOnMarket)}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 mt-3 text-sm text-[#6B7280]">
            <MapPin size={14} className="text-[#9CA3AF]" />
            <span>{listing.address}, {listing.city}, {listing.province} {listing.postalCode}</span>
          </div>

          <div className="h-px bg-[#F5F6F7] my-5" />

          {/* Property details grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={<Home size={16} />} label="Type" value={formatPropertyType(listing.propertyType)} />
            <DetailItem icon={<Calendar size={16} />} label="Year Built" value={listing.yearBuilt.toString()} />
            <DetailItem icon={<Car size={16} />} label="Parking" value={listing.parkingSpaces === 0 ? 'None' : `${listing.parkingSpaces} space${listing.parkingSpaces > 1 ? 's' : ''}`} />
            <DetailItem icon={<DollarSign size={16} />} label="Taxes/yr" value={`$${listing.taxes.toLocaleString()}`} />
            {listing.maintenanceFee && (
              <DetailItem icon={<DollarSign size={16} />} label="Maint./mo" value={`$${listing.maintenanceFee.toLocaleString()}`} />
            )}
            <DetailItem icon={<Home size={16} />} label="MLS#" value={listing.mlsNumber} />
          </div>

          <div className="h-px bg-[#F5F6F7] my-5" />

          {/* Description */}
          <div>
            <h3 className="type-h3 text-[#0F1729] mb-2">About this home</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{listing.description}</p>
          </div>

          {/* Features */}
          {listing.features.length > 0 && (
            <>
              <div className="h-px bg-[#F5F6F7] my-5" />
              <div>
                <h3 className="type-h3 text-[#0F1729] mb-3">Features & Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((f) => (
                    <span key={f} className="text-xs bg-[#F5F6F7] text-[#6B7280] px-3 py-1.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Add to collection */}
          {showAddToCollection && (
            <>
              <div className="h-px bg-[#F5F6F7] my-5" />
              <div>
                <h3 className="type-h3 text-[#0F1729] mb-3">Add to collection</h3>
                <div className="flex flex-col gap-2">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => {
                        addToCollection(col.id, listing.id);
                        setShowAddToCollection(false);
                      }}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-[#F5F6F7] hover:bg-[#EBEBEB] text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#E5E7EB] overflow-hidden flex-shrink-0">
                        {MOCK_LISTINGS.find(l => l.id === col.listings[0]?.listingId)?.images[0] && (
                          <img
                            src={MOCK_LISTINGS.find(l => l.id === col.listings[0]?.listingId)?.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#0F1729]">{col.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{col.listings.length} listing{col.listings.length !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-24" />
        </div>
      </div>
    </MobileDrawer>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#F5F6F7] rounded-xl">
      <span className="text-[#9CA3AF]">{icon}</span>
      <div>
        <p className="text-xs text-[#9CA3AF]">{label}</p>
        <p className="text-sm font-semibold text-[#0F1729]">{value}</p>
      </div>
    </div>
  );
}
