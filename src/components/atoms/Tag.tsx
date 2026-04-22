'use client';
import { cn } from '@/lib/utils/cn';

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium bg-[#F5F6F7] text-[#0F1729] rounded-full px-3 py-1.5',
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-[#9CA3AF] hover:text-[#0F1729] transition-colors"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
