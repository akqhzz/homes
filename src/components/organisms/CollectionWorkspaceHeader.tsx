'use client';
import type { ReactNode } from 'react';
import BackButton from '@/components/atoms/BackButton';
import { cn } from '@/lib/utils/cn';

interface CollectionWorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  compact?: boolean;
  rightSlot?: ReactNode;
  className?: string;
}

export default function CollectionWorkspaceHeader({
  title,
  subtitle,
  showBackButton = true,
  compact = false,
  rightSlot,
  className,
}: CollectionWorkspaceHeaderProps) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {showBackButton && (
        <BackButton
          iconOnly
          className="absolute left-0 hidden h-11 w-11 shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[#F5F6F7] lg:flex"
        />
      )}

      {rightSlot && (
        <div className="absolute right-0 hidden items-center gap-2 lg:flex">
          {rightSlot}
        </div>
      )}

      <div className="min-w-0 text-center transition-all duration-300 ease-out">
        <h1 className={cn(
          'font-medium tracking-[-0.01em] text-[#0F1729] transition-all duration-300 ease-out',
          compact ? 'text-[1.05rem] leading-[1.15] lg:text-[1.25rem]' : 'text-[1.28rem] leading-[1.2] lg:text-[1.55rem]'
        )}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn(
            'text-[0.9rem] leading-[1.4] text-[#6B7280] transition-all duration-300 ease-out',
            compact ? 'mt-0 max-h-0 overflow-hidden opacity-0' : 'mt-1 max-h-10 opacity-100'
          )}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
