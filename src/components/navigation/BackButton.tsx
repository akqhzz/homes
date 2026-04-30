'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

// Shared app back affordance. It owns router behavior, while Button owns the surface visual styling.
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
    <Button
      variant="surface"
      shape={iconOnly ? 'circle' : 'pill'}
      size={iconOnly ? 'control' : 'md'}
      onClick={handleBack}
      className={cn(!iconOnly && 'pr-4', className)}
      aria-label={iconOnly ? 'Back' : undefined}
    >
      <ArrowLeft size={16} />
      {!iconOnly && 'Back'}
    </Button>
  );
}
