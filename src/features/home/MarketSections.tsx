'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  DollarSign, LayoutGrid, Home, Building2, Warehouse, ArrowRight, TrendingUp,
  Trees, Dumbbell, BookOpen, Utensils, Wine, Coffee, Star, Footprints, TrainFront, Bike,
} from 'lucide-react';
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

const fmtFull = (n: number) => formatPriceFull(Math.round(n));
const fmtCount = (n: number) => Math.round(n).toLocaleString();
const STATS = [
  { label: 'Avg. Listing Price', value: mean(MOCK_LISTINGS.map((l) => l.price)), format: fmtFull, icon: DollarSign, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { label: 'Active Listings', value: MOCK_LISTINGS.filter((l) => l.listingStatus !== 'sold').length, format: fmtCount, icon: LayoutGrid, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { label: 'Avg. House Price', value: mean(pricesOfType('house')), format: fmtFull, icon: Home, tint: 'text-[var(--color-success)] bg-[#e9f9f2]' },
  { label: 'Avg. Condo Price', value: mean(pricesOfType('condo')), format: fmtFull, icon: Building2, tint: 'text-[#7c5cff] bg-[#f0edff]' },
  { label: 'Avg. Townhouse Price', value: mean(pricesOfType('townhouse')), format: fmtFull, icon: Warehouse, tint: 'text-[#d9930b] bg-[#fdf3df]' },
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
  { label: 'Walk Score', sub: 'Very Walkable', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.walkScore))), color: 'var(--color-success)', icon: Footprints },
  { label: 'Transit Score', sub: 'Excellent Transit', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.transitScore))), color: 'var(--color-brand-600)', icon: TrainFront },
  { label: 'Bike Score', sub: 'Very Bikeable', value: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.walkScore)) * 0.72), color: 'var(--color-accent-orange)', icon: Bike },
];

export const CITY = MOCK_NEIGHBORHOODS[0]?.city ?? 'Toronto';

// "Deep dive" city facts (representative figures for the city overview).
const WORLD_TAGS = ['Urban', 'Global', 'Vibrant'];
const AMENITIES = [
  { label: 'Parks', count: '1500+', icon: Trees },
  { label: 'Fitness Centres', count: '400+', icon: Dumbbell },
  { label: 'Libraries', count: '100+', icon: BookOpen },
];
const GROCERIES = { total: '600+', items: [
  { name: 'Loblaws', sub: '60+ in total', color: '#e2231a' },
  { name: 'No Frills', sub: '30+ in total', color: '#fdda24' },
  { name: 'Farm Boy', sub: '20+ in total', color: '#5b9b3e' },
] };
const FOOD = { total: '8000+', items: [
  { name: 'Alo', sub: 'Restaurant', rating: 4.8, icon: Utensils },
  { name: 'Civil Liberties', sub: 'Bar', rating: 4.7, icon: Wine },
  { name: 'Dineen Coffee Co.', sub: 'Café', rating: 4.6, icon: Coffee },
] };
const SCHOOLS = { total: '800+', items: [
  { name: 'Ursula Franklin Academy', sub: 'Public · 9-12', score: 9.5 },
  { name: 'St. Michael’s Choir School', sub: 'Public/Catholic · 3-12', score: 9.6 },
  { name: 'Northmount School', sub: 'Private · K-8', score: 10 },
] };

/* ══════════════════════════════════════════════════════════════════
   Shared card chrome
══════════════════════════════════════════════════════════════════ */

