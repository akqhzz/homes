'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
        'inline-flex items-center rounded-full bg-[#F5F6F7] text-[#0F1729] transition-colors hover:bg-[#EBEBEB]',
        !iconOnly && 'type-btn',
        iconOnly ? 'h-12 w-12 justify-center' : 'h-10 gap-2 px-4',
        className
      )}
    >
      <ArrowLeft size={16} />
      {!iconOnly && 'Back'}
    </button>
  );
}
