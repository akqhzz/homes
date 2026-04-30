'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  displayLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<SegmentedControlOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  showLabels?: boolean;
  itemClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
  indicatorClassName?: string;
}

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  showLabels = true,
  itemClassName,
  activeItemClassName = 'text-white',
  inactiveItemClassName = 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
  indicatorClassName,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div
      className={cn(
        'relative inline-grid h-11 items-center rounded-full bg-white p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <div
        className={cn(
          'pointer-events-none absolute bottom-1.5 top-1.5 rounded-full bg-[var(--color-text-primary)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          indicatorClassName
        )}
        style={{
          left: '0.375rem',
          width: `calc((100% - 0.75rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 inline-flex h-full items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              active ? activeItemClassName : inactiveItemClassName,
              itemClassName
            )}
          >
            {option.icon}
            {showLabels && <span className="type-btn">{option.displayLabel ?? option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