// Counts up to `value` (eased) the first time it scrolls into view.
function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const animate = () => {
      const begin = performance.now();
      const dur = 1100;
      const step = (now: number) => {
        const t = Math.min(1, (now - begin) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(value * eased);
        if (t < 1) raf = requestAnimationFrame(step);
        else setShown(value);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          animate();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref} className={className}>{format(shown)}</span>;
}

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
      <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">{label}</p>
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
        {STATS.map(({ label, value, format, icon: Icon, tint }) => (
          <div key={label} className="flex min-w-[230px] items-center gap-3.5 rounded-[20px] border border-[var(--color-border)]/55 bg-white px-5 py-4 lg:min-w-0">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]', tint)}>
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <CountUp value={value} format={format} className="block truncate text-[1.4rem] font-bold leading-tight text-[var(--color-text-primary)]" />
              <p className="text-[0.8rem] font-medium uppercase tracking-[0.045em] text-[var(--color-text-tertiary)]">{label}</p>
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
  const CARD = 'shrink-0 snap-start min-h-[320px]';
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title={`Market Insights in ${CITY}`}
        onArrow={() => router.push('/for-you')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      {/* One-line, horizontally scrollable row of insight cards */}
      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Panel title="Property Type Distribution" className={cn(CARD, 'w-[330px]')}>
          <div className="flex flex-1 items-center">
            <PieChart slices={TYPE_SLICES} />
          </div>
        </Panel>

        <Panel title="Market Volume" className={cn(CARD, 'w-[360px]')}>
          <div className="mb-5 flex items-start justify-between gap-2">
            <p className="text-[1.7rem] font-bold leading-none text-[var(--color-text-primary)]">
              {VOLUME_TOTAL.toLocaleString()} <span className="type-body font-medium text-[var(--color-text-tertiary)]">Total Listings</span>
            </p>
            <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
              {MOST_ACTIVE_BAND.label}
            </span>
          </div>
          <HBarChart rows={VOLUME_ROWS} color="var(--color-primary)" />
        </Panel>

        <Panel title="Median Price Trend" className={cn(CARD, 'w-[360px]')}>
          <div className="mb-3 flex items-center gap-2.5">
            <p className="text-[1.7rem] font-bold leading-none text-[var(--color-text-primary)]">{formatPrice(MEDIAN_PRICE)}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f9f2] px-2.5 py-1 text-[0.8rem] font-semibold text-[var(--color-success)]">
              <TrendingUp className="h-3.5 w-3.5" />{Math.abs(trendDelta).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end">
            <AreaSparkline points={TREND_POINTS} color="var(--color-success)" height={104} />
            <div className="mt-1.5 flex justify-between text-[0.8rem] text-[var(--color-text-tertiary)]">
              <span>Jul ’25</span><span>Jun ’26</span>
            </div>
          </div>
        </Panel>

        <Panel title="Market Health" className={cn(CARD, 'w-[370px]')}>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <MiniStat value={`${HEALTH.daysOnMarket}`} unit="days" label="Avg. days on market" />
            <MiniStat value={`${HEALTH.sellToList}%`} label="Sell-to-list ratio" />
            <MiniStat value={`$${HEALTH.pricePerSqft}`} unit="/sqft" label="Avg. price per sq.ft" />
            <MiniStat value={`$${HEALTH.medianRent.toLocaleString()}`} unit="/mo" label="Median rent" />
          </div>
        </Panel>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2b. Deep dive — city character, commute, amenities, places
══════════════════════════════════════════════════════════════════ */

function CountPill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-[var(--color-primary)] px-3 py-1 type-caption font-semibold text-white">{children}</span>;
}

export function DeepDive() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(680, ref.current.clientWidth * 0.85), behavior: 'smooth' });
  const CARD = 'shrink-0 snap-start min-h-[360px]';
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title={`Deep Dive into ${CITY}`}
        onArrow={() => router.push('/for-you')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* The world in one city */}
        <div className={cn(CARD, 'flex w-[300px] flex-col rounded-[24px] border border-[var(--color-border)] bg-white p-6')}>
          <h3 className="type-subtitle !text-[1.3rem] leading-tight text-[var(--color-text-primary)]">The World in One City</h3>
          <p className="mt-4 type-body text-[var(--color-text-secondary)]">
            A global powerhouse of culture defined by safe, connected, and vibrant neighbourhoods.
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {WORLD_TAGS.map((t, i) => (
              <span key={t} className={cn('rounded-full px-3 py-1 type-caption font-semibold uppercase tracking-wide',
                ['bg-[var(--color-brand-50)] text-[var(--color-brand-700)]', 'bg-[#e9f9f2] text-[var(--color-success)]', 'bg-[#f0edff] text-[#7c5cff]'][i % 3])}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Commute facts */}
        <Panel title="Commute Facts" className={cn(CARD, 'w-[330px]')}>
          <div className="flex flex-1 flex-col justify-center gap-4">
            {COMMUTE.map(({ label, sub, value, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3.5">
                <ScoreRing value={value} color={color} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="type-heading-sm text-[var(--color-text-primary)]">{label}</p>
                  <p className="type-caption text-[var(--color-text-secondary)]">{sub}</p>
                </div>
                <Icon className="h-6 w-6 shrink-0 text-[var(--color-text-tertiary)]" strokeWidth={1.8} />
              </div>
            ))}
          </div>
        </Panel>

        {/* Top amenities */}
        <Panel title="Top Amenities" className={cn(CARD, 'w-[320px]')}>
          <div className="flex flex-1 flex-col justify-center gap-3">
            {AMENITIES.map(({ label, count, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3.5">
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[var(--color-brand-700)]" strokeWidth={1.9} />
                  <span className="type-body-lg font-medium text-[var(--color-text-primary)]">{label}</span>
                </span>
                <span className="type-subtitle !text-[1.15rem] text-[var(--color-text-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Groceries */}
        <Panel title="Groceries" className={cn(CARD, 'w-[300px]')}>
          <div className="mb-4"><CountPill>{GROCERIES.total}</CountPill></div>
          <div className="flex flex-col gap-3.5">
            {GROCERIES.items.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold text-white" style={{ background: g.color }}>
                  {g.name[0]}
                </span>
                <div>
                  <p className="type-body-lg font-medium leading-tight text-[var(--color-text-primary)]">{g.name}</p>
                  <p className="type-caption text-[var(--color-text-tertiary)]">{g.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Food & drinks */}
        <Panel title="Food & Drinks" className={cn(CARD, 'w-[300px]')}>
          <div className="mb-4"><CountPill>{FOOD.total}</CountPill></div>
          <div className="flex flex-col gap-3.5">
            {FOOD.items.map(({ name, sub, rating, icon: Icon }) => (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="type-body-lg font-medium leading-tight text-[var(--color-text-primary)]">{name}</p>
                  <p className="flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
                    {rating} <Star className="h-3 w-3 fill-[var(--color-accent-orange)] text-[var(--color-accent-orange)]" /> · {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Top schools */}
        <Panel title="Top Schools" className={cn(CARD, 'w-[320px]')}>
          <div className="mb-4"><CountPill>{SCHOOLS.total}</CountPill></div>
          <div className="flex flex-col gap-3.5">
            {SCHOOLS.items.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate type-body-lg font-medium leading-tight text-[var(--color-text-primary)]">{s.name}</p>
                  <p className="type-caption text-[var(--color-text-tertiary)]">{s.sub}</p>
                </div>
                <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#e9f9f2] px-2 type-caption font-bold text-[var(--color-success)]">
                  {s.score}
                </span>
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
      <h2 className="mb-7 type-title-lg !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.55rem] lg:!text-[1.8rem]">Find your area in {CITY}</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MOCK_NEIGHBORHOODS.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect?.(n.name)}
            className="group relative aspect-[5/4] overflow-hidden rounded-[20px] text-left"
          >
            <Image src={n.thumbnail} alt={n.name} fill sizes="(min-width:1024px) 280px, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[0.8rem] font-semibold text-[var(--color-text-primary)]">
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
