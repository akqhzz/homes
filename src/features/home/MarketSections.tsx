'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Deterministic 0..1 from a city name + salt — lets each city get its own
// (stable) set of numbers without any randomness at render time.
function rand(str: string, salt: number) {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return ((h >>> 0) % 100000) / 100000;
}

export const CITY = MOCK_NEIGHBORHOODS[0]?.city ?? 'Toronto';

// Cities offered in the insights-page selector, plus a representative thumbnail.
export const CITY_OPTIONS = ['Toronto', 'Vancouver', 'Calgary', 'Montréal', 'Ottawa', 'Edmonton', 'Halifax', 'Winnipeg'];
const CITY_THUMBS = [
  'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=96&q=80',
  'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=96&q=80',
  'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=96&q=80',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=96&q=80',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=96&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=96&q=80',
];
export function cityThumb(city: string) {
  if (city === CITY) return CITY_THUMBS[0];
  return CITY_THUMBS[Math.floor(rand(city, 99) * CITY_THUMBS.length) % CITY_THUMBS.length];
}

const TYPE_META = [
  { key: 'house', label: 'House', color: 'var(--color-success)' },
  { key: 'condo', label: 'Condo Apt', color: 'var(--color-brand-400)' },
  { key: 'townhouse', label: 'Townhouse', color: 'var(--color-primary)' },
];
const BAND_META = [
  { label: '$500k - $1M', min: 500_000, max: 1_000_000 },
  { label: '$1M - $1.5M', min: 1_000_000, max: 1_500_000 },
  { label: '$1.5M - $2.5M', min: 1_500_000, max: 2_500_000 },
  { label: '$2.5M - $5M', min: 2_500_000, max: 5_000_000 },
];
const STAT_META = [
  { key: 'avgListing', label: 'Avg. Listing Price', format: fmtFull, icon: DollarSign, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { key: 'active', label: 'Active Listings', format: fmtCount, icon: LayoutGrid, tint: 'text-[var(--color-brand-700)] bg-[var(--color-brand-50)]' },
  { key: 'avgHouse', label: 'Avg. House Price', format: fmtFull, icon: Home, tint: 'text-[var(--color-success)] bg-[#e9f9f2]' },
  { key: 'avgCondo', label: 'Avg. Condo Price', format: fmtFull, icon: Building2, tint: 'text-[#7c5cff] bg-[#f0edff]' },
  { key: 'avgTown', label: 'Avg. Townhouse Price', format: fmtFull, icon: Warehouse, tint: 'text-[#d9930b] bg-[#fdf3df]' },
] as const;

const walkLabel = (v: number) => (v >= 90 ? 'Walker’s Paradise' : v >= 70 ? 'Very Walkable' : v >= 50 ? 'Somewhat Walkable' : 'Car-Dependent');
const transitLabel = (v: number) => (v >= 90 ? 'Rider’s Paradise' : v >= 70 ? 'Excellent Transit' : v >= 50 ? 'Good Transit' : 'Some Transit');
const bikeLabel = (v: number) => (v >= 90 ? 'Biker’s Paradise' : v >= 70 ? 'Very Bikeable' : v >= 50 ? 'Bikeable' : 'Somewhat Bikeable');
export const schoolScoreTint = (s: number) =>
  (s >= 9.5 ? 'bg-[#e9f9f2] text-[var(--color-success)]' : s >= 9 ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]' : 'bg-[#fdf3df] text-[#d9930b]');

// Toronto baseline, computed from the real mock data.
const BASE = {
  avgListing: mean(MOCK_LISTINGS.map((l) => l.price)),
  avgHouse: mean(pricesOfType('house')),
  avgCondo: mean(pricesOfType('condo')),
  avgTown: mean(pricesOfType('townhouse')),
  active: 5439,
  typeCounts: TYPE_META.map((t) => MOCK_LISTINGS.filter((l) => l.propertyType === t.key).length || 1),
  bandCounts: BAND_META.map((b) => MOCK_LISTINGS.filter((l) => l.price >= b.min && l.price < b.max).length || 1),
  trend: (() => {
    const sorted = [...MOCK_LISTINGS].sort((a, b) => a.listingDate.localeCompare(b.listingDate));
    const n = 12, size = Math.max(1, Math.floor(sorted.length / n));
    const pts: number[] = [];
    for (let i = 0; i < n; i += 1) {
      const chunk = sorted.slice(i * size, (i + 1) * size).map((l) => l.price);
      if (chunk.length) pts.push(median(chunk));
    }
    return pts.length >= 2 ? pts : MOCK_LISTINGS.map((l) => l.price).slice(0, 12);
  })(),
  median: median(MOCK_LISTINGS.map((l) => l.price)),
  daysOnMarket: Math.round(mean(MOCK_LISTINGS.map((l) => l.daysOnMarket))),
  pricePerSqft: Math.round(mean(MOCK_LISTINGS.filter((l) => l.sqft).map((l) => l.price / l.sqft))),
  walk: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.walkScore))),
  transit: Math.round(mean(MOCK_NEIGHBORHOODS.map((n) => n.transitScore))),
};

