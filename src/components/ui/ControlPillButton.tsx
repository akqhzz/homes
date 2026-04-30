'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import ButtonBadge from '@/components/ui/ButtonBadge';
import { cn } from '@/lib/utils/cn';

interface ControlPillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  badge?: ReactNode;
}

const ControlPillButton = forwardRef<HTMLButtonElement, ControlPillButtonProps>(function ControlPillButton({
  active = false,
  badge,
  className,
  children,
  ...props
}, ref) {
  return (
    <Button
      ref={ref}
      variant="elevated"
      size="control"
      active={active}
      className={cn('type-btn relative', badge && 'pr-5', className)}
      {...props}
    >
      {children}
      {badge && <ButtonBadge className="-right-1 -top-1">{badge}</ButtonBadge>}
    </Button>
  );
});

export default ControlPillButton;
