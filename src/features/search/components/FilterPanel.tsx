'use client';
import { useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Building2, ChevronDown, DoorOpen, Droplets, Flame, Home, Hotel, ImageOff, LandPlot, Store, Tractor, Warehouse, Waves } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { AmenityFilter, ListingStatus, LockerFilter, PropertyType, SearchType } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import MobileDrawer from '@/components/ui/MobileDrawer';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import SearchLocationChip from '@/features/search/components/SearchLocationChip';
import { applyFilters } from '@/lib/search/filters';
import { formatPriceRangeLabel, formatCompactPriceValue, parseCompactPriceValue } from '@/lib/utils/search-display';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: typeof Home }[] = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Hotel },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'land', label: 'Land', icon: LandPlot },
  { value: 'commercial', label: 'Commercial', icon: Store },
  { value: 'farm', label: 'Farm', icon: Tractor },
];

const BED_OPTIONS = [1, 2, 3, 4, 5];
const BATH_OPTIONS = [1, 2, 3, 4];
const PARKING_OPTIONS = [1, 2, 3, 4];
const SEARCH_TYPE_OPTIONS: Array<{ value: SearchType; label: string }> = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'sold', label: 'Sold' },
];
const LISTING_STATUS_OPTIONS: Array<{ value: ListingStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
];
const AMENITY_OPTIONS: Array<{ value: AmenityFilter; label: string; icon: typeof Home }> = [
  { value: 'garage', label: 'Garage', icon: Warehouse },
  { value: 'pool', label: 'Pool', icon: Droplets },
  { value: 'waterfront', label: 'Waterfront', icon: Waves },
  { value: 'fireplace', label: 'Fireplace', icon: Flame },
  { value: 'open-house', label: 'Open House', icon: DoorOpen },
];
const LOCKER_OPTIONS: Array<{ value: LockerFilter | undefined; label: string }> = [
  { value: undefined, label: 'Any' },
  { value: 'has', label: 'Has Locker' },
  { value: 'none', label: "Doesn't Have" },
];
const DAYS_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 90, label: '3 months' },
];
const PRICE_MIN = 0;
const PRICE_MAX = 2000000;
const PRICE_STEP = 50000;
const PRICE_BUCKET_COUNT = 12;
const PRICE_BAR_MAX_HEIGHT = 44;

export default function FilterPanel({ totalListings = MOCK_LISTINGS.length }: { totalListings?: number }) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  return (
    <MobileDrawer
      title="Filters"
      onClose={() => setActivePanel('none')}
      heightClassName="max-h-[88dvh]"
      contentClassName="pb-4"
      footer={<FilterPanelFooter totalListings={totalListings} onDone={() => setActivePanel('none')} />}
    >
      <FilterPanelBody />
    </MobileDrawer>
  );
}

