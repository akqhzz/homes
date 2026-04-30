'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import ButtonBadge from '@/components/ui/ButtonBadge';
import type { MapControlButtonShape } from '@/components/ui/buttonStyles';
import { cn } from '@/lib/utils/cn';

interface MapControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  badge?: ReactNode;
  shape?: MapControlButtonShape;
}

export default function MapControlButton({
  active = false,
  badge,
  shape = 'pill',
  className,
  children,
  ...props
}: MapControlButtonProps) {
  return (
    <Button
      variant="elevated"
      size="control"
      shape={shape}
      active={active}
      className={cn(shape === 'pill' && 'type-btn', className)}
      {...props}
    >
      {children}
      {badge && <ButtonBadge>{badge}</ButtonBadge>}
    </Button>
  );
}
