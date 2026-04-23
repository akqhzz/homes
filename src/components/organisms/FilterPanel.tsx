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
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  return (
    <MobileDrawer
      title="Filters"
      onClose={() => setActivePanel('none')}
      heightClassName="h-[82dvh]"
      contentClassName="pb-4"
      footer={<FilterPanelFooter totalListings={totalListings} onDone={() => setActivePanel('none')} />}
    >
      <FilterPanelBody />
    </MobileDrawer>
  );
}

export function FilterPanelBody() {
  const { filters, setFilters } = useSearchStore();

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
  const pricePercent = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const handlePriceRangeChange = ([min, max]: number[]) => {
    setFilters({
      minPrice: min <= PRICE_MIN ? undefined : min,
      maxPrice: max >= PRICE_MAX ? undefined : max,
    });
  };

  return (
    <>
      <Section title="Price Range">
        <div>
          <div className="pointer-events-none flex h-12 items-end gap-1 px-1">
            {PRICE_BUCKETS.map((count, index) => {
              const bucketCenter = ((index + 0.5) / PRICE_BUCKETS.length) * 100;
              const inRange = bucketCenter >= pricePercent(priceRange[0]) && bucketCenter <= pricePercent(priceRange[1]);
              return (
                <div
                  key={index}
                  className={cn('flex-1 rounded-t transition-colors', inRange ? 'bg-[#0F1729]' : 'bg-[#E5E7EB]')}
                  style={{ height: `${Math.max(6, count * 3)}px` }}
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
              <Slider.Range className="absolute h-full rounded-full bg-[#0F1729]" />
            </Slider.Track>
            <Slider.Thumb
              className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10"
              aria-label="Minimum price"
            />
            <Slider.Thumb
              className="block h-6 w-6 cursor-grab rounded-full border-2 border-[#0F1729] bg-white shadow-[0_2px_8px_rgba(15,23,41,0.18)] outline-none transition-transform hover:scale-105 active:cursor-grabbing focus:ring-4 focus:ring-[#0F1729]/10"
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

      <Section title="Property Type">
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => togglePropertyType(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 type-btn transition-all',
                filters.propertyTypes.includes(value)
                  ? 'border-[#0F1729] bg-[#0F1729] text-white'
                  : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </Section>

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
                  'h-10 min-w-12 rounded-full border px-3 type-btn transition-all',
                  active
                    ? 'border-[#0F1729] bg-[#0F1729] text-white'
                    : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                )}
              >
                {opt}
              </button>
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
              <button
                key={opt}
                onClick={() => setFilters({ minBaths: val })}
                className={cn(
                  'h-10 min-w-12 rounded-full border px-3 type-btn transition-all',
                  active
                    ? 'border-[#0F1729] bg-[#0F1729] text-white'
                    : 'border-[#E5E7EB] text-[#0F1729] hover:border-[#0F1729]'
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Listed Within">
        <select
          value={selectedListedWithin}
          onChange={(event) => setFilters({ maxDaysOnMarket: event.target.value ? Number(event.target.value) : undefined })}
          className="h-11 w-full cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-4 type-btn text-[#0F1729] outline-none transition-colors hover:border-[#0F1729] focus:border-[#0F1729]"
        >
          <option value="">Any Time</option>
          {DAYS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
    </>
  );
}

export function FilterPanelFooter({
  totalListings = MOCK_LISTINGS.length,
  onDone,
}: {
  totalListings?: number;
  onDone: () => void;
}) {
  const resetFilters = useSearchStore((s) => s.resetFilters);

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="lg" onClick={resetFilters} className="shrink-0">
        Reset
      </Button>
      <Button fullWidth size="lg" onClick={onDone}>
        Show {totalListings} Results
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <h3 className="mb-4 type-heading text-[#0F1729]">{title}</h3>
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
  onChange: (value: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? parseInt(event.target.value) : undefined)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0F1729]"
    />
  );
}
