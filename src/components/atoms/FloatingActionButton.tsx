'use client';
import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface FloatingActionButtonProps extends HTMLMotionProps<'button'> {
  size?: 'md' | 'lg';
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ size = 'md', layoutId, className, children, ...props }, ref) => (
    <motion.button
      layoutId={layoutId}
      ref={ref}
      className={cn(
        'pointer-events-auto rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] flex items-center justify-center no-select',
        'shadow-[var(--shadow-control)]',
        'hover:bg-[#F5F6F7] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none',
        size === 'md' ? 'w-11 h-11' : 'w-14 h-14',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
);

FloatingActionButton.displayName = 'FloatingActionButton';
export default FloatingActionButton;
