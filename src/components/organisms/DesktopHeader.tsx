'use client';
import { useEffect, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Bookmark, Search, SlidersHorizontal } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import { PropertyType } from '@/lib/types';

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

const NAV_LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/saved', label: 'Saved' },
  { href: '/for-you', label: 'For You' },
  { href: '/menu', label: 'More' },
] as const;

export default function DesktopHeader() {
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations, filters, setFilters, resetFilters } = useSearchStore();
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
  const togglePropertyType = (type: PropertyType) => {
    setFilters({
      propertyTypes: filters.propertyTypes.includes(type)
        ? filters.propertyTypes.filter((item) => item !== type)
        : [...filters.propertyTypes, type],
    });
  };

  useEffect(() => {
    if (!showFilter) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setShowFilter(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilter]);

  return (
    <>
      <header className="hidden lg:flex h-16 border-b border-[#F0F0F0] bg-white items-center px-6 gap-6 flex-shrink-0 z-30">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="font-heading text-lg text-[#0F1729]">homes</span>
        </button>

        {/* Centered search */}
        <div className="flex-1 flex items-center justify-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-full px-4 py-2.5 shadow-[var(--shadow-control)] min-h-[44px]">
            <button
              onClick={() => setActivePanel('search')}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              {selectedLocations.length > 0 ? (
                <span className="inline-flex max-w-full items-center truncate rounded-full bg-[#F0F1F2] px-2.5 py-0.5 text-sm font-medium text-[#0F1729]">
                  {locationLabel}
                </span>
              ) : (
                <span className="flex-1 truncate text-sm font-medium text-[#9CA3AF]">{locationLabel}</span>
              )}
            </button>
          </div>

          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilter((value) => !value)}
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
              <div className="absolute right-0 top-12 z-40 w-[360px] rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#0F1729]">Price Range</p>
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
                      className="relative flex h-9 w-full touch-none select-none items-center"
                      aria-label="Desktop price range"
                    >
                      <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[#E5E7EB]">
                        <Slider.Range className="absolute h-full rounded-full bg-[#0F1729]" />
                      </Slider.Track>
                      <Slider.Thumb className="block h-6 w-6 rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none" />
                      <Slider.Thumb className="block h-6 w-6 rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none" />
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
                            'rounded-full border px-3 py-2 text-xs font-medium transition-all',
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
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={resetFilters} className="h-11 rounded-full bg-[#F5F6F7] text-sm font-semibold text-[#0F1729]">
                      Reset
                    </button>
                    <button onClick={() => setShowFilter(false)} className="h-11 rounded-full bg-[#0F1729] text-sm font-semibold text-white">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActivePanel('saved-searches')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
            aria-label="Saved searches"
          >
            <Bookmark size={17} />
          </button>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1 flex-shrink-0">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  active ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:text-[#0F1729]'
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </header>

    </>
  );
}