export function FilterPanelBody() {
  const { filters, setFilters } = useSearchStore();
  const selectedSearchType = filters.searchType ?? 'buy';
  const selectedListingStatus = filters.listingStatus ?? 'active';
  const showCondoTownhouseFilters = filters.propertyTypes.includes('condo') || filters.propertyTypes.includes('townhouse');

  const togglePropertyType = (type: PropertyType) => {
    const current = filters.propertyTypes;
    if (current.includes(type)) {
      setFilters({ propertyTypes: current.filter((t) => t !== type) });
    } else {
      setFilters({ propertyTypes: [...current, type] });
    }
  };

  const priceRange = [filters.minPrice ?? PRICE_MIN, filters.maxPrice ?? PRICE_MAX];
  const selectedListedWithin = DAYS_OPTIONS.find((option) => option.value === filters.maxDaysOnMarket)?.value ?? '';
  const priceHistogram = useMemo(() => {
    const nonPriceFilteredListings = applyFilters(MOCK_LISTINGS, {
      ...filters,
      minPrice: undefined,
      maxPrice: undefined,
    });

    return buildPriceHistogram(nonPriceFilteredListings, PRICE_BUCKET_COUNT);
  }, [filters]);
  const maxPriceBucketCount = Math.max(1, ...priceHistogram);

  const handlePriceRangeChange = ([min, max]: number[]) => {
    setFilters({
      minPrice: min <= PRICE_MIN ? undefined : min,
      maxPrice: max >= PRICE_MAX ? undefined : max,
    });
  };

  const handleSearchTypeChange = (value: SearchType) => {
    setFilters({
      searchType: value,
      listingStatus: value === 'sold' ? 'sold' : filters.listingStatus === 'sold' ? 'active' : filters.listingStatus,
    });
  };

  const toggleAmenity = (amenity: AmenityFilter) => {
    const current = filters.amenities ?? [];
    if (current.includes(amenity)) {
      setFilters({ amenities: current.filter((item) => item !== amenity) });
    } else {
      setFilters({ amenities: [...current, amenity] });
    }
  };

  return (
    <>
      <Section title="Search Type">
        <SegmentedControl
          value={selectedSearchType}
          options={SEARCH_TYPE_OPTIONS}
          onChange={handleSearchTypeChange}
          className="w-full shadow-none ring-1 ring-[#E5E7EB]"
          activeItemClassName="text-white"
          inactiveItemClassName="text-[#0F1729] hover:bg-[var(--color-surface)]"
          indicatorClassName="bg-[var(--color-brand-600)]"
        />
      </Section>

      <Section title="Price Range">
        <div>
          <div className="pointer-events-none flex h-12 items-end gap-1 px-1">
            {priceHistogram.map((count, index) => {
              const bucketMin = PRICE_MIN + (index / priceHistogram.length) * (PRICE_MAX - PRICE_MIN);
              const bucketMax = PRICE_MIN + ((index + 1) / priceHistogram.length) * (PRICE_MAX - PRICE_MIN);
              const inRange = bucketMax >= priceRange[0] && bucketMin <= priceRange[1];
              const height = count === 0 ? 3 : Math.max(6, Math.round((count / maxPriceBucketCount) * PRICE_BAR_MAX_HEIGHT));
              return (
                <div
                  key={index}
                  className={cn('flex-1 rounded-t transition-colors', inRange ? 'bg-[var(--color-brand-600)]' : 'bg-[#E5E7EB]')}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
          <Slider.Root
            data-no-drawer-drag="true"
            value={priceRange}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            minStepsBetweenThumbs={1}
            onValueChange={handlePriceRangeChange}
            className="relative -mt-[13px] flex h-8 w-full touch-none select-none items-center"
            aria-label="Price range"
          >
            <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[#E5E7EB]">
              <Slider.Range className="absolute h-full rounded-full bg-[var(--color-brand-600)]" />
            </Slider.Track>
            <Slider.Thumb
              className="block h-6 w-6 cursor-grab rounded-full border-2 border-[var(--color-brand-600)] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[color:var(--color-brand-600)]/10"
              aria-label="Minimum price"
            />
            <Slider.Thumb
              className="block h-6 w-6 cursor-grab rounded-full border-2 border-[var(--color-brand-600)] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[color:var(--color-brand-600)]/10"
              aria-label="Maximum price"
            />
          </Slider.Root>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block type-caption text-[#9CA3AF]">Min Price</label>
            <PriceInput
              value={filters.minPrice}
              placeholder="No min"
              onChange={(v) => setFilters({ minPrice: v })}
            />
          </div>
          <div>
            <label className="mb-1.5 block type-caption text-[#9CA3AF]">Max Price</label>
            <PriceInput
              value={filters.maxPrice}
              placeholder="No max"
              onChange={(v) => setFilters({ maxPrice: v })}
            />
          </div>
        </div>
      </Section>

      <Section title="Home Type">
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
            <FilterChip
              key={value}
              active={filters.propertyTypes.includes(value)}
              onClick={() => togglePropertyType(value)}
              className="px-4"
            >
              <Icon size={14} />
              {label}
            </FilterChip>
          ))}
        </div>
      </Section>

      <Section title="Bedrooms">
        <div className="flex gap-2">
          {['Any', ...BED_OPTIONS.map((value) => `${value}+`)].map((opt) => {
            const val = opt === 'Any' ? undefined : parseInt(opt);
            const active = opt === 'Any' ? !filters.minBeds : filters.minBeds === val;
            return (
              <FilterChip
                key={opt}
                active={active}
                onClick={() => setFilters({ minBeds: val })}
                selectedTone="filled"
                className="min-w-12 px-3"
              >
                {opt}
              </FilterChip>
            );
          })}
        </div>
      </Section>

      <Section title="Bathrooms">
        <div className="flex gap-2">
          {['Any', ...BATH_OPTIONS.map((value) => `${value}+`)].map((opt) => {
            const val = opt === 'Any' ? undefined : parseInt(opt);
            const active = opt === 'Any' ? !filters.minBaths : filters.minBaths === val;
            return (
              <FilterChip
                key={opt}
                active={active}
                onClick={() => setFilters({ minBaths: val })}
                selectedTone="filled"
                className="min-w-12 px-3"
              >
                {opt}
              </FilterChip>
            );
          })}
        </div>
      </Section>

      <Section title="Parking">
        <div className="flex gap-2">
          {['Any', ...PARKING_OPTIONS.map((value) => `${value}+`)].map((opt) => {
            const val = opt === 'Any' ? undefined : parseInt(opt);
            const active = opt === 'Any' ? !filters.minParking : filters.minParking === val;
            return (
              <FilterChip
                key={opt}
                active={active}
                onClick={() => setFilters({ minParking: val })}
                selectedTone="filled"
                className="min-w-12 px-3"
              >
                {opt}
              </FilterChip>
            );
          })}
        </div>
      </Section>

      <Section title="Square Footage">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block type-caption text-[#9CA3AF]">Min sqft</label>
            <input
              type="number"
              value={filters.minSqft ?? ''}
              onChange={(e) => setFilters({ minSqft: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No min"
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0F1729]"
            />
          </div>
          <div>
            <label className="mb-1.5 block type-caption text-[#9CA3AF]">Max sqft</label>
            <input
              type="number"
              value={filters.maxSqft ?? ''}
              onChange={(e) => setFilters({ maxSqft: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No max"
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0F1729]"
            />
          </div>
        </div>
      </Section>

      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(({ value, label, icon: Icon }) => (
            <FilterChip
              key={value}
              active={(filters.amenities ?? []).includes(value)}
              onClick={() => toggleAmenity(value)}
              className="px-4"
            >
              <Icon size={14} />
              {label}
            </FilterChip>
          ))}
        </div>
      </Section>

      <Section title="Listed Within">
        <div className="relative">
          <select
            value={selectedListedWithin}
            onChange={(event) => setFilters({ maxDaysOnMarket: event.target.value ? Number(event.target.value) : undefined })}
            className="h-11 w-full cursor-pointer appearance-none rounded-full border border-[#E5E7EB] bg-white px-4 pr-11 type-btn text-[#0F1729] outline-none transition-colors hover:border-[#0F1729] focus:border-[#0F1729]"
          >
            <option value="">Any Time</option>
            {DAYS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[#6B7280]" />
        </div>
      </Section>

      {showCondoTownhouseFilters && (
        <Section title="Condo & Townhouse">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block type-caption text-[#9CA3AF]">Locker</label>
              <div className="flex flex-wrap gap-2">
                {LOCKER_OPTIONS.map(({ value, label }) => (
                  <FilterChip
                    key={value ?? 'any'}
                    active={filters.locker === value}
                    onClick={() => setFilters({ locker: value })}
                    className="px-4"
                  >
                    {label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block type-caption text-[#9CA3AF]">Max maintenance fee</label>
              <PriceInput
                value={filters.maxMaintenanceFee}
                placeholder="No max"
                onChange={(v) => setFilters({ maxMaintenanceFee: v })}
              />
            </div>
          </div>
        </Section>
      )}

      <Section title="Photos">
        <ToggleRow
          label="Hide listings without images"
          icon={<ImageOff size={15} />}
          checked={Boolean(filters.hideNoImages)}
          onChange={(checked) => setFilters({ hideNoImages: checked ? true : undefined })}
        />
      </Section>

      <Section title="Listing Status">
        <SegmentedControl
          value={selectedListingStatus}
          options={LISTING_STATUS_OPTIONS}
          onChange={(value) => setFilters({
            listingStatus: value,
            searchType: value === 'sold' ? 'sold' : filters.searchType === 'sold' ? 'buy' : filters.searchType,
          })}
          className="w-full shadow-none ring-1 ring-[#E5E7EB]"
          activeItemClassName="text-white"
          inactiveItemClassName="text-[#0F1729] hover:bg-[var(--color-surface)]"
          indicatorClassName="bg-[var(--color-brand-600)]"
        />
      </Section>
    </>
  );
}

function buildPriceHistogram(listings: Array<{ price: number }>, bucketCount: number) {
  const bucketSize = (PRICE_MAX - PRICE_MIN) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, () => 0);

  listings.forEach(({ price }) => {
    const clampedPrice = Math.min(Math.max(price, PRICE_MIN), PRICE_MAX);
    const bucketIndex = Math.min(bucketCount - 1, Math.floor((clampedPrice - PRICE_MIN) / bucketSize));
    buckets[bucketIndex] += 1;
  });

  return buckets;
}

export function FilterPanelFooter({
  totalListings,
  onDone,
}: {
  totalListings?: number;
  onDone: () => void;
}) {
  const resetFilters = useSearchStore((s) => s.resetFilters);
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const selectedFilterChips = getSelectedFilterChips(filters, setFilters);
  const resultCount = useMemo(
    () => totalListings ?? applyFilters(MOCK_LISTINGS, filters).length,
    [filters, totalListings]
  );

  return (
    <div className="space-y-3">
      {selectedFilterChips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {selectedFilterChips.map((chip) => (
            <SearchLocationChip
              key={chip.key}
              label={chip.label}
              onRemove={chip.onRemove}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={resetFilters} className="shrink-0">
          Clear
        </Button>
        <Button fullWidth size="lg" onClick={onDone}>
          Show {resultCount} Results
        </Button>
      </div>
    </div>
  );
}

function getSelectedFilterChips(
  filters: ReturnType<typeof useSearchStore.getState>['filters'],
  setFilters: ReturnType<typeof useSearchStore.getState>['setFilters']
) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (filters.searchType === 'rent') {
    chips.push({
      key: 'mode',
      label: 'Rent',
      onRemove: () => setFilters({ searchType: 'buy' }),
    });
  }
  if (filters.searchType === 'sold') {
    chips.push({
      key: 'mode',
      label: 'Sold',
      onRemove: () => setFilters({ searchType: 'buy', listingStatus: 'active' }),
    });
  }
  if (filters.searchType !== 'sold' && filters.listingStatus && filters.listingStatus !== 'active') {
    chips.push({
      key: 'status',
      label: LISTING_STATUS_OPTIONS.find((option) => option.value === filters.listingStatus)?.label ?? filters.listingStatus,
      onRemove: () => setFilters({ listingStatus: 'active' }),
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      key: 'price',
      label: formatPriceRangeLabel(filters.minPrice, filters.maxPrice) ?? '',
      onRemove: () => setFilters({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (filters.propertyTypes.length > 0) {
    chips.push(
      ...filters.propertyTypes.map((value) => ({
        key: `property-${value}`,
        label: PROPERTY_TYPES.find((item) => item.value === value)?.label ?? value,
        onRemove: () => setFilters({ propertyTypes: filters.propertyTypes.filter((item) => item !== value) }),
      }))
    );
  }
  if (filters.minBeds) {
    chips.push({
      key: 'beds',
      label: `${filters.minBeds}+ bd`,
      onRemove: () => setFilters({ minBeds: undefined }),
    });
  }
  if (filters.minBaths) {
    chips.push({
      key: 'baths',
      label: `${filters.minBaths}+ ba`,
      onRemove: () => setFilters({ minBaths: undefined }),
    });
  }
  if (filters.minParking) {
    chips.push({
      key: 'parking',
      label: `${filters.minParking}+ parking`,
      onRemove: () => setFilters({ minParking: undefined }),
    });
  }
  if (filters.maxDaysOnMarket) {
    chips.push({
      key: 'days',
      label: DAYS_OPTIONS.find((option) => option.value === filters.maxDaysOnMarket)?.label ?? `${filters.maxDaysOnMarket} days`,
      onRemove: () => setFilters({ maxDaysOnMarket: undefined }),
    });
  }
  if (filters.minSqft || filters.maxSqft) {
    chips.push({
      key: 'sqft',
      label:
        filters.minSqft && filters.maxSqft
          ? `${filters.minSqft}-${filters.maxSqft} sqft`
          : filters.minSqft
          ? `Min ${filters.minSqft} sqft`
          : `Max ${filters.maxSqft} sqft`,
      onRemove: () => setFilters({ minSqft: undefined, maxSqft: undefined }),
    });
  }
  if ((filters.amenities?.length ?? 0) > 0) {
    chips.push(
      ...filters.amenities!.map((value) => ({
        key: `amenity-${value}`,
        label: AMENITY_OPTIONS.find((item) => item.value === value)?.label ?? value,
        onRemove: () => setFilters({ amenities: filters.amenities?.filter((item) => item !== value) ?? [] }),
      }))
    );
  }
  if (filters.locker) {
    chips.push({
      key: 'locker',
      label: filters.locker === 'has' ? 'Has locker' : 'No locker',
      onRemove: () => setFilters({ locker: undefined }),
    });
  }
  if (filters.maxMaintenanceFee) {
    chips.push({
      key: 'maintenance',
      label: `Max ${formatCompactPriceValue(filters.maxMaintenanceFee)} maintenance`,
      onRemove: () => setFilters({ maxMaintenanceFee: undefined }),
    });
  }
  if (filters.hideNoImages) {
    chips.push({
      key: 'images',
      label: 'Images only',
      onRemove: () => setFilters({ hideNoImages: undefined }),
    });
  }
  return chips;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <h3 className="mb-4 type-heading text-[#0F1729]">{title}</h3>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  selectedTone = 'subtle',
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { active: boolean; selectedTone?: 'filled' | 'subtle' }) {
  return (
    <Button
      variant="secondary"
      size="md"
      className={cn(
        'h-10 gap-1.5 border shadow-none',
        active
          ? selectedTone === 'filled'
            ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-600)]'
            : 'border-[var(--color-brand-300)] bg-[var(--color-brand-50)] text-[var(--color-brand-900)] hover:border-[#0F1729] hover:bg-[var(--color-brand-50)]'
          : 'border-[#E5E7EB] bg-white text-[#0F1729] hover:border-[#0F1729] hover:bg-white',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

function ToggleRow({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-left transition-colors hover:border-[#0F1729]"
      aria-pressed={checked}
    >
      <span className="flex min-w-0 items-center gap-2.5 type-label text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-secondary)]">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[var(--color-brand-600)]' : 'bg-[#E5E7EB]'
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </span>
    </button>
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
  const [draftValue, setDraftValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused ? draftValue : value ? formatCompactPriceValue(value) : '';

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={(event) => {
        const nextDraftValue = event.target.value;
        setDraftValue(nextDraftValue);
        onChange(parseCompactPriceValue(nextDraftValue));
      }}
      onFocus={() => {
        setIsFocused(true);
        setDraftValue(value ? formatCompactPriceValue(value) : '');
      }}
      onBlur={() => {
        setIsFocused(false);
        setDraftValue('');
      }}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0F1729]"
    />
  );
}
