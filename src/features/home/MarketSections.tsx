'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DollarSign, LayoutGrid, Home, Building2, Warehouse, ArrowRight, TrendingUp } from 'lucide-react';
import { AreaSparkline, HBarChart, PieChart, ScoreRing } from '@/components/ui/charts';
import { SectionHeader } from '@/features/home/SectionHeader';
import { MOCK_LISTINGS, MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatPriceFull, formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/* ══════════════════════════════════════════════════════════════════
   Derived market data (computed from the mock listings/neighbourhoods)
══════════════════════════════════════════════════════════════════ */

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pricesOfType = (type: string) => MOCK_LISTINGS.filter((l) => l.propertyType === type).map((l) => l.price);

const STATS = [
  { label: 'Avg. Listing Price', value: formatPriceFull(Math.round(mean(MOCK_LISTINGS.map((l) => l.price)))), icon: DollarSign, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { label: 'Active Listings', value: MOCK_LISTINGS.filter((l) => l.listingStatus !== 'sold').length.toLocaleString(), icon: LayoutGrid, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { label: 'Avg. House Price', value: formatPriceFull(Math.round(mean(pricesOfType('house')))), icon: Home, tint: 'text-[var(--color-success)] bg-[#e9f9f2]' },
  { label: 'Avg. Condo Price', value: formatPriceFull(Math.round(mean(pricesOfType('condo')))), icon: Building2, tint: 'text-[#7c5cff] bg-[#f0edff]' },
  { label: 'Avg. Townhouse Price', value: formatPriceFull(Math.round(mean(pricesOfType('townhouse')))), icon: Warehouse, tint: 'text-[#d9930b] bg-[#fdf3df]' },
];

const TYPE_SLICES = [
  { label: 'House', type: 'house', color: 'var(--color-success)' },
  { label: 'Condo Apt', type: 'condo', color: 'var(--color-brand-400)' },
  { label: 'Townhouse', type: 'townhouse', color: 'var(--color-primary)' },
].map((s) => ({ label: s.label, color: s.color, value: MOCK_LISTINGS.filter((l) => l.propertyType === s.type).length || 1 }));

const VOLUME_BANDS = [
  { label: '$500k - $1M', min: 500_000, max: 1_000_000 },
  { label: '$1M - $1.5M', min: 1_000_000, max: 1_500_000 },
  { label: '$1.5M - $2.5M', min: 1_500_000, max: 2_500_000 },
  { label: '$2.5M - $5M', min: 2_500_000, max: 5_000_000 },
].map((b) => ({ ...b, count: MOCK_LISTINGS.filter((l) => l.price >= b.min && l.price < b.max).length }));
const VOLUME_TOTAL = VOLUME_BANDS.reduce((s, b) => s + b.count, 0) || 1;
const VOLUME_ROWS = VOLUME_BANDS.map((b) => {
  const pct = Math.round((b.count / VOLUME_TOTAL) * 100);
  return { label: b.label, value: pct, sub: `${pct}%` };
});
const MOST_ACTIVE_BAND = [...VOLUME_BANDS].sort((a, b) => b.count - a.count)[0];

// 12 evenly-sized chronological buckets → median price per bucket (a real-ish trend).
const TREND_POINTS = (() => {
  const sorted = [...MOCK_LISTINGS].sort((a, b) => a.listingDate.localeCompare(b.listingDate));
  const n = 12, size = Math.max(1, Math.floor(sorted.length / n));
  const pts: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const chunk = sorted.slice(i * size, (i + 1) * size).map((l) => l.price);
    if (chunk.length) pts.push(median(chunk));
  }
  return pts.length >= 2 ? pts : MOCK_LISTINGS.map((l) => l.price).slice(0, 12);
})();
const MEDIAN_PRICE = median(MOCK_LISTINGS.map((l) => l.price));

const HEALTH = {
  daysOnMarket: Math.round(mean(MOCK_LISTINGS.map((l) => l.daysOnMarket))),
  sellToList: 97.5,
  pricePerSqft: Math.round(mean(MOCK_LISTINGS.filter((l) => l.sqft).map((l) => l.price / l.sqft))),
  medianRent: 2500,
};

const COMMUTE = [
  { label: 'Walk Score', sub: 'Very Walkable', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.walkScore))), color: 'var(--color-success)' },
  { label: 'Transit Score', sub: 'Excellent Transit', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.transitScore))), color: 'var(--color-brand-600)' },
  { label: 'Bike Score', sub: 'Very Bikeable', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.walkScore)) * 0.72), color: 'var(--color-accent-orange)' },
];

const CITY = MOCK_NEIGHBORHOODS[0]?.city ?? 'Toronto';

/* ══════════════════════════════════════════════════════════════════
   Shared card chrome
══════════════════════════════════════════════════════════════════ */

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col rounded-[24px] border border-[var(--color-border)] bg-white p-6', className)}>
      <h3 className="type-subtitle !text-[1.3rem] text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function MiniStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-4">
      <p className="type-title !text-[1.45rem] text-[var(--color-text-primary)]">
        {value}
        {unit && <span className="type-caption ml-1 font-medium text-[var(--color-text-secondary)]">{unit}</span>}
      </p>
      <p className="mt-1 type-nano uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   1. KPI stats strip
