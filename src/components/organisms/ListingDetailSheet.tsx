'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Heart, Share2, Calendar, Home, Car, DollarSign, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { formatDaysOnMarket, formatPropertyType, formatSqft } from '@/lib/utils/format';
import { useSavedStore } from '@/store/savedStore';
import { useListingSave } from '@/hooks/useListingSave';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import IconButton from '@/components/atoms/IconButton';
import { cn } from '@/lib/utils/cn';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import { ListingAddressRow, ListingFactRow, ListingFeaturePills } from '@/components/atoms/ListingParts';
import PriceText from '@/components/atoms/PriceText';

export default function ListingDetailSheet() {
  const detailListingId = useUIStore((s) => s.detailListingId);
  const closeListingDetail = useUIStore((s) => s.closeListingDetail);
  const [imgIndex, setImgIndex] = useState(0);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const collections = useSavedStore((s) => s.collections);
  const addToCollection = useSavedStore((s) => s.addToCollection);
  const saveListing = useSavedStore((s) => s.saveListing);
  const { isSaved: liked, unsave } = useListingSave(detailListingId ?? '');

  const listing = MOCK_LISTINGS.find((l) => l.id === detailListingId);
  if (!listing) return null;

  const footer = (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => {
              if (liked) {
                unsave();
                setShowAddToCollection(false);
                return;
              }
              setShowAddToCollection(!showAddToCollection);
            }}
          >
            {liked ? 'Saved' : showAddToCollection ? 'Cancel' : 'Save to Collection'}
          </Button>
          <Button size="md" className="flex-1">
            Contact Agent
          </Button>
        </div>
  );

  const content = (
    <>
      {/* Image gallery */}
      <div className="relative flex-shrink-0" style={{ height: 300 }}>
        <div className="w-full h-full overflow-hidden">
          <Image
            src={listing.images[imgIndex]}
            alt=""
            width={900}
            height={600}
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
              onClick={() => {
                if (liked) unsave();
                else setShowAddToCollection(true);
              }}
              variant="glass"
              size="md"
            >
              <Heart
                size={16}
                className={cn(liked ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]')}
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
              <h1 className="type-title text-[var(--color-text-primary)]"><PriceText price={listing.price} format="full" /></h1>
              <p className="type-body mt-1 text-[var(--color-text-secondary)]">
                {listing.beds} bed · {listing.baths} bath · {formatSqft(listing.sqft)} sqft
              </p>
            </div>
            <span className="mt-1 rounded-full bg-[var(--color-surface)] px-2.5 py-1 type-caption text-[var(--color-text-tertiary)]">
              {formatDaysOnMarket(listing.daysOnMarket)}
            </span>
          </div>

          {/* Address */}
          <ListingAddressRow
            className="mt-3 text-sm text-[var(--color-text-secondary)]"
            iconClassName="text-[var(--color-text-tertiary)]"
          >
            {listing.address}, {listing.city}, {listing.province} {listing.postalCode}
          </ListingAddressRow>

          <div className="my-5 h-px bg-[var(--color-surface)]" />

          {/* Property details grid */}
          <div className="grid grid-cols-2 gap-3">
            <ListingFactRow icon={<Home size={16} />} label="Type" value={formatPropertyType(listing.propertyType)} />
            <ListingFactRow icon={<Calendar size={16} />} label="Year Built" value={listing.yearBuilt.toString()} />
            <ListingFactRow icon={<Car size={16} />} label="Parking" value={listing.parkingSpaces === 0 ? 'None' : `${listing.parkingSpaces} space${listing.parkingSpaces > 1 ? 's' : ''}`} />
            <ListingFactRow icon={<DollarSign size={16} />} label="Taxes/yr" value={`$${listing.taxes.toLocaleString()}`} />
            {listing.maintenanceFee && (
              <ListingFactRow icon={<DollarSign size={16} />} label="Maint./mo" value={`$${listing.maintenanceFee.toLocaleString()}`} />
            )}
            <ListingFactRow icon={<Home size={16} />} label="MLS#" value={listing.mlsNumber} />
          </div>

          <div className="my-5 h-px bg-[var(--color-surface)]" />

          {/* Description */}
          <div>
            <h3 className="mb-2 type-heading text-[var(--color-text-primary)]">About This Home</h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{listing.description}</p>
          </div>

          {/* Features */}
          {listing.features.length > 0 && (
            <>
              <div className="my-5 h-px bg-[var(--color-surface)]" />
              <div>
                <h3 className="mb-3 type-heading text-[var(--color-text-primary)]">Features & Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  <ListingFeaturePills
                    features={listing.features}
                    itemClassName="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Add to collection */}
          {showAddToCollection && (
            <>
              <div className="my-5 h-px bg-[var(--color-surface)]" />
              <div>
                <h3 className="mb-3 type-heading text-[var(--color-text-primary)]">Add to collection</h3>
                <div className="flex flex-col gap-2">
                  {collections.map((col) => {
                    const thumbnail = MOCK_LISTINGS.find(l => l.id === col.listings[0]?.listingId)?.images[0];
                    return (
                      <button
                        key={col.id}
                        onClick={() => {
                          saveListing(listing.id);
                          addToCollection(col.id, listing.id);
                          setShowAddToCollection(false);
                        }}
                        className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--color-border)]">
                          {thumbnail && (
                            <Image
                              src={thumbnail}
                              alt=""
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="type-label text-[var(--color-text-primary)]">{col.name}</p>
                          <p className="type-caption text-[var(--color-text-tertiary)]">{col.listings.length} listing{col.listings.length !== 1 ? 's' : ''}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="h-24" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden">
        <MobileDrawer
          title={listing.address.split(',')[0]}
          onClose={closeListingDetail}
          heightClassName="h-[88dvh]"
          contentClassName="p-0"
          footer={footer}
        >
          {content}
        </MobileDrawer>
      </div>
      <div className="hidden lg:block">
        <button
          type="button"
          aria-label="Close listing detail"
          className="fixed inset-0 z-50 bg-black/10"
          onClick={closeListingDetail}
        />
        <section
          role="dialog"
          aria-modal="true"
          className="fixed right-8 top-24 z-[60] flex max-h-[calc(100vh-8rem)] w-[480px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_56px_rgba(15,23,41,0.20)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="min-w-0 truncate type-heading text-[var(--color-text-primary)]">{listing.address.split(',')[0]}</p>
            <button
              type="button"
              onClick={closeListingDetail}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
              aria-label="Close listing detail"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {content}
          </div>
          <footer className="border-t border-[var(--color-surface)] p-4">{footer}</footer>
        </section>
      </div>
    </>
  );
}
