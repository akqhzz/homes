'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import * as Slider from '@radix-ui/react-slider';
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronRight,
  Home,
  Hotel,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Rows3,
  Search,
  Share2,
  Shield,
  SlidersHorizontal,
  User,
  Warehouse,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils/cn';
import { Location, PropertyType } from '@/lib/types';
import ListingSaveButton from '@/components/molecules/ListingSaveButton';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: typeof Home }[] = [
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Hotel },
  { value: 'semi-detached', label: 'Semi-Det.', icon: Rows3 },
  { value: 'detached', label: 'Detached', icon: Warehouse },
];
const PRICE_MIN = 0;
const PRICE_MAX = 2000000;
const PRICE_STEP = 50000;
const PRICE_BUCKETS = [2, 5, 8, 12, 10, 7, 4, 6, 3, 2, 1, 1];
const LISTED_WITHIN_OPTIONS = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 7, label: '1 Week' },
  { value: 14, label: '2 Weeks' },
  { value: 30, label: '1 Month' },
  { value: 90, label: '3 Months' },
];

const LOCATION_SUGGESTIONS: Location[] = [
  { id: 'loc-downtown', name: 'Toronto Downtown', type: 'area', coordinates: { lat: 43.6532, lng: -79.3832 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-midtown', name: 'Midtown', type: 'area', coordinates: { lat: 43.6966, lng: -79.4031 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-annex', name: 'Annex', type: 'neighborhood', coordinates: { lat: 43.6680, lng: -79.4050 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-yorkville', name: 'Yorkville', type: 'neighborhood', coordinates: { lat: 43.6700, lng: -79.3930 }, city: 'Toronto', province: 'ON' },
  { id: 'loc-kensington', name: 'Kensington', type: 'neighborhood', coordinates: { lat: 43.6545, lng: -79.4030 }, city: 'Toronto', province: 'ON' },
];

const MENU_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notification Preference' },
  { icon: Shield, label: 'Privacy & Security' },
  { icon: MessageSquare, label: 'Send Feedback' },
];

interface DesktopHeaderProps {
  variant?: 'default' | 'listing';
  listingId?: string;
}

export default function DesktopHeader({ variant = 'default', listingId }: DesktopHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations, filters, setFilters, resetFilters, addLocation, removeLocation, clearLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { activePanel, setActivePanel } = useUIStore();
  const { collections, createCollection } = useSavedStore();

  const isCollectionsPage = pathname.startsWith('/saved');
  const isListingVariant = variant === 'listing';
  const filterCount = activeFilterCount();
  const locationLabel =
    selectedLocations.length === 0
      ? 'Where?'
      : selectedLocations.length === 1
      ? selectedLocations[0].name
      : `${selectedLocations[0].name}, +${selectedLocations.length - 1}`;

  const priceRange = [filters.minPrice ?? PRICE_MIN, filters.maxPrice ?? PRICE_MAX];
  const selectedListedWithin = LISTED_WITHIN_OPTIONS.find((option) => option.value === filters.maxDaysOnMarket)?.value ?? '';
  const pricePercent = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const filteredLocations = LOCATION_SUGGESTIONS.filter(
    (location) =>
      !selectedLocations.some((selected) => selected.id === location.id) &&
      location.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const togglePropertyType = (type: PropertyType) => {
    setFilters({
      propertyTypes: filters.propertyTypes.includes(type)
        ? filters.propertyTypes.filter((item) => item !== type)
        : [...filters.propertyTypes, type],
    });
  };

  const setNumericFilter = (key: 'minSqft' | 'maxSqft', value: string) => {
    setFilters({ [key]: value ? parseInt(value) : undefined });
  };

  const selectLocation = (location: Location) => {
    addLocation(location);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name);
    setNewCollectionName('');
    setCreatingCollection(false);
  };

  useEffect(() => {
    if (!showFilter && !showSearch && !showMenu && !showCollections) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!filterRef.current?.contains(target)) setShowFilter(false);
      if (!searchRef.current?.contains(target)) setShowSearch(false);
      if (!menuRef.current?.contains(target)) setShowMenu(false);
      if (!collectionsRef.current?.contains(target)) setShowCollections(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilter, showSearch, showMenu, showCollections]);

  useEffect(() => {
    if (!showSearch) return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showSearch]);

  return (
    <>
      <header className="relative hidden lg:flex min-h-[76px] bg-white items-center px-6 py-3 gap-6 flex-shrink-0 z-30">
        {isListingVariant ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F7] px-4 text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : (
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="font-heading text-lg text-[#0F1729]">homes</span>
          </button>
        )}

        {/* Centered search */}
        <div className={cn(
          'items-center justify-center gap-2 max-w-[540px]',
          isCollectionsPage
            ? 'hidden'
            : isListingVariant
            ? 'absolute left-1/2 top-1/2 flex w-[540px] -translate-x-1/2 -translate-y-1/2'
            : 'mx-auto flex flex-1'
        )}>
          <div ref={searchRef} className="relative w-[316px] flex-none">
            <div
              onClick={() => {
                setShowSearch(true);
                setShowFilter(false);
                setShowMenu(false);
              }}
              className={cn(
                'flex min-h-[44px] w-full min-w-0 cursor-text items-center gap-2.5 rounded-full bg-white px-3.5 text-left shadow-[var(--shadow-control)] transition-all hover:bg-[#F9FAFB]',
                showSearch && 'shadow-[inset_0_0_0_1.5px_#0F1729,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
            >
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              {showSearch ? (
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredLocations[0]) selectLocation(filteredLocations[0]);
                  }}
                  placeholder={selectedLocations.length > 0 ? 'Add another area...' : 'Where?'}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0F1729] outline-none placeholder:text-[#9CA3AF]"
                />
              ) : selectedLocations.length > 0 ? (
                <span className="inline-flex max-w-full items-center truncate rounded-full bg-[#F0F1F2] px-2.5 py-0.5 text-sm font-medium text-[#0F1729]">
                  {locationLabel}
                </span>
              ) : (
                <span className="flex-1 truncate text-sm font-medium text-[#9CA3AF]">{locationLabel}</span>
              )}
            </div>
            {showSearch && (
              <div className="absolute left-0 right-0 top-[54px] z-40 rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                {selectedLocations.length > 0 && (
                  <div className="flex items-center gap-2 border-b border-[#F5F6F7] px-2 py-2">
                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
                      {selectedLocations.map((location) => (
                        <span key={location.id} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5F6F7] px-2.5 py-1 text-xs font-medium text-[#0F1729]">
                          {location.name}
                          <button onClick={() => removeLocation(location.id)} className="text-[#9CA3AF] hover:text-[#0F1729]">×</button>
                        </span>
                      ))}
                    </div>
                    <button onClick={clearLocations} className="shrink-0 rounded-full bg-[#F5F6F7] px-3 py-1 text-xs font-semibold text-[#6B7280] hover:text-[#0F1729]">
                      Clear
                    </button>
                  </div>
                )}
                <div className="py-1">
                  {filteredLocations.map((location, index) => (
                    <button
                      key={location.id}
                      onClick={() => selectLocation(location)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]',
                        index === 0 && searchQuery.trim() && 'bg-[#F5F6F7]'
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7]">
                        <Search size={14} className="text-[#9CA3AF]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F1729]">{location.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{location.city}, ON</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={filterRef} className="relative">
            <button
              onClick={() => {
                setShowFilter((value) => !value);
                setShowSearch(false);
                setShowMenu(false);
              }}
              className={cn(
                'relative flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7] no-select',
                filterCount > 0 && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
              aria-label="Filters"
            >
              <SlidersHorizontal size={16} className="text-[#0F1729]" />
              Filter
              {filterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 text-[8px] font-bold leading-none text-white">
                  {filterCount}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-12 z-40 flex max-h-[calc(100vh-9rem)] w-[390px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-3">
                  <div>
                    <p className="font-heading mb-3 text-lg text-[#0F1729]">Price Range</p>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <PriceInput value={filters.minPrice} placeholder="No min" onChange={(value) => setFilters({ minPrice: value })} />
                      <PriceInput value={filters.maxPrice} placeholder="No max" onChange={(value) => setFilters({ maxPrice: value })} />
                    </div>
                    <Slider.Root
                      value={priceRange}
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      minStepsBetweenThumbs={1}
                      onValueChange={([min, max]) => setFilters({
                        minPrice: min <= PRICE_MIN ? undefined : min,
                        maxPrice: max >= PRICE_MAX ? undefined : max,
                      })}
                      className="relative flex h-20 w-full touch-none select-none items-end pb-3 cursor-pointer"
                      aria-label="Desktop price range"
                    >
                      <div className="pointer-events-none absolute bottom-[18px] left-0 right-0 flex h-12 items-end gap-1 px-1">
                        {PRICE_BUCKETS.map((count, index) => {
                          const bucketCenter = ((index + 0.5) / PRICE_BUCKETS.length) * 100;
                          const inRange = bucketCenter >= pricePercent(priceRange[0]) && bucketCenter <= pricePercent(priceRange[1]);
                          return (
                            <div
                              key={index}
                              className={cn('flex-1 rounded-t transition-colors', inRange ? 'bg-[#0F1729]' : 'bg-[#D1D5DB]')}
                              style={{ height: `${Math.max(6, count * 3)}px` }}
                            />
                          );
                        })}
                      </div>
                      <Slider.Track className="relative h-1.5 grow cursor-pointer overflow-hidden rounded-full bg-[#E5E7EB]">
                        <Slider.Range className="absolute h-full rounded-full bg-[#0F1729]" />
                      </Slider.Track>
                      <Slider.Thumb className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10" />
                      <Slider.Thumb className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10" />
                    </Slider.Root>
                  </div>
                  <div>
                    <p className="font-heading mb-3 text-lg text-[#0F1729]">Property Type</p>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => togglePropertyType(value)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all hover:bg-[#F5F6F7]',
                            filters.propertyTypes.includes(value)
                              ? 'border-[#0F1729] bg-[#0F1729] text-white'
                              : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                          )}
                        >
                          <Icon size={13} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SegmentedFilter
                    title="Bedrooms"
                    options={['Any', '1+', '2+', '3+', '4+', '5+']}
                    activeValue={filters.minBeds ? `${filters.minBeds}+` : 'Any'}
                    onSelect={(value) => setFilters({ minBeds: value === 'Any' ? undefined : parseInt(value) })}
                  />
                  <SegmentedFilter
                    title="Bathrooms"
                    options={['Any', '1+', '2+', '3+', '4+']}
                    activeValue={filters.minBaths ? `${filters.minBaths}+` : 'Any'}
                    onSelect={(value) => setFilters({ minBaths: value === 'Any' ? undefined : parseInt(value) })}
                  />
                  <div>
                    <p className="font-heading mb-3 text-lg text-[#0F1729]">Listed Within</p>
                    <select
                      value={selectedListedWithin}
                      onChange={(event) => setFilters({ maxDaysOnMarket: event.target.value ? Number(event.target.value) : undefined })}
                      className="h-11 w-full cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0F1729] outline-none transition-colors hover:border-[#0F1729] focus:border-[#0F1729]"
                    >
                      <option value="">Any Time</option>
                      {LISTED_WITHIN_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="font-heading mb-3 text-lg text-[#0F1729]">Square Footage</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={filters.minSqft ?? ''}
                        onChange={(event) => setNumericFilter('minSqft', event.target.value)}
                        placeholder="No min"
                        className="h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm outline-none transition-colors hover:border-[#D1D5DB] focus:border-[#0F1729]"
                      />
                      <input
                        type="number"
                        value={filters.maxSqft ?? ''}
                        onChange={(event) => setNumericFilter('maxSqft', event.target.value)}
                        placeholder="No max"
                        className="h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm outline-none transition-colors hover:border-[#D1D5DB] focus:border-[#0F1729]"
                      />
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-[#F5F6F7] bg-white p-4">
                  <button onClick={resetFilters} className="h-11 rounded-full bg-[#F5F6F7] text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]">
                    Reset
                  </button>
                  <button onClick={() => setShowFilter(false)} className="h-11 rounded-full bg-[#0F1729] text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            data-saved-search-trigger="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              setShowFilter(false);
              setShowSearch(false);
              setShowMenu(false);
              setShowCollections(false);
              setActivePanel(activePanel === 'saved-searches' ? 'none' : 'saved-searches');
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
            aria-label="Saved searches"
          >
            <SavedSearchIllustration />
          </button>
        </div>

        {/* Right nav */}
        <nav className={cn('flex items-center gap-1 flex-shrink-0', (isCollectionsPage || isListingVariant) && 'ml-auto')}>
          {isListingVariant ? (
            <>
              {listingId && <ListingSaveButton listingId={listingId} className="bg-[#0F1729] text-white hover:bg-[#1F2937]" />}
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F7] px-4 text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
              >
                <Share2 size={15} />
                Share
              </button>
            </>
          ) : isCollectionsPage ? (
            <button
              onClick={() => router.push('/')}
              className="h-10 rounded-full bg-[#0F1729] px-4 text-sm font-semibold text-white transition-all hover:bg-[#1F2937]"
            >
              Map
            </button>
          ) : (
            <div ref={collectionsRef} className="relative">
              <button
                onClick={() => {
                  setShowCollections((value) => !value);
                  setShowFilter(false);
                  setShowSearch(false);
                  setShowMenu(false);
                }}
                className="h-10 rounded-full bg-[#0F1729] px-4 text-sm font-semibold text-white transition-all hover:bg-[#1F2937]"
              >
                Collections
              </button>
              {showCollections && (
                <div className="absolute right-0 top-12 z-40 w-80 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                  <p className="mb-3 type-heading text-[#0F1729]">Collections</p>
                  {creatingCollection ? (
                    <div className="mb-3 flex gap-2">
                      <input
                        value={newCollectionName}
                        onChange={(event) => setNewCollectionName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleCreateCollection();
                          if (event.key === 'Escape') {
                            setCreatingCollection(false);
                            setNewCollectionName('');
                          }
                        }}
                        placeholder="Collection Name..."
                        className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none transition-colors focus:border-[#0F1729]"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateCollection}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1729] text-white transition-colors hover:bg-[#1F2937]"
                        aria-label="Create collection"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingCollection(true)}
                      className="mb-3 flex w-full items-center gap-2 rounded-2xl border border-dashed border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:border-[#0F1729] hover:text-[#0F1729]"
                    >
                      <Plus size={16} />
                      New Collection
                    </button>
                  )}
                  <div className="flex flex-col gap-2.5">
                    {collections.slice(0, 4).map((collection) => {
                      const listing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
                      return (
                        <button
                          key={collection.id}
                          onClick={() => router.push(`/saved/${collection.id}`)}
                          className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[#F5F6F7] px-4 py-3 text-left transition-colors hover:bg-[#EBEBEB]"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                            {listing?.images[0] && (
                              <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="type-label block truncate text-[#0F1729]">{collection.name}</span>
                            <span className="block type-caption text-[#9CA3AF]">{collection.listings.length} Listing{collection.listings.length === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => router.push('/saved')}
                      className="flex min-h-[84px] items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left transition-colors hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                        {MOCK_LISTINGS[0]?.images[0] && (
                          <Image src={MOCK_LISTINGS[0].images[0]} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="type-label block truncate text-[#0F1729]">All Collections</span>
                        <span className="block type-caption text-[#9CA3AF]">View Your Saved Homes</span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-[#9CA3AF]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isListingVariant && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => {
                  setShowMenu((value) => !value);
                  setShowFilter(false);
                  setShowSearch(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
                aria-label="Menu"
              >
                <Menu size={19} />
              </button>
              {showMenu && (
                <DesktopMenu />
              )}
            </div>
          )}
        </nav>
      </header>

    </>
  );
}

function DesktopMenu() {
  return (
    <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
      {MENU_ITEMS.map((item) => (
        <button key={item.label} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7]">
            <item.icon size={15} className="text-[#0F1729]" />
          </div>
          <span className="flex-1 text-sm font-medium text-[#0F1729]">{item.label}</span>
        </button>
      ))}
      <button className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-red-50">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <LogOut size={15} className="text-[#EF4444]" />
        </div>
        <span className="flex-1 text-sm font-medium text-[#EF4444]">Sign Out</span>
      </button>
    </div>
  );
}

function SegmentedFilter({
  title,
  options,
  activeValue,
  onSelect,
}: {
  title: string;
  options: string[];
  activeValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="font-heading mb-3 text-lg text-[#0F1729]">{title}</p>
      <div className="flex gap-2">
        {options.map((option) => {
          const active = activeValue === option;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={cn(
                'h-10 min-w-12 shrink-0 rounded-full border px-3 text-sm font-medium transition-all hover:bg-[#F5F6F7]',
                active
                  ? 'border-[#0F1729] bg-[#0F1729] text-white hover:bg-[#0F1729]'
                  : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SavedSearchIllustration() {
  return (
    <span className="relative block h-[19px] w-[19px]" aria-hidden="true">
      <span className="absolute left-[3px] top-[5px] h-[11px] w-[12px] rotate-[-18deg] rounded-[4px] bg-[#D1D5DB] shadow-[0_1px_1px_rgba(15,23,41,0.14)]" />
      <span className="absolute left-[5px] top-[3px] h-[11px] w-[12px] rotate-[-8deg] rounded-[4px] bg-[#F5F6F7] shadow-[0_1px_2px_rgba(15,23,41,0.16)]" />
      <span className="absolute left-[7px] top-[1px] h-[11px] w-[12px] rotate-[7deg] rounded-[4px] border border-[#0F1729] bg-white shadow-[0_3px_5px_rgba(15,23,41,0.16)]">
        <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-[#0F1729]" />
      </span>
    </span>
  );
}

function PriceInput({
  value,
  placeholder,
  onChange,
}: {
  value?: number;
  placeholder: string;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">$</span>
      <input
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? parseInt(event.target.value) : undefined)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#E5E7EB] py-2.5 pl-7 pr-3 text-sm outline-none transition-colors hover:border-[#D1D5DB] focus:border-[#0F1729]"
      />
    </div>
  );
}