══════════════════════════════════════════════════════════════════ */

export function MarketStatsStrip() {
  return (
    <section className="w-full px-5 pt-4 lg:px-12 lg:pt-5">
      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible">
        {STATS.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="flex min-w-[220px] items-center gap-3.5 rounded-[20px] border border-[var(--color-border)] bg-white px-5 py-4 lg:min-w-0">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]', tint)}>
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[1.4rem] font-bold leading-tight text-[var(--color-text-primary)]">{value}</p>
              <p className="type-nano uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. Market insights dashboard + commute
══════════════════════════════════════════════════════════════════ */

export function MarketBoard() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(680, ref.current.clientWidth * 0.85), behavior: 'smooth' });
  const trendDelta = TREND_POINTS.length >= 2
    ? ((TREND_POINTS[TREND_POINTS.length - 1] - TREND_POINTS[0]) / (TREND_POINTS[0] || 1)) * 100
    : 0;
  const CARD = 'shrink-0 snap-start';
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title="Market Insights"
        onArrow={() => router.push('/for-you')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      {/* One-line, horizontally scrollable row of insight cards */}
      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Panel title="Property Type Distribution" className={cn(CARD, 'w-[320px]')}>
          <div className="flex flex-1 items-center">
            <PieChart slices={TYPE_SLICES} />
          </div>
        </Panel>

        <Panel title="Market Volume" className={cn(CARD, 'w-[348px]')}>
          <div className="mb-4 flex items-start justify-between gap-2">
            <p className="text-[1.6rem] font-bold leading-none text-[var(--color-text-primary)]">
              {VOLUME_TOTAL.toLocaleString()} <span className="type-caption font-medium text-[var(--color-text-tertiary)]">Total Listings</span>
            </p>
            <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2.5 py-1 type-nano font-semibold uppercase tracking-wide text-white">
              {MOST_ACTIVE_BAND.label}
            </span>
          </div>
          <HBarChart rows={VOLUME_ROWS} color="var(--color-primary)" />
        </Panel>

        <Panel title="Median Price Trend" className={cn(CARD, 'w-[348px]')}>
          <div className="mb-3 flex items-center gap-2.5">
            <p className="text-[1.6rem] font-bold leading-none text-[var(--color-text-primary)]">{formatPrice(MEDIAN_PRICE)}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f9f2] px-2 py-0.5 type-caption font-semibold text-[var(--color-success)]">
              <TrendingUp className="h-3 w-3" />{Math.abs(trendDelta).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end">
            <AreaSparkline points={TREND_POINTS} color="var(--color-success)" height={92} />
            <div className="mt-1 flex justify-between type-caption text-[var(--color-text-tertiary)]">
              <span>Jul ’25</span><span>Jun ’26</span>
            </div>
          </div>
        </Panel>

        <Panel title="Market Health" className={cn(CARD, 'w-[360px]')}>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <MiniStat value={`${HEALTH.daysOnMarket}`} unit="days" label="Avg. days on market" />
            <MiniStat value={`${HEALTH.sellToList}%`} label="Sell-to-list ratio" />
            <MiniStat value={`$${HEALTH.pricePerSqft}`} unit="/sqft" label="Avg. price per sq.ft" />
            <MiniStat value={`$${HEALTH.medianRent.toLocaleString()}`} unit="/mo" label="Median rent" />
          </div>
        </Panel>

        <Panel title="Getting Around" className={cn(CARD, 'w-[300px]')}>
          <div className="flex flex-1 flex-col justify-center gap-4">
            {COMMUTE.map((c) => (
              <div key={c.label} className="flex items-center gap-3.5">
                <ScoreRing value={c.value} color={c.color} size={52} />
                <div>
                  <p className="type-heading-sm text-[var(--color-text-primary)]">{c.label}</p>
                  <p className="type-caption text-[var(--color-text-secondary)]">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3. "Find your area in <city>" — neighbourhoods + listing counts
══════════════════════════════════════════════════════════════════ */

export function AreaFinder({ onSelect }: { onSelect?: (name: string) => void }) {
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <h2 className="mb-7 type-title-lg !text-[1.7rem] text-[var(--color-text-primary)] sm:!text-[2rem]">Find your area in {CITY}</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MOCK_NEIGHBORHOODS.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect?.(n.name)}
            className="group relative aspect-[5/4] overflow-hidden rounded-[20px] text-left"
          >
            <Image src={n.thumbnail} alt={n.name} fill sizes="(min-width:1024px) 280px, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 type-nano font-semibold text-[var(--color-text-primary)]">
              {n.listingCount} listings
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
              <span className="min-w-0">
                <span className="block truncate type-heading text-white">{n.name}</span>
                <span className="block type-caption text-white/85">Avg. {formatPrice(n.avgPrice)}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 translate-x-1 text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