// Toronto returns the real figures; every other city gets a stable variation.
export function getCityData(city: string) {
  const isBase = city === CITY;
  const pf = isBase ? 1 : 0.62 + rand(city, 1) * 0.72; // price factor
  const cf = isBase ? 1 : 0.5 + rand(city, 2) * 0.95; // count factor
  const values: Record<string, number> = {
    avgListing: BASE.avgListing * pf,
    active: Math.round(BASE.active * cf),
    avgHouse: BASE.avgHouse * pf,
    avgCondo: BASE.avgCondo * pf,
    avgTown: BASE.avgTown * pf,
  };
  const stats = STAT_META.map((s) => ({ label: s.label, value: values[s.key], format: s.format, icon: s.icon, tint: s.tint }));

  const newListings = Math.round(BASE.active * cf);
  const newListingsLabel = `${(Math.round(newListings / 100) * 100).toLocaleString()}+`;

  const typeCounts = BASE.typeCounts.map((c, i) => Math.max(1, Math.round(c * (isBase ? 1 : 0.6 + rand(city, 20 + i) * 0.9))));
  const typeSlices = TYPE_META.map((t, i) => ({ label: t.label, color: t.color, value: typeCounts[i] }));

  const bandCounts = BASE.bandCounts.map((c, i) => Math.max(1, Math.round(c * (isBase ? 1 : 0.5 + rand(city, 30 + i) * 1.1))));
  const volumeTotal = bandCounts.reduce((s, n) => s + n, 0) || 1;
  const volumeRows = BAND_META.map((b, i) => { const pct = Math.round((bandCounts[i] / volumeTotal) * 100); return { label: b.label, value: pct, sub: `${pct}%` }; });
  const mostActiveBand = BAND_META[bandCounts.indexOf(Math.max(...bandCounts))];

  const trend = BASE.trend.map((p, i) => p * pf * (isBase ? 1 : 0.9 + rand(city, 40 + i) * 0.2));
  const medianPrice = BASE.median * pf;
  const trendDelta = trend.length >= 2 ? ((trend[trend.length - 1] - trend[0]) / (trend[0] || 1)) * 100 : 0;

  const health = {
    daysOnMarket: clamp(Math.round(BASE.daysOnMarket * (isBase ? 1 : 0.6 + rand(city, 4))), 4, 60),
    sellToList: isBase ? 97.5 : Math.round((94 + rand(city, 5) * 6) * 10) / 10,
    pricePerSqft: Math.round(BASE.pricePerSqft * pf),
    medianRent: Math.round((2500 * pf) / 50) * 50,
  };

  const walk = clamp(Math.round(BASE.walk * (isBase ? 1 : 0.7 + rand(city, 6) * 0.5)), 30, 99);
  const transit = clamp(Math.round(BASE.transit * (isBase ? 1 : 0.6 + rand(city, 7) * 0.6)), 25, 99);
  const bike = clamp(Math.round(BASE.walk * 0.72 * (isBase ? 1 : 0.7 + rand(city, 8) * 0.6)), 25, 99);
  const commute = [
    { label: 'Walk Score', sub: walkLabel(walk), value: walk, color: 'var(--color-success)', icon: Footprints },
    { label: 'Transit Score', sub: transitLabel(transit), value: transit, color: 'var(--color-brand-600)', icon: TrainFront },
    { label: 'Bike Score', sub: bikeLabel(bike), value: bike, color: 'var(--color-accent-orange)', icon: Bike },
  ];

  const imageOffset = Math.floor(rand(city, 9) * 5);
  return { city, stats, active: values.active, newListingsLabel, typeSlices, volumeRows, volumeTotal, mostActiveBand, trend, medianPrice, trendDelta, health, commute, imageOffset };
}

