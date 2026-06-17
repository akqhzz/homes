'use client';
import { motion } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════════
   Shared SVG chart primitives — pure, no domain/store/routing.
   Used by the for-you insights page and the homepage market board.
══════════════════════════════════════════════════════════════════ */

// Line chart with a soft gradient fill and an animated end dot. The dot is a
// CSS circle so it stays round regardless of the SVG's non-uniform stretch.
export function AreaSparkline({ points, color, height = 80 }: { points: number[]; color: string; height?: number }) {
  const W = 260, H = height, PX = 10;
  const max = Math.max(...points), min = Math.min(...points);
  const xs = points.map((_, i) => PX + (i / (points.length - 1)) * (W - PX * 2));
  const ys = points.map((v) => H - 10 - ((v - min) / (max - min || 1)) * (H - 22));
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
      <div style={{
        position: 'absolute', right: dotRightPct, top: lastY,
        transform: 'translate(50%, -50%)', width: 14, height: 14,
        borderRadius: '50%', background: color, opacity: 0.2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: dotRightPct, top: lastY,
        transform: 'translate(50%, -50%)', width: 8, height: 8,
        borderRadius: '50%', background: color, pointerEvents: 'none',
      }} />
    </div>
  );
}

export function HBarChart({ rows, color }: { rows: { label: string; value: number; sub?: string }[]; color: string }) {
  const max = Math.max(...rows.map((r) => r.value));
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

// SVG pie chart with an inline legend on the right.
export function PieChart({ slices, legendFontSize = 11.5 }: { slices: { label: string; value: number; color: string }[]; legendFontSize?: number }) {
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
  const rowGap = Math.max(28, legendFontSize * 2.1);
  const legendY0 = 100 - ((slices.length - 1) * rowGap) / 2;
  const swatch = Math.max(10, legendFontSize * 0.9);
  return (
    <svg viewBox="0 0 420 200" style={{ width: '100%', height: 'auto' }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2" />
      ))}
      {paths.map((p, i) => {
        const y = legendY0 + i * rowGap;
        return (
          <g key={`l${i}`}>
            <rect x="215" y={y - swatch / 2} width={swatch} height={swatch} rx="2" fill={p.color} />
            <text x={221 + swatch} y={y + 1} fontSize={legendFontSize} fill="rgba(0,0,0,0.6)" fontFamily="system-ui" dominantBaseline="central">{p.label}</text>
            <text x="415" y={y + 1} textAnchor="end" fontSize={legendFontSize + 0.5} fontWeight="600" fill="rgba(0,0,0,0.82)" fontFamily="system-ui" dominantBaseline="central">{p.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutGauge({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
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

// Single-value circular score ring (0–100), e.g. Walk / Transit / Bike scores.
export function ScoreRing({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 5, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.32}
        fontWeight="700" fontFamily="system-ui" fill="var(--color-text-primary)">{value}</text>
    </svg>
  );
}
