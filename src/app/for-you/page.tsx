'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import PageShell from '@/components/templates/PageShell';
import { cn } from '@/lib/utils/cn';

/* ══════════════════════════════════════════════════════════════════
   SVG CHART PRIMITIVES
══════════════════════════════════════════════════════════════════ */

// Dot rendered as CSS so it stays circular regardless of SVG stretch
function AreaSparkline({ points, color, height = 80 }: { points: number[]; color: string; height?: number }) {
  const W = 260, H = height, PX = 10;
  const max = Math.max(...points), min = Math.min(...points);
  const xs = points.map((_, i) => PX + (i / (points.length - 1)) * (W - PX * 2));
  const ys = points.map(v => H - 10 - ((v - min) / (max - min || 1)) * (H - 22));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${line} L${W - PX},${H} L${PX},${H} Z`;
  const lastY = ys[ys.length - 1];
  const dotRightPct = `${(PX / W) * 100}%`;
  const id = `ag${color.replace(/[^a-z0-9]/gi, '')}${height}`;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Halo */}
      <div style={{
        position: 'absolute', right: dotRightPct, top: lastY,
        transform: 'translate(50%, -50%)', width: 14, height: 14,
        borderRadius: '50%', background: color, opacity: 0.2, pointerEvents: 'none',
      }} />
      {/* Dot */}
      <div style={{
        position: 'absolute', right: dotRightPct, top: lastY,
        transform: 'translate(50%, -50%)', width: 8, height: 8,
        borderRadius: '50%', background: color, pointerEvents: 'none',
      }} />
    </div>
  );
}

function HBarChart({ rows, color }: { rows: { label: string; value: number; sub?: string }[]; color: string }) {
  const max = Math.max(...rows.map(r => r.value));
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="type-caption text-[var(--color-text-secondary)] w-[6.5rem] shrink-0 truncate">{r.label}</span>
          <div className="flex-1 relative h-5">
            <div className="absolute inset-y-0 left-0 w-full rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / max) * 100}%` }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 type-caption font-semibold text-[var(--color-text-primary)]">
              {r.sub ?? r.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// SVG pie chart with inline legend
function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const cx = 100, cy = 100, r = 86;
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const paths = slices.map((sl, index) => {
    const startA = -Math.PI / 2 + slices.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 2 * Math.PI, 0);
    const sweep = (sl.value / total) * 2 * Math.PI;
    const endA = startA + sweep;
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
    const mid = startA + sweep / 2;
    const lr = r * 0.63;
    const pct = Math.round((sl.value / total) * 100);
    return {
      d: `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`,
      lx: (cx + lr * Math.cos(mid)).toFixed(1),
      ly: (cy + lr * Math.sin(mid)).toFixed(1),
      sweep, pct, ...sl,
    };
  });
  const legendY0 = 100 - ((slices.length - 1) * 28) / 2;
  return (
    <svg viewBox="0 0 420 200" style={{ width: '100%', height: 'auto' }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />
      ))}
      {paths.map((p, i) => {
        const y = legendY0 + i * 28;
        return (
          <g key={`l${i}`}>
            <rect x="215" y={y - 5} width="10" height="10" rx="2" fill={p.color} />
            <text x="233" y={y + 1} fontSize="11.5" fill="rgba(0,0,0,0.55)" fontFamily="system-ui" dominantBaseline="central">{p.label}</text>
            <text x="415" y={y + 1} textAnchor="end" fontSize="12" fontWeight="600" fill="rgba(0,0,0,0.8)" fontFamily="system-ui" dominantBaseline="central">{p.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// 7-day stacked saves bar chart
function WeekSaves({ color }: { color: string }) {
  const days = [
    { d: 'M', under: 65, over: 30 },
    { d: 'T', under: 72, over: 28 },
    { d: 'W', under: 78, over: 27 },
    { d: 'T', under: 85, over: 25 },
    { d: 'F', under: 98, over: 22 },
    { d: 'S', under: 110, over: 20 },
    { d: 'S', under: 120, over: 18 },
  ];
  const maxTotal = Math.max(...days.map(d => d.under + d.over));
  const H = 60;
  return (
    <div className="w-full">
      <p className="type-caption text-[var(--color-text-tertiary)] mb-2.5">Daily saves — under vs over $1.2M</p>
      <div className="flex items-end gap-1.5 w-full">
        {days.map((d, i) => {
          const total = d.under + d.over;
          const barH = Math.round((total / maxTotal) * H);
          const overH = Math.round((d.over / total) * barH);
          const underH = barH - overH;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex flex-col rounded-sm overflow-hidden" style={{ height: barH }}>
                <div style={{ height: overH, background: 'rgba(0,0,0,0.10)' }} />
                <div style={{ height: underH, background: color }} />
              </div>
              <span className="type-nano text-[var(--color-text-tertiary)]">{d.d}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
          <span className="type-caption text-[var(--color-text-secondary)]">Under $1.2M</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm shrink-0 bg-black/10" />
          <span className="type-caption text-[var(--color-text-secondary)]">Over $1.2M</span>
        </div>
      </div>
    </div>
  );
}

function DonutGauge({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const r = 44, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const total = segments.reduce((s, sg) => s + sg.value, 0);
  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; dash: number; offset: number }>>(
    (all, sg) => {
      const offset = all.length === 0 ? 0 : all[all.length - 1].offset + all[all.length - 1].dash + 3;
      const dash = (sg.value / total) * circ;
      all.push({ ...sg, dash: dash - 3, offset });
      return all;
    },
    []
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="14"
          strokeDasharray={`${a.dash} ${circ}`} strokeDashoffset={-a.offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
    </svg>
  );
}

function RadarHex({ scores, color }: { scores: { label: string; value: number }[]; color: string }) {
  const cx = 80, cy = 80, maxR = 58, n = scores.length;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
  const shapePts = scores.map((s, i) => pt(i, (s.value / 10) * maxR));
  const shapePath = shapePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {[0.33, 0.66, 1].map((lvl, li) => (
        <polygon key={li}
          points={scores.map((_, i) => { const p = pt(i, maxR * lvl); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      ))}
      {scores.map((_, i) => { const e = pt(i, maxR); return <line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />; })}
      <path d={shapePath} fill={color} fillOpacity="0.18" stroke={color} strokeWidth="2" />
      {shapePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
      {scores.map((s, i) => {
        const lp = pt(i, maxR + 14);
        return <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontFamily="system-ui" fill="rgba(0,0,0,0.42)" fontWeight="500">{s.label}</text>;
      })}
    </svg>
  );
}

function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, sg) => s + sg.value, 0);
  return (
    <div className="w-full">
      <div className="flex h-7 w-full overflow-hidden rounded-full gap-0.5">
        {segments.map((sg, i) => (
          <motion.div key={i} className="h-full" style={{ background: sg.color, width: `${(sg.value / total) * 100}%` }}
            initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
        {segments.map((sg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sg.color }} />
            <span className="type-caption text-[var(--color-text-secondary)]">{sg.label}</span>
            <span className="type-caption font-semibold text-[var(--color-text-primary)]">{sg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   BRAND PALETTE
══════════════════════════════════════════════════════════════════ */

const B = {
  b700: 'var(--color-brand-700)',
  b600: 'var(--color-brand-600)',
  b500: 'var(--color-brand-500)',
  b400: 'var(--color-brand-400)',
  b300: 'var(--color-brand-300)',
  b200: 'var(--color-brand-200)',
  primary: 'var(--color-primary)',
};

/* ══════════════════════════════════════════════════════════════════
   CARDS
══════════════════════════════════════════════════════════════════ */

type InsightCard = { id: string; tag: string; title: string; tone: string; accent: string; visual: React.ReactNode };

function makeCards(): InsightCard[] {
  return [
    /* 1 — Market temperature */
    {
      id: 'market-temp',
      tag: 'Market Trends',
      title: "It's still a seller's market — but cooling.",
      tone: 'bg-[var(--color-brand-50)]',
      accent: B.b700,
      visual: (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <DonutGauge size={160} segments={[
                { label: 'Sellers', value: 58, color: B.b700 },
                { label: 'Balanced', value: 22, color: B.b300 },
                { label: 'Buyers', value: 20, color: B.b200 },
              ]} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="type-heading text-[var(--color-text-primary)]">58%</span>
                <span className="type-nano text-[var(--color-text-tertiary)] uppercase tracking-wide">seller</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[{ label: 'Seller', color: B.b700, pct: '58%' }, { label: 'Balanced', color: B.b300, pct: '22%' }, { label: 'Buyer', color: B.b200, pct: '20%' }].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10" style={{ background: s.color }} />
                  <span className="type-caption text-[var(--color-text-secondary)]">{s.label}</span>
                  <span className="type-caption font-semibold text-[var(--color-text-primary)]">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="type-caption text-[var(--color-text-tertiary)] mb-1.5">Seller-market share — 8 weeks</p>
            <AreaSparkline points={[72, 69, 71, 67, 65, 63, 60, 58]} color={B.b600} height={60} />
          </div>
        </div>
      ),
    },

    /* 2 — Listing type pie */
    {
      id: 'listing-types',
      tag: 'Market Trends',
      title: 'Most available listings are condos.',
      tone: 'bg-[var(--color-surface)]',
      accent: B.b600,
      visual: (
        <PieChart slices={[
          { label: 'Condos',        value: 40, color: B.b700 },
          { label: 'Detached',      value: 28, color: B.b500 },
          { label: 'Semi-detached', value: 20, color: B.b400 },
          { label: 'Townhouses',    value: 12, color: B.b300 },
        ]} />
      ),
    },

    /* 3 — Days on market */
    {
      id: 'dom-trend',
      tag: 'Market Trends',
      title: 'Days on market rising across all types.',
      tone: 'bg-[#EEF2F7]',
      accent: B.primary,
      visual: (
        <div className="w-full flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[{ type: 'Condos', dom: 31, delta: '+18%' }, { type: 'Semis', dom: 19, delta: '+6%' }, { type: 'Detached', dom: 24, delta: '+11%' }].map(d => (
              <div key={d.type} className="rounded-[var(--radius-sm)] bg-white/70 p-2.5 text-center">
                <p className="type-caption text-[var(--color-text-tertiary)]">{d.type}</p>
                <p className="type-subtitle text-[var(--color-text-primary)] mt-0.5">{d.dom}<span className="type-caption font-normal">d</span></p>
                <p className="type-caption font-semibold mt-0.5" style={{ color: B.b600 }}>{d.delta}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="type-caption text-[var(--color-text-tertiary)] mb-1.5">All types combined — 10 weeks</p>
            <AreaSparkline points={[18, 19, 20, 20, 22, 23, 24, 25, 27, 28]} color={B.primary} height={64} />
          </div>
        </div>
      ),
    },

    /* 4 — Neighbourhood scorecard */
    {
      id: 'neigh-score',
      tag: 'Neighbourhood',
      title: 'West End scores high on livability.',
      tone: 'bg-[var(--color-brand-100)]',
      accent: B.b700,
      visual: (
        <div className="flex flex-col items-center gap-3 w-full">
          <RadarHex color={B.b600} scores={[
            { label: 'Transit', value: 9 },
            { label: 'Schools', value: 7 },
            { label: 'Parks', value: 8 },
            { label: 'Dining', value: 6 },
            { label: 'Safety', value: 8 },
            { label: 'Value', value: 7 },
          ]} />
          <div className="grid grid-cols-3 gap-2 w-full">
            {[{ label: 'Transit', value: '9/10' }, { label: 'Schools', value: '7/10' }, { label: 'Walk score', value: '88' }].map(m => (
              <div key={m.label} className="rounded-[var(--radius-sm)] bg-white/60 p-2 text-center">
                <p className="type-caption text-[var(--color-text-tertiary)]">{m.label}</p>
                <p className="type-label font-semibold text-[var(--color-text-primary)] mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* 5 — Buyer cost breakdown */
    {
      id: 'cost-breakdown',
      tag: 'Buying Guide',
      title: 'Where does your purchase price go?',
      tone: 'bg-[#F5F3EF]',
      accent: B.b700,
      visual: (
        <div className="w-full flex flex-col gap-4">
          <StackedBar segments={[
            { label: 'Mortgage', value: 68, color: B.b700 },
            { label: 'Land transfer', value: 8, color: B.b500 },
            { label: 'Legal', value: 4, color: B.b400 },
            { label: 'Inspection', value: 2, color: B.b300 },
            { label: 'Other', value: 18, color: B.b200 },
          ]} />
          <div className="grid grid-cols-2 gap-2">
            {[{ label: 'Avg closing costs', value: '$28k' }, { label: 'Min down (5%)', value: '$46k' }, { label: 'Stress test rate', value: '7.25%' }, { label: 'CMHC threshold', value: '$1.5M' }].map(m => (
              <div key={m.label} className="rounded-[var(--radius-sm)] bg-white/60 p-2.5">
                <p className="type-caption text-[var(--color-text-tertiary)]">{m.label}</p>
                <p className="type-label font-semibold text-[var(--color-text-primary)] mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* 6 — Save activity */
    {
      id: 'save-pulse',
      tag: 'Market Trends',
      title: 'Most-saved listings cluster under $1.2M.',
      tone: 'bg-[var(--color-brand-50)]',
      accent: B.b600,
      visual: (
        <div className="w-full flex flex-col gap-4">
          <div>
            <p className="type-caption text-[var(--color-text-tertiary)] mb-2">Saves by price band — this week</p>
            <HBarChart color={B.b500} rows={[
              { label: 'Under $800k', value: 340, sub: '340' },
              { label: '$800k–$1.2M', value: 510, sub: '510' },
              { label: '$1.2M–$2M', value: 280, sub: '280' },
              { label: 'Over $2M', value: 90, sub: '90' },
            ]} />
          </div>
          <WeekSaves color={B.b500} />
        </div>
      ),
    },
  ];
}

/* ══════════════════════════════════════════════════════════════════
   MOBILE CARD
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
      className={cn('absolute inset-0 flex flex-col rounded-[28px] p-5 shadow-[0_12px_32px_rgba(15,23,41,0.10)] overflow-hidden', card.tone)}
    >
      <div className="mb-2">
        <span className="type-caption font-semibold uppercase tracking-wide" style={{ color: card.accent }}>{card.tag}</span>
      </div>
      <h2 className="type-heading text-[var(--color-text-primary)] mb-4">{card.title}</h2>
      <div className="flex-1 min-h-0 flex flex-col justify-center">{card.visual}</div>
    </motion.article>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DESKTOP CARD
══════════════════════════════════════════════════════════════════ */

function DesktopCard({ card }: { card: InsightCard }) {
  return (
    <div className={cn('rounded-[24px] p-5 flex flex-col gap-4 break-inside-avoid', card.tone)}>
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
  const [index, setIndex] = useState(0);
  const CARDS = makeCards();

  const go = (direction: 1 | -1) =>
    setIndex(v => (v + direction + CARDS.length) % CARDS.length);

  return (
    <PageShell showDesktopHeader={false} desktopWide>
      <div className="h-full flex flex-col overflow-hidden bg-[var(--color-background)]">

        {/* ── Mobile header ── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-0 lg:hidden">
          <h1 className="type-title text-center text-[var(--color-text-primary)]">Insights</h1>
        </div>

        {/* ── Mobile swipe stack ── */}
        <div className="flex flex-1 flex-col overflow-hidden px-4 pb-24 lg:hidden">
          <div className="flex-1 flex items-center min-h-0">
            <div className="relative h-[72%] min-h-[420px] w-full">
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

          {/* Swipe indicator dots */}
          <div className="flex shrink-0 items-center justify-center gap-1.5 pb-1 pt-0.5">
            {CARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIndex(i)}
                className="transition-all duration-200"
                style={{
                  width: i === index ? 14 : 4,
                  height: 4,
                  borderRadius: 9999,
                  background: i === index ? 'var(--color-brand-600)' : 'var(--color-border-strong)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Desktop masonry ── */}
        <div className="hidden lg:block h-full overflow-y-auto px-6 py-6">
          <h1 className="type-title-lg text-center text-[var(--color-text-primary)] mb-8">Insights</h1>
          <div style={{ columnCount: 3, columnGap: '1.25rem' }} className="3xl:columns-4">
            {CARDS.map(card => (
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
