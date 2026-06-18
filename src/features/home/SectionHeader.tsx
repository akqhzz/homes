'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Title + city that re-animate together (identically) whenever the city
// changes. Re-keying on `animateKey` remounts the span so the whole heading —
// not just the city word — slides in as one unit.
export function AnimatedHeading({ animateKey, children }: { animateKey: string; children: ReactNode }) {
  return (
    <motion.span
      key={animateKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

export function SectionHeader({
  title,
  city,
  onArrow,
  onPrev,
  onNext,
}: {
  title: string;
  city?: string;
  onArrow: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={onArrow}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onArrow();
          }
        }}
        aria-label={`${title}${city ? ` ${city}` : ''} — see more`}
        className="group flex flex-1 cursor-pointer items-center justify-between gap-3 sm:flex-none sm:justify-start"
      >
        <h2 className="type-title-lg !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.55rem] lg:!text-[1.8rem]">
          {city ? <AnimatedHeading animateKey={city}>{title} {city}</AnimatedHeading> : title}
        </h2>
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowRight size={18} />
        </span>
      </div>
      {onPrev && onNext && <CarouselNav onPrev={onPrev} onNext={onNext} />}
    </div>
  );
}

export function CarouselNav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
      <CarouselArrow direction="left" onClick={onPrev} />
      <CarouselArrow direction="right" onClick={onNext} />
    </div>
  );
}

export function CarouselArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
    >
      <Icon size={18} />
    </button>
  );
}
