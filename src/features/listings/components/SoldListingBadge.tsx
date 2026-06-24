import { cn } from '@/lib/utils/cn';

export default function SoldListingBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-2.5 top-2.5 z-20 rounded-full bg-[var(--color-sold)] px-2.5 py-1.5 type-micro font-semibold text-white shadow-[0_8px_20px_rgba(15,23,41,0.16)]',
        className
      )}
    >
      Sold
    </span>
  );
}
