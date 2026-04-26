import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ListingAddressRow({
  children,
  className,
  iconClassName,
  iconSize = 14,
}: {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <MapPin size={iconSize} className={iconClassName} />
      <span>{children}</span>
    </div>
  );
}

export function ListingFeaturePills({
  features,
  itemClassName,
}: {
  features: string[];
  itemClassName: string;
}) {
  return (
    <>
      {features.map((feature) => (
        <span key={feature} className={itemClassName}>
          {feature}
        </span>
      ))}
    </>
  );
}

export function ListingFactRow({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-3', className)}>
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      <div>
        <p className="type-caption text-[var(--color-text-tertiary)]">{label}</p>
        <p className="type-label text-[var(--color-text-primary)]">{value}</p>
      </div>
    </div>
  );
}
