'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function BackButton({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        'inline-flex items-center rounded-full bg-[#F5F6F7] text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]',
        iconOnly ? 'h-12 w-12 justify-center' : 'h-10 gap-2 px-4',
        className
      )}
    >
      <ArrowLeft size={16} />
      {!iconOnly && 'Back'}
    </button>
  );
}
