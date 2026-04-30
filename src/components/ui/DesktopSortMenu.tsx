'use client';
import ActionRow from '@/components/ui/ActionRow';
import { cn } from '@/lib/utils/cn';

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface DesktopSortMenuProps<T extends string> {
  options: Array<SortOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function DesktopSortMenu<T extends string>({
  options,
  value,
  onChange,
  className,
}: DesktopSortMenuProps<T>) {
  return (
    <div className={cn('w-52 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]', className)}>
      <div className="flex flex-col gap-1">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <ActionRow
              key={option.value}
              onClick={() => onChange(option.value)}
              selected={selected}
              className={cn(!selected && 'text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]')}
            >
              {option.label}
            </ActionRow>
          );
        })}
      </div>
    </div>
  );
}
