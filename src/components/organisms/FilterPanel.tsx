'use client';
import * as Slider from '@radix-ui/react-slider';
import { Building2, Home, Hotel, Rows3, Warehouse } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/atoms/Button';
import { PropertyType } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import { MOCK_LISTINGS } from '@/lib/mock-data';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: typeof Home }[] = [
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Hotel },
  { value: 'semi-detached', label: 'Semi-Det.', icon: Rows3 },
  { value: 'detached', label: 'Detached', icon: Warehouse },
];

const BED_OPTIONS = [1, 2, 3, 4, 5];
const BATH_OPTIONS = [1, 2, 3, 4];
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
const PRICE_BUCKETS = [2, 5, 8, 12, 10, 7, 4, 6, 3, 2, 1, 1];

export default function FilterPanel({ totalListings = MOCK_LISTINGS.length }: { totalListings?: number }) {
  const { filters, setFilters, resetFilters } = useSearchStore();
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const togglePropertyType = (type: PropertyType) => {
    const current = filters.propertyTypes;
    if (current.includes(type)) {
      setFilters({ propertyTypes: current.filter((t) => t !== type) });
    } else {
      setFilters({ propertyTypes: [...current, type] });
    }
  };

  const priceRange = [
    filters.minPrice ?? PRICE_MIN,
    filters.maxPrice ?? PRICE_MAX,
  ];
  const selectedListedWithin = DAYS_OPTIONS.find((option) => option.value === filters.maxDaysOnMarket)?.value ?? '';
  const pricePercent = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const handlePriceRangeChange = ([min, max]: number[]) => {
    setFilters({
      minPrice: min <= PRICE_MIN ? undefined : min,
      maxPrice: max >= PRICE_MAX ? undefined : max,
    });
  };

  return (
    <MobileDrawer
      title="Filters"
      onClose={() => setActivePanel('none')}
      heightClassName="h-[82dvh]"
      contentClassName="pb-4"
      footer={(
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={resetFilters} className="shrink-0">
            Reset
          </Button>
          <Button
            fullWidth
            size="lg"
            onClick={() => setActivePanel('none')}
          >
            Show {totalListings} Results
          </Button>
        </div>
      )}
    >
      <Section title="Price Range">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1.5 block">Min Price</label>
              <PriceInput
                value={filters.minPrice}
                placeholder="No min"
                onChange={(v) => setFilters({ minPrice: v })}
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1.5 block">Max Price</label>
              <PriceInput
                value={filters.maxPrice}
                placeholder="No max"
                onChange={(v) => setFilters({ maxPrice: v })}
              />
            </div>
          </div>
          <div className="mt-5">
            <Slider.Root
              data-no-drawer-drag="true"
              value={priceRange}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              minStepsBetweenThumbs={1}
              onValueChange={handlePriceRangeChange}
              className="relative flex h-20 w-full touch-none select-none items-end pb-3"
              aria-label="Price range"
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
              <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[#E5E7EB]">
                <Slider.Range className="absolute h-full rounded-full bg-[#0F1729]" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-6 w-6 rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none focus:ring-4 focus:ring-[#0F1729]/10"
                aria-label="Minimum price"
              />
              <Slider.Thumb
                className="block h-6 w-6 rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none focus:ring-4 focus:ring-[#0F1729]/10"
                aria-label="Maximum price"
              />
            </Slider.Root>
          </div>
      </Section>

        {/* Property Type */}
      <Section title="Property Type">
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => togglePropertyType(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  filters.propertyTypes.includes(value)
                    ? 'bg-[#0F1729] text-white border-[#0F1729]'
                    : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
      </Section>

        {/* Beds */}
      <Section title="Bedrooms">
          <div className="flex gap-2">
            {['Any', ...BED_OPTIONS.map((value) => `${value}+`)].map((opt) => {
              const val = opt === 'Any' ? undefined : parseInt(opt);
              const active = opt === 'Any' ? !filters.minBeds : filters.minBeds === val;
              return (
                <button
                  key={opt}
                  onClick={() => setFilters({ minBeds: val })}
                  className={cn(
                    'h-10 min-w-12 rounded-full px-3 text-sm font-medium border transition-all flex-shrink-0',
                    active
                      ? 'bg-[#0F1729] text-white border-[#0F1729]'
                      : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
      </Section>

        {/* Baths */}
      <Section title="Bathrooms">
          <div className="flex gap-2">
            {['Any', ...BATH_OPTIONS.map((value) => `${value}+`)].map((opt) => {
              const val = opt === 'Any' ? undefined : parseInt(opt);
              const active = opt === 'Any' ? !filters.minBaths : filters.minBaths === val;
              return (
                <button
                  key={opt}
                  onClick={() => setFilters({ minBaths: val })}
                  className={cn(
                    'h-10 min-w-12 rounded-full px-3 text-sm font-medium border transition-all flex-shrink-0',
                    active
                      ? 'bg-[#0F1729] text-white border-[#0F1729]'
                      : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
      </Section>

        {/* Listed Within */}
      <Section title="Listed Within">
          <select
            value={selectedListedWithin}
            onChange={(event) => setFilters({ maxDaysOnMarket: event.target.value ? Number(event.target.value) : undefined })}
            className="h-11 w-full cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0F1729] outline-none transition-colors hover:border-[#0F1729] focus:border-[#0F1729]"
          >
            <option value="">Any Time</option>
            {DAYS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
      </Section>

        {/* Square Footage */}
      <Section title="Square Footage">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1.5 block">Min sqft</label>
              <input
                type="number"
                value={filters.minSqft ?? ''}
                onChange={(e) => setFilters({ minSqft: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No min"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0F1729] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1.5 block">Max sqft</label>
              <input
                type="number"
                value={filters.maxSqft ?? ''}
                onChange={(e) => setFilters({ maxSqft: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No max"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0F1729] transition-colors"
              />
            </div>
          </div>
      </Section>
    </MobileDrawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 border-b border-[#F5F6F7]">
      <h3 className="font-heading text-lg text-[#0F1729] mb-4">{title}</h3>
      {children}
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
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">$</span>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
        placeholder={placeholder}
        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0F1729] transition-colors"
      />
    </div>
  );
}
