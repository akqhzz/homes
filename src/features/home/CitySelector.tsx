'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// A pill that shows the current city (with image bubble) and opens a dropdown
// to pick another city.
export function CitySelector({
  city,
  options,
  thumb,
  onChange,
}: {
  city: string;
  options: string[];
  thumb: (c: string) => string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-surface)] py-1.5 pl-1.5 pr-3.5 transition-colors hover:bg-[var(--color-brand-surface-strong)]"
      >
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <Image src={thumb(city)} alt="" fill sizes="32px" className="object-cover" />
        </span>
        <span className="type-heading-sm text-[var(--color-text-primary)]">{city}</span>
        <ChevronDown size={16} className={cn('text-[var(--color-text-tertiary)] transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_16px_44px_rgba(15,23,41,0.18)]">
          {options.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--color-surface)]',
                c === city && 'bg-[var(--color-surface)]'
              )}
            >
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image src={thumb(c)} alt="" fill sizes="32px" className="object-cover" />
              </span>
              <span className="type-heading-sm text-[var(--color-text-primary)]">{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
