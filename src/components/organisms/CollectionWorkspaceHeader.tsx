'use client';
import BackButton from '@/components/atoms/BackButton';
import { cn } from '@/lib/utils/cn';

interface CollectionWorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  className?: string;
}

export default function CollectionWorkspaceHeader({
  title,
  subtitle,
  showBackButton = true,
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

      <div className="min-w-0 text-center">
        <h1 className="text-[1.28rem] font-medium leading-[1.2] tracking-[-0.01em] text-[#0F1729] lg:text-[1.55rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[0.9rem] leading-[1.4] text-[#6B7280]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
