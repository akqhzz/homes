'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import MobileDrawer from '@/components/ui/MobileDrawer';
import { cn } from '@/lib/utils/cn';

// A pill that shows the current city (with image bubble) and opens a picker:
// an inline dropdown on desktop, a bottom drawer on mobile.
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
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open, isMobile]);

  const pick = (c: string) => { onChange(c); setOpen(false); };

  const optionRow = (c: string, big = false) => (
    <button
      key={c}
      type="button"
      onClick={() => pick(c)}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl text-left transition-colors hover:bg-[var(--color-surface)]',
        big ? 'px-3 py-3' : 'px-2 py-2',
        c === city && 'bg-[var(--color-surface)]'
      )}
    >
      <span className={cn('relative shrink-0 overflow-hidden rounded-full', big ? 'h-10 w-10' : 'h-8 w-8')}>
        <Image src={thumb(c)} alt="" fill sizes={big ? '40px' : '32px'} className="object-cover" />
      </span>
      <span className="type-heading-sm text-[var(--color-text-primary)]">{c}</span>
    </button>
  );

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
        <ChevronDown size={16} className={cn('text-[var(--color-text-tertiary)] transition-transform', open && !isMobile && 'rotate-180')} />
      </button>

      {/* Desktop: inline dropdown */}
      {open && !isMobile && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_16px_44px_rgba(15,23,41,0.18)]">
          {options.map((c) => optionRow(c))}
        </div>
      )}

      {/* Mobile: bottom drawer */}
      {open && isMobile && (
        <MobileDrawer title="Choose a city" onClose={() => setOpen(false)} heightClassName="max-h-[70dvh]">
          <div className="flex flex-col gap-1 px-2 pb-2">
            {options.map((c) => optionRow(c, true))}
          </div>
        </MobileDrawer>
      )}
    </div>
  );
}
