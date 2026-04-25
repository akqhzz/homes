'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Shared desktop/mobile back affordance: light grey circular arrow-first treatment across listings and collections.
export default function BackButton({
  iconOnly = false,
  fallbackHref = '/',
  className,
}: {
  iconOnly?: boolean;
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'inline-flex items-center rounded-full bg-[#F3F4F6] text-[#0F1729] transition-colors hover:bg-[#E9EDF1]',
        !iconOnly && 'type-btn',
        iconOnly ? 'h-11 w-11 justify-center' : 'h-10 gap-2 px-4 pr-4',
        className
      )}
    >
      <ArrowLeft size={16} />
      {!iconOnly && 'Back'}
    </button>
  );
}
