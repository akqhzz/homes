'use client';
import { useEffect, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Bell, Bookmark, LogOut, Menu, MessageSquare, Search, Shield, SlidersHorizontal, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import { Location, PropertyType } from '@/lib/types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'condo', label: 'Condo' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'semi-detached', label: 'Semi-Det.' },
  { value: 'detached', label: 'Detached' },
];
const PRICE_MIN = 0;
const PRICE_MAX = 2000000;
const PRICE_STEP = 50000;

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

export default function DesktopHeader() {
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations, filters, setFilters, resetFilters, addLocation, removeLocation, clearLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { setActivePanel } = useUIStore();

  const filterCount = activeFilterCount();
  const locationLabel =
    selectedLocations.length === 0
      ? 'Where?'
      : selectedLocations.length === 1
      ? selectedLocations[0].name
      : `${selectedLocations[0].name}, +${selectedLocations.length - 1}`;

  const priceRange = [filters.minPrice ?? PRICE_MIN, filters.maxPrice ?? PRICE_MAX];
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

  useEffect(() => {
    if (!showFilter && !showSearch && !showMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!filterRef.current?.contains(target)) setShowFilter(false);
      if (!searchRef.current?.contains(target)) setShowSearch(false);
      if (!menuRef.current?.contains(target)) setShowMenu(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilter, showSearch, showMenu]);

  useEffect(() => {
    if (!showSearch) return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showSearch]);

  return (
    <>
      <header className="hidden lg:flex min-h-[76px] border-b border-[#F0F0F0] bg-white items-center px-6 py-3 gap-6 flex-shrink-0 z-30">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="font-heading text-lg text-[#0F1729]">homes</span>
        </button>

        {/* Centered search */}
        <div className="flex-1 flex items-center justify-center gap-2 max-w-2xl mx-auto">
          <div ref={searchRef} className="relative flex-1">
            <div
              onClick={() => {
                setShowSearch(true);
                setShowFilter(false);
                setShowMenu(false);
              }}
              className={cn(
                'flex min-h-[46px] w-full min-w-0 cursor-text items-center gap-2.5 rounded-full bg-white px-4 text-left shadow-[var(--shadow-control)] transition-all hover:bg-[#F9FAFB]',
                showSearch && 'shadow-[inset_0_0_0_1.5px_#0F1729,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
            >
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              {showSearch ? (
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                  {filteredLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => {
                        addLocation(location);
                        setSearchQuery('');
                        setShowSearch(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]"
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
                'relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7] no-select',
                filterCount > 0 && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
              aria-label="Filters"
            >
              <SlidersHorizontal size={18} className="text-[#0F1729]" />
              {filterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 text-[8px] font-bold leading-none text-white">
                  {filterCount}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-12 z-40 max-h-[calc(100vh-7rem)] w-[390px] overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#0F1729]">Price Range</p>
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
                      className="relative flex h-9 w-full touch-none select-none items-center cursor-pointer"
                      aria-label="Desktop price range"
                    >
                      <Slider.Track className="relative h-1.5 grow cursor-pointer overflow-hidden rounded-full bg-[#E5E7EB]">
                        <Slider.Range className="absolute h-full rounded-full bg-[#0F1729]" />
                      </Slider.Track>
                      <Slider.Thumb className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10" />
                      <Slider.Thumb className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10" />
                    </Slider.Root>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#0F1729]">Property Type</p>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => togglePropertyType(value)}
                          className={cn(
                            'rounded-full border px-3 py-2 text-xs font-medium transition-all hover:bg-[#F5F6F7]',
                            filters.propertyTypes.includes(value)
                              ? 'border-[#0F1729] bg-[#0F1729] text-white'
                              : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SegmentedFilter
                    title="Bedrooms"
                    options={['Any', '1', '2', '3', '4', '5']}
                    activeValue={filters.minBeds?.toString() ?? 'Any'}
                    onSelect={(value) => setFilters({ minBeds: value === 'Any' ? undefined : parseInt(value) })}
                  />
                  <SegmentedFilter
                    title="Bathrooms"
                    options={['Any', '1', '2', '3', '4']}
                    activeValue={filters.minBaths?.toString() ?? 'Any'}
                    onSelect={(value) => setFilters({ minBaths: value === 'Any' ? undefined : parseInt(value) })}
                  />
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#0F1729]">Listed Within</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 1, label: '1 day' },
                        { value: 7, label: '1 week' },
                        { value: 30, label: '1 month' },
                        { value: 90, label: '3 months' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setFilters({ maxDaysOnMarket: filters.maxDaysOnMarket === value ? undefined : value })}
                          className={cn(
                            'rounded-xl border py-2.5 text-sm font-medium transition-all hover:bg-[#F5F6F7]',
                            filters.maxDaysOnMarket === value
                              ? 'border-[#0F1729] bg-[#0F1729] text-white hover:bg-[#0F1729]'
                              : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#0F1729]">Square Footage</p>
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
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={resetFilters} className="h-11 rounded-full bg-[#F5F6F7] text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]">
                      Reset
                    </button>
                    <button onClick={() => setShowFilter(false)} className="h-11 rounded-full bg-[#0F1729] text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActivePanel('saved-searches')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1729] text-white shadow-[var(--shadow-control)] transition-colors hover:bg-[#1F2937]"
            aria-label="Saved searches"
          >
            <Bookmark size={17} />
          </button>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => router.push('/saved')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-[#F5F6F7]',
              pathname.startsWith('/saved') ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:text-[#0F1729]'
            )}
          >
            Saved
          </button>
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
            )}
          </div>
        </nav>
      </header>

    </>
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
      <p className="mb-3 text-sm font-semibold text-[#0F1729]">{title}</p>
      <div className="flex gap-2">
        {options.map((option) => {
          const active = activeValue === option;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={cn(
                'h-11 w-11 shrink-0 rounded-full border text-sm font-medium transition-all hover:bg-[#F5F6F7]',
                active
                  ? 'border-[#0F1729] bg-[#0F1729] text-white hover:bg-[#0F1729]'
                  : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
              )}
            >
              {option === options[options.length - 1] && option !== 'Any' ? `${option}+` : option}
            </button>
          );
        })}
      </div>
    </div>
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
