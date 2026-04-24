'use client';
import { Check } from 'lucide-react';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import { cn } from '@/lib/utils/cn';

export interface SortOptionItem<T extends string> {
  value: T;
  label: string;
}

interface SortOptionsDrawerProps<T extends string> {
  title: string;
  open: boolean;
  value: T;
  options: Array<SortOptionItem<T>>;
  onClose: () => void;
  onChange: (value: T) => void;
}

export default function SortOptionsDrawer<T extends string>({
  title,
  open,
  value,
  options,
  onClose,
  onChange,
}: SortOptionsDrawerProps<T>) {
  if (!open) return null;

  return (
    <MobileDrawer
      title={title}
      onClose={onClose}
      heightClassName="h-auto max-h-[78dvh]"
      contentClassName="px-4 pb-4 overflow-visible"
    >
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={cn(
                'flex min-h-12 items-center justify-between gap-3 whitespace-normal rounded-2xl border px-4 py-3 text-left type-label leading-snug transition-colors',
                selected
                  ? 'border-[#9CA3AF] bg-white text-[#0F1729] shadow-[inset_0_0_0_1px_#9CA3AF]'
                  : 'border-transparent bg-[#F5F6F7] text-[#0F1729]'
              )}
            >
              <span className="min-w-0 flex-1 break-words">{option.label}</span>
              {selected && <Check size={16} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </MobileDrawer>
  );
}
