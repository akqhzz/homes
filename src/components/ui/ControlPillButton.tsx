'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Button from '@/components/ui/Button';
import ButtonBadge from '@/components/ui/ButtonBadge';
import { cn } from '@/lib/utils/cn';

interface ControlPillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  badge?: ReactNode;
}

export default function ControlPillButton({
  active = false,
  badge,
  className,
  children,
  ...props
}: ControlPillButtonProps) {
  return (
    <Button
      variant="elevated"
      size="control"
      active={active}
      className={cn('type-btn', className)}
      {...props}
    >
      {children}
      {badge && <ButtonBadge>{badge}</ButtonBadge>}
    </Button>
  );
}
