'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import BackButton from '@/components/navigation/BackButton';
import { AreaSparkline, HBarChart, PieChart, ScoreRing } from '@/components/ui/charts';
import { CitySelector } from '@/features/home/CitySelector';
import {
  getCityData, CITY, CITY_OPTIONS, cityThumb,
  AMENITIES, GROCERIES, FOOD, SCHOOLS,
} from '@/features/home/MarketSections';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type InsightCard = { id: string; tag: string; title: string; tone: string; accent: string; visual: ReactNode };

/* ── small shared bits ───────────────────────────────────────────── */

function Mini({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3.5">
      <p className="type-title !text-[1.3rem] !leading-none text-[var(--color-text-primary)]">
        {value}{unit && <span className="type-caption ml-1 font-medium text-[var(--color-text-secondary)]">{unit}</span>}
      </p>
      <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

/* ── brand-blue palette (the insights page's own colour theme) ───── */
const B = {
  b700: 'var(--color-brand-700)',
  b600: 'var(--color-brand-600)',
  b500: 'var(--color-brand-500)',
  b400: 'var(--color-brand-400)',
  b300: 'var(--color-brand-300)',
  b200: 'var(--color-brand-200)',
  primary: 'var(--color-primary)',
};
const RING_SHADES = [B.b600, B.b500, B.b400];

/* ── build the deck from homepage market data ────────────────────── */

function makeCards(city: string): InsightCard[] {
  const d = getCityData(city);
  const trendUp = d.trendDelta >= 0;
  const [avgListing, active, avgHouse, avgCondo, avgTown] = d.stats.map((s) => s.value);
  const typeSlices = d.typeSlices.map((s, i) => ({ ...s, color: [B.b500, B.b300, B.b700][i] }));
  const priceByType = [
    { label: 'House', value: avgHouse },
    { label: 'Condo', value: avgCondo },
    { label: 'Townhouse', value: avgTown },
  ];

  return [
    {
      // Hero stat — avg price over a filled trend
      id: 'glance', tag: 'At a glance', title: `${city} market pulse`,
      tone: 'bg-[var(--color-brand-50)]', accent: B.b700,
      visual: (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-medium uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">Avg. listing price</p>
              <p className="type-title-lg !text-[2rem] !leading-none text-[var(--color-text-primary)]">{formatPrice(avgListing)}</p>
            </div>
            <span className={cn('mb-1 shrink-0 rounded-full px-2 py-0.5 text-[0.78rem] font-semibold', trendUp ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]' : 'bg-[#fdecec] text-[var(--color-accent)]')}>
              {trendUp ? '↑' : '↓'} {Math.abs(d.trendDelta).toFixed(1)}%
            </span>
          </div>
          <div className="-mx-1 mt-2"><AreaSparkline points={d.trend} color={B.b500} height={78} /></div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5">
            <span className="type-title !text-[1.3rem] !leading-none text-[var(--color-text-primary)]">{Math.round(active).toLocaleString()}</span>
            <span className="type-caption font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Active listings</span>
          </div>
        </div>
      ),
    },
    {
      // Average price by home type — comparison bars
      id: 'byType', tag: 'Pricing', title: 'Prices by home type',
      tone: 'bg-[#EEF2F7]', accent: B.b600,
      visual: (
        <div className="flex flex-col gap-4">
          {priceByType.map((t, i) => {
            const maxV = Math.max(...priceByType.map((x) => x.value)) || 1;
            return (
              <div key={t.label}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="type-heading-sm text-[var(--color-text-primary)]">{t.label}</span>
                  <span className="type-body font-semibold text-[var(--color-text-primary)]">{formatPrice(t.value)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full" style={{ width: `${(t.value / maxV) * 100}%`, background: [B.b500, B.b400, B.b300][i] }} />
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: 'ptype', tag: 'Inventory', title: 'Property type distribution',
      tone: 'bg-[var(--color-surface)]', accent: B.b700,
      visual: <PieChart slices={typeSlices} legendFontSize={14} />,
    },
    {
      id: 'volume', tag: 'Volume', title: 'Market volume',
      tone: 'bg-[var(--color-brand-50)]', accent: B.b600,
      visual: (
        <div>
          <div className="mb-4 flex items-start justify-between gap-2">
            <p className="type-title !text-[1.5rem] !leading-none text-[var(--color-text-primary)]">
              {d.volumeTotal.toLocaleString()} <span className="type-caption font-medium text-[var(--color-text-tertiary)]">Total</span>
            </p>
            <span className="shrink-0 rounded-full bg-[var(--color-brand-100)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wide text-[var(--color-brand-700)]">{d.mostActiveBand.label}</span>
          </div>
          <HBarChart rows={d.volumeRows} color={B.b500} />
        </div>
      ),
    },
    {
      id: 'trend', tag: 'Pricing', title: 'Median price trend',
      tone: 'bg-[#EEF2F7]', accent: B.b700,
      visual: (
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <p className="type-title !text-[1.5rem] !leading-none text-[var(--color-text-primary)]">{formatPrice(d.medianPrice)}</p>
            <span className={cn('rounded-full px-2 py-0.5 text-[0.78rem] font-semibold', trendUp ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]' : 'bg-[#fdecec] text-[var(--color-accent)]')}>
              {trendUp ? '↑' : '↓'} {Math.abs(d.trendDelta).toFixed(1)}%
            </span>
          </div>
          <AreaSparkline points={d.trend} color={B.b500} height={84} />
          <div className="mt-1 flex justify-between text-[0.78rem] text-[var(--color-text-tertiary)]"><span>Jul ’25</span><span>Jun ’26</span></div>
        </div>
      ),
    },
    {
      id: 'health', tag: 'Market health', title: 'Market health',
      tone: 'bg-[var(--color-brand-50)]', accent: B.b600,
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <Mini value={`${d.health.daysOnMarket}`} unit="days" label="Avg. days on market" />
          <Mini value={`${d.health.sellToList}%`} label="Sell-to-list ratio" />
          <Mini value={`$${d.health.pricePerSqft}`} unit="/sqft" label="Avg. price / sq.ft" />
          <Mini value={`$${d.health.medianRent.toLocaleString()}`} unit="/mo" label="Median rent" />
        </div>
      ),
    },
    {
      id: 'commute', tag: 'Getting around', title: 'Commute facts',
      tone: 'bg-[#EEF2F7]', accent: B.b700,
      visual: (
        <div className="flex flex-col gap-4">
          {d.commute.map(({ label, sub, value, icon: Icon }, i) => (
            <Row key={label}>
              <ScoreRing value={value} color={RING_SHADES[i]} size={50} />
              <div className="min-w-0 flex-1">
                <p className="type-heading-sm leading-tight text-[var(--color-text-primary)]">{label}</p>
                <p className="type-caption text-[var(--color-text-tertiary)]">{sub}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white" style={{ color: RING_SHADES[i] }}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
            </Row>
          ))}
        </div>
      ),
    },
    {
      id: 'amenities', tag: 'Lifestyle', title: 'Top amenities',
      tone: 'bg-[var(--color-surface)]', accent: B.b600,
      visual: (
        <div className="flex flex-col gap-3">
          {AMENITIES.map(({ label, count, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-full bg-white py-2 pl-2 pr-4">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <span className="type-heading-sm text-[var(--color-text-primary)]">{label}</span>
              </span>
              <span className="type-subtitle !text-[1.1rem] text-[var(--color-text-primary)]">{count}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'groceries', tag: 'Daily life', title: 'Groceries',
      tone: 'bg-[var(--color-brand-50)]', accent: B.b700,
      visual: (
        <div className="flex flex-col gap-4">
          {GROCERIES.items.map((g) => (
            <Row key={g.name}>
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-white">
                <Image src={g.logo} alt={g.name} fill sizes="36px" className="object-contain p-1.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{g.name}</p>
                <p className="type-caption text-[var(--color-text-tertiary)]">{g.sub}</p>
              </div>
            </Row>
          ))}
        </div>
      ),
    },
    {
      id: 'food', tag: 'Dining', title: 'Food & drinks',
      tone: 'bg-[#EEF2F7]', accent: B.b600,
      visual: (
        <div className="flex flex-col gap-4">
          {FOOD.items.map(({ name, sub, rating, icon: Icon }) => (
            <Row key={name}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{name}</p>
                <p className="mt-0.5 flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
                  <Star className="h-3 w-3 fill-[var(--color-brand-500)] text-[var(--color-brand-500)]" />
                  <span className="font-semibold text-[var(--color-text-secondary)]">{rating}</span> · {sub}
                </p>
              </div>
            </Row>
          ))}
        </div>
      ),
    },
    {
      id: 'schools', tag: 'Education', title: 'Top schools',
      tone: 'bg-[var(--color-surface)]', accent: B.b700,
      visual: (
        <div className="flex flex-col gap-4">
          {SCHOOLS.items.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate type-heading-sm leading-tight text-[var(--color-text-primary)]">{s.name}</p>
                <p className="type-caption text-[var(--color-text-tertiary)]">{s.sub}</p>
              </div>
              <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-50)] px-2 type-heading-sm font-semibold text-[var(--color-brand-700)]">{s.score}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

/* ══════════════════════════════════════════════════════════════════
   CARDS
══════════════════════════════════════════════════════════════════ */

function MobileCard({ card, offset, isActive, onDragEnd }: {
  card: InsightCard; offset: number; isActive: boolean;
  onDragEnd: (info: { offset: { x: number }; velocity: { x: number } }) => void;
}) {
  return (
    <motion.article
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => onDragEnd(info)}
      animate={{
        x: offset * 18, y: Math.abs(offset) * 12,
        scale: isActive ? 1 : 0.96,
        opacity: Math.abs(offset) > 1 ? 0 : 1,
        zIndex: 10 - Math.abs(offset),
      }}
      transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn('absolute inset-0 flex flex-col rounded-[28px] border border-[var(--color-border)]/55 p-5 shadow-[0_12px_32px_rgba(15,23,41,0.10)] overflow-hidden', card.tone)}
    >
      <div className="mb-2">
        <span className="type-caption font-semibold uppercase tracking-wide" style={{ color: card.accent }}>{card.tag}</span>
      </div>
      <h2 className="type-heading text-[var(--color-text-primary)] mb-4">{card.title}</h2>
      <div className="flex-1 min-h-0 flex flex-col justify-center">{card.visual}</div>
    </motion.article>
  );
}

function DesktopCard({ card }: { card: InsightCard }) {
  return (
    <div className={cn('rounded-[24px] border border-[var(--color-border)]/55 p-6 flex flex-col gap-4 break-inside-avoid', card.tone)}>
      <span className="type-caption font-semibold uppercase tracking-wide" style={{ color: card.accent }}>{card.tag}</span>
      <h2 className="type-title text-[var(--color-text-primary)]">{card.title}</h2>
      <div>{card.visual}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */

export default function InsightsPage() {
  const [city, setCity] = useState(CITY);
  const [index, setIndex] = useState(0);
  const CARDS = makeCards(city);

  const go = (direction: 1 | -1) => setIndex((v) => (v + direction + CARDS.length) % CARDS.length);
  const pickCity = (c: string) => { setCity(c); setIndex(0); };

  // Show at most 5 dots, windowed around the active card.
  const DOT_WINDOW = 5;
  const total = CARDS.length;
  const dotStart = Math.max(0, Math.min(index - 2, total - DOT_WINDOW));
  const dotEnd = Math.min(total, dotStart + DOT_WINDOW);

  return (
    <PageShell showDesktopHeader={false} desktopWide>
      <div className="h-full flex flex-col overflow-hidden bg-[var(--color-background)]">

        {/* ── Mobile header — title left, selector right ── */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-1 lg:hidden">
          <h1 className="type-title text-[var(--color-text-primary)]">Insights</h1>
          <CitySelector city={city} options={CITY_OPTIONS} thumb={cityThumb} onChange={pickCity} />
        </div>

        {/* ── Mobile swipe stack ── */}
        <div className="flex flex-1 flex-col overflow-hidden px-4 pb-24 lg:hidden">
          <div className="flex-1 flex items-center min-h-0">
            <div className="relative h-[72%] min-h-[440px] w-full">
              {CARDS.map((card, i) => (
                <MobileCard
                  key={card.id}
                  card={card}
                  offset={i - index}
                  isActive={i === index}
                  onDragEnd={(info) => {
                    if (info.offset.x < -54 || info.velocity.x < -420) go(1);
                    if (info.offset.x > 54 || info.velocity.x > 420) go(-1);
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-center gap-1.5 pb-1 pt-0.5">
            {CARDS.slice(dotStart, dotEnd).map((_, k) => {
              const i = dotStart + k;
              const isEdge = (i === dotStart && dotStart > 0) || (i === dotEnd - 1 && dotEnd < total);
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to card ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="transition-all duration-200"
                  style={{
                    width: i === index ? 14 : isEdge ? 3 : 4,
                    height: i === index ? 4 : isEdge ? 3 : 4,
                    borderRadius: 9999,
                    opacity: isEdge ? 0.5 : 1,
                    background: i === index ? 'var(--color-brand-600)' : 'var(--color-border-strong)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── Desktop masonry ── */}
        <div className="hidden lg:block h-full overflow-y-auto px-6 py-6">
          <div className="relative mb-8 flex items-center justify-center">
            <BackButton iconOnly className="absolute left-0 shrink-0" />
            <h1 className="type-title-lg text-[var(--color-text-primary)]">Insights</h1>
            <div className="absolute right-0"><CitySelector city={city} options={CITY_OPTIONS} thumb={cityThumb} onChange={pickCity} /></div>
          </div>
          <div style={{ columnCount: 3, columnGap: '1.25rem' }} className="3xl:columns-4">
            {CARDS.map((card) => (
              <div key={card.id} className="mb-5">
                <DesktopCard card={card} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
