'use client';
import type { ReactNode } from 'react';
import BackButton from '@/components/atoms/BackButton';
import { cn } from '@/lib/utils/cn';

interface CollectionWorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  compact?: boolean;
  compactProgress?: number;
  hideSubtitleOnMobile?: boolean;
  rightSlot?: ReactNode;
  className?: string;
}

export default function CollectionWorkspaceHeader({
  title,
  subtitle,
  showBackButton = true,
  compact = false,
  compactProgress,
  hideSubtitleOnMobile = false,
  rightSlot,
  className,
}: CollectionWorkspaceHeaderProps) {
  const progress = compactProgress ?? (compact ? 1 : 0);
  const titleScale = 1 - progress * 0.18;
  const titleTranslate = progress * -6;

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
        <h1
          className={cn(
            'font-medium tracking-[-0.01em] text-[#0F1729] transition-[transform,font-size,line-height] duration-300 ease-out',
            compact ? 'text-[1.12rem] leading-[1.15] lg:text-[1.25rem]' : 'text-[1.28rem] leading-[1.2] lg:text-[1.55rem]'
          )}
          style={{
            transform: `translateY(${titleTranslate}px) scale(${titleScale})`,
            transformOrigin: 'center top',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              'text-[0.9rem] leading-[1.4] text-[#6B7280] transition-all duration-300 ease-out',
              hideSubtitleOnMobile && 'hidden lg:block'
            )}
            style={{
              marginTop: `${4 * (1 - progress)}px`,
              maxHeight: `${40 * (1 - progress)}px`,
              opacity: 1 - progress,
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