// "Deep dive" city facts (representative figures for the city overview).
export const WORLD_TAGS = ['Urban', 'Global', 'Vibrant'];
export const AMENITIES = [
  { label: 'Parks', count: '1500+', icon: Trees, color: 'var(--color-success)', tint: '#e9f9f2' },
  { label: 'Fitness Centres', count: '400+', icon: Dumbbell, color: 'var(--color-accent-orange)', tint: '#fdeee0' },
  { label: 'Libraries', count: '100+', icon: BookOpen, color: '#7c5cff', tint: '#f0edff' },
];
const groceryLogo = (domain: string) => `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
export const GROCERIES = { total: '600+', items: [
  { name: 'Loblaws', sub: '60+ in total', logo: groceryLogo('loblaws.ca') },
  { name: 'No Frills', sub: '30+ in total', logo: groceryLogo('nofrills.ca') },
  { name: 'Farm Boy', sub: '20+ in total', logo: groceryLogo('farmboy.ca') },
] };
export const FOOD = { total: '8000+', items: [
  { name: 'Alo', sub: 'Restaurant', rating: 4.8, icon: Utensils },
  { name: 'Civil Liberties', sub: 'Bar', rating: 4.7, icon: Wine },
  { name: 'Dineen Coffee Co.', sub: 'Café', rating: 4.6, icon: Coffee },
] };
export const SCHOOLS = { total: '800+', items: [
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
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const from = value * 0.86; // start partway, not from zero
    const animate = () => {
      const begin = performance.now();
      const dur = 850;
      const step = (now: number) => {
        const t = Math.min(1, (now - begin) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(from + (value - from) * eased);
        if (t < 1) raf = requestAnimationFrame(step);
        else setShown(value);
      };
      setShown(from);
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
    <div className={cn('flex flex-col rounded-[24px] border border-[var(--color-border)]/55 bg-white px-6 pt-6 pb-7', className)}>
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

export function MarketStatsStrip({ city = CITY }: { city?: string }) {
  const { stats } = useMemo(() => getCityData(city), [city]);
  return (
    <section className="w-full px-5 pt-4 lg:px-12 lg:pt-5">
      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible">
        {stats.map(({ label, value, format, icon: Icon, tint }) => (
          <div key={label} className="flex min-w-[230px] items-center gap-3.5 rounded-[20px] border border-[var(--color-border)]/55 bg-white px-5 py-4 lg:min-w-0">
            <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]', tint)}>
              <Icon className="h-6 w-6" strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <CountUp value={value} format={format} className="block truncate type-title !text-[1.5rem] !leading-none text-[var(--color-text-primary)]" />
              <p className="mt-1.5 text-[0.8rem] font-medium uppercase tracking-[0.045em] text-[var(--color-text-tertiary)]">{label}</p>
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

export function MarketBoard({ city = CITY }: { city?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(680, ref.current.clientWidth * 0.85), behavior: 'smooth' });
  const { typeSlices, volumeRows, volumeTotal, mostActiveBand, trend, medianPrice, trendDelta, health } = useMemo(() => getCityData(city), [city]);
  // flex-1 + a min width: the four cards stretch to fill the row on wide
  // screens, and fall back to a horizontal scroll when they no longer fit.
  const CARD = 'snap-start min-h-[320px] min-w-[262px] flex-1';
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title="Market Insights in"
        city={city}
        onArrow={() => router.push('/for-you')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      {/* Cards fill the full width when they fit, scroll one line when they don't */}
      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Panel title="Property Type Distribution" className={CARD}>
          <div className="flex flex-1 items-center">
            <PieChart slices={typeSlices} legendFontSize={18} />
          </div>
        </Panel>

        <Panel title="Market Volume" className={CARD}>
          <div className="mb-5 flex items-start justify-between gap-2">
            <p className="type-title !text-[1.75rem] !leading-none text-[var(--color-text-primary)]">
              {volumeTotal.toLocaleString()} <span className="type-body font-medium text-[var(--color-text-tertiary)]">Total Listings</span>
            </p>
            <span className="shrink-0 rounded-full bg-[var(--color-brand-100)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--color-brand-700)]">
              {mostActiveBand.label}
            </span>
          </div>
          <HBarChart rows={volumeRows} color="var(--color-brand-500)" />
        </Panel>

        <Panel title="Median Price Trend" className={CARD}>
          <div className="mb-3 flex items-center gap-2.5">
            <p className="type-title !text-[1.75rem] !leading-none text-[var(--color-text-primary)]">{formatPrice(medianPrice)}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f9f2] px-2.5 py-1 text-[0.8rem] font-semibold text-[var(--color-success)]">
              <TrendingUp className="h-3.5 w-3.5" />{Math.abs(trendDelta).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end">
            <AreaSparkline points={trend} color="var(--color-success)" height={104} />
            <div className="mt-1.5 flex justify-between text-[0.8rem] text-[var(--color-text-tertiary)]">
              <span>Jul ’25</span><span>Jun ’26</span>
            </div>
          </div>
        </Panel>

        <Panel title="Market Health" className={CARD}>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <MiniStat value={`${health.daysOnMarket}`} unit="days" label="Avg. days on market" />
            <MiniStat value={`${health.sellToList}%`} label="Sell-to-list ratio" />
            <MiniStat value={`$${health.pricePerSqft}`} unit="/sqft" label="Avg. price per sq.ft" />
            <MiniStat value={`$${health.medianRent.toLocaleString()}`} unit="/mo" label="Median rent" />
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
  return <span className="inline-block rounded-full bg-[var(--color-brand-500)] px-3 py-1 type-caption font-semibold text-white">{children}</span>;
}

export function DeepDive({ city = CITY }: { city?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(680, ref.current.clientWidth * 0.85), behavior: 'smooth' });
  const { commute } = useMemo(() => getCityData(city), [city]);
  const CARD = 'shrink-0 snap-start min-h-[312px]';
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title="Deep Dive into"
        city={city}
        onArrow={() => router.push('/for-you')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* The world in one city */}
        <div className={cn(CARD, 'flex w-[300px] flex-col rounded-[24px] border border-[var(--color-border)]/55 bg-gradient-to-b from-[var(--color-brand-50)] to-white px-6 pt-6 pb-7')}>
          <h3 className="type-subtitle !text-[1.3rem] leading-tight text-[var(--color-text-primary)]">The World in One City</h3>
          <p className="mt-3 type-body text-[var(--color-text-secondary)]">
            A global powerhouse of culture, food, and finance — defined by safe, connected, endlessly
            walkable and proudly diverse neighbourhoods.
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {WORLD_TAGS.map((t, i) => (
              <span key={t} className={cn('rounded-full px-3 py-1.5 type-caption font-semibold uppercase tracking-wide',
                ['bg-[var(--color-brand-100)] text-[var(--color-brand-700)]', 'bg-[#e1f6ec] text-[var(--color-success)]', 'bg-[#ece7ff] text-[#7c5cff]'][i % 3])}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Commute facts */}
        <Panel title="Commute Facts" className={cn(CARD, 'w-[330px]')}>
          <div className="flex flex-1 flex-col justify-center gap-7">
            {commute.map(({ label, sub, value, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3.5">
                <ScoreRing value={value} color={color} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="type-heading-sm leading-tight text-[var(--color-text-primary)]">{label}</p>
                  <p className="type-caption text-[var(--color-text-tertiary)]">{sub}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)]" style={{ color }}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Top amenities */}
        <Panel title="Top Amenities" className={cn(CARD, 'w-[320px]')}>
          <div className="flex flex-1 flex-col justify-center gap-4">
            {AMENITIES.map(({ label, count, icon: Icon, color, tint }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-full bg-[var(--color-surface)] py-2.5 pl-2.5 pr-5">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: tint, color }}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span className="type-heading-sm text-[var(--color-text-primary)]">{label}</span>
                </span>
                <span className="type-title !text-[1.2rem] text-[var(--color-text-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Groceries */}
        <Panel title="Groceries" className={cn(CARD, 'w-[300px]')}>
          <div className="mb-1"><CountPill>{GROCERIES.total}</CountPill></div>
          <div className="flex flex-1 flex-col justify-center gap-5">
            {GROCERIES.items.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-white">
                  <Image src={g.logo} alt={g.name} fill sizes="40px" className="object-contain p-1.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{g.name}</p>
                  <p className="mt-0.5 type-caption text-[var(--color-text-tertiary)]">{g.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Food & drinks */}
        <Panel title="Food & Drinks" className={cn(CARD, 'w-[300px]')}>
          <div className="mb-1"><CountPill>{FOOD.total}</CountPill></div>
          <div className="flex flex-1 flex-col justify-center gap-5">
            {FOOD.items.map(({ name, sub, rating, icon: Icon }) => (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{name}</p>
                  <p className="mt-0.5 flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
                    <Star className="h-3 w-3 fill-[var(--color-accent-orange)] text-[var(--color-accent-orange)]" />
                    <span className="font-semibold text-[var(--color-text-secondary)]">{rating}</span> · {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Top schools */}
        <Panel title="Top Schools" className={cn(CARD, 'w-[320px]')}>
          <div className="mb-1"><CountPill>{SCHOOLS.total}</CountPill></div>
          <div className="flex flex-1 flex-col justify-center gap-5">
            {SCHOOLS.items.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{s.name}</p>
                  <p className="mt-0.5 type-caption text-[var(--color-text-tertiary)]">{s.sub}</p>
                </div>
                <span className={cn('flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 type-heading-sm font-semibold', schoolScoreTint(s.score))}>
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

export function AreaFinder({ city = CITY, onSelect }: { city?: string; onSelect?: (name: string) => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(680, ref.current.clientWidth * 0.85), behavior: 'smooth' });
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      <SectionHeader
        title="Find your area in"
        city={city}
        onArrow={() => router.push('/')}
        onPrev={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      <div
        ref={ref}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MOCK_NEIGHBORHOODS.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect?.(n.name)}
            className="group relative aspect-[5/4] w-[280px] shrink-0 snap-start overflow-hidden rounded-[20px] text-left"
          >
            <Image src={n.thumbnail} alt={n.name} fill sizes="280px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-text-primary)]">
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
