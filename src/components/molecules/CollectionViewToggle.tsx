'use client';
import { LayoutList, Map } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type CollectionView = 'list' | 'map';

interface CollectionViewToggleProps {
  value: CollectionView;
  onChange: (value: CollectionView) => void;
  className?: string;
}

const OPTIONS: Array<{
  value: CollectionView;
  label: string;
  icon: typeof LayoutList;
}> = [
  { value: 'list', label: 'List view', icon: LayoutList },
  { value: 'map', label: 'Map view', icon: Map },
];

export default function CollectionViewToggle({
  value,
  onChange,
  className,
}: CollectionViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-[#E5E7EB] bg-white/96 p-1 shadow-[0_12px_30px_rgba(15,23,41,0.12)] backdrop-blur-xl',
        className
      )}
    >
      {OPTIONS.map(({ value: optionValue, label, icon: Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onChange(optionValue)}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-full px-4 transition-all',
              active ? 'bg-[#0F1729] text-white' : 'text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]'
            )}
          >
            <Icon size={16} />
            <span className="type-btn">{optionValue === 'list' ? 'List' : 'Map'}</span>
          </button>
        );
      })}
    </div>
  );
}
