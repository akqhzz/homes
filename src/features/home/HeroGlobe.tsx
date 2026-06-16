'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface Pin {
  label: string;
  top: string;
  left: string;
  image?: string;
  count?: number;
  delay: string;
}

// Floating province markers, à la zoocasa's globe.
const PINS: Pin[] = [
  { label: 'BC', top: '34%', left: '24%', image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=120&q=80', delay: '0s' },
  { label: 'ON', top: '52%', left: '50%', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=120&q=80', delay: '0.6s' },
  { label: 'NL', top: '30%', left: '74%', image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=120&q=80', delay: '1.1s' },
  { label: '3', top: '50%', left: '33%', count: 3, delay: '0.3s' },
  { label: '4', top: '55%', left: '66%', count: 4, delay: '0.9s' },
];

const MERIDIANS = [0, 30, 60, 90, 120, 150];
const PARALLELS = [
  { scale: 0.55, y: -86 },
  { scale: 0.82, y: -48 },
  { scale: 1, y: 0 },
  { scale: 0.82, y: 48 },
  { scale: 0.55, y: 86 },
];

export default function HeroGlobe() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTilt({ x: -py * 16, y: px * 16 }));
  };

  return (
    <div
      className="relative mx-auto aspect-square w-[clamp(300px,62vw,560px)]"
      style={{ perspective: '1100px' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* Soft white sphere base */}
      <div
        className="absolute inset-[6%] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 34% 28%, #ffffff 0%, #f6f9fc 46%, #e9eef5 78%, #dbe3ee 100%)',
          boxShadow:
            'inset -22px -26px 60px rgba(43,82,107,0.10), inset 18px 18px 44px rgba(255,255,255,0.9), 0 40px 80px -28px rgba(43,82,107,0.35)',
        }}
      />

      {/* Rotating wireframe — gives the interactive globe its motion */}
      <div
        className="globe-spin absolute inset-[6%]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${18 + tilt.x}deg) rotateY(${tilt.y}deg)`,
          animation: 'globe-spin 36s linear infinite',
        }}
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {MERIDIANS.map((deg) => (
            <span
              key={`m-${deg}`}
              className="absolute inset-0 rounded-full border border-[var(--color-brand-300)]/45"
              style={{ transform: `rotateY(${deg}deg)` }}
            />
          ))}
          {PARALLELS.map((parallel, index) => (
            <span
              key={`p-${index}`}
              className="absolute inset-0 rounded-full border border-[var(--color-brand-200)]/55"
              style={{
                transform: `rotateX(90deg) translateZ(${parallel.y}px) scale(${parallel.scale})`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Glossy highlight */}
      <div
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{ background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 38%)' }}
      />

      {/* Floating location pins */}
      {PINS.map((pin) => (
        <div
          key={pin.label}
          className="globe-float absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: pin.top, left: pin.left, animation: `globe-float 5s ease-in-out ${pin.delay} infinite` }}
        >
          {pin.count != null ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text-primary)] text-white shadow-[0_8px_20px_rgba(15,23,41,0.28)]">
              <span className="type-caption font-semibold">{pin.count}</span>
            </span>
          ) : (
            <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-[0_10px_24px_rgba(15,23,41,0.25)]">
              {pin.image && (
                <Image src={pin.image} alt={pin.label} fill sizes="48px" className="object-cover" />
              )}
              <span className={cn('absolute inset-0 flex items-center justify-center bg-black/30 type-caption font-semibold text-white')}>
                {pin.label}
              </span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
