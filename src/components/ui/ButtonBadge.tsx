import type { ReactNode } from 'react';

export default function ButtonBadge({ children }: { children: ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1 type-nano leading-none text-[var(--color-text-inverse)]">
      {children}
    </span>
  );
}
