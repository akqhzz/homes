'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'glass' | 'filled';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'default', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none no-select flex-shrink-0',
          {
            'w-8 h-8': size === 'sm',
            'w-10 h-10': size === 'md',
            'w-12 h-12': size === 'lg',
          },
          {
            'bg-white text-[#0F1729] shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-[#F5F6F7]': variant === 'default',
            'bg-transparent text-[#6B7280] hover:bg-[#F5F6F7]': variant === 'ghost',
            'glass text-[#0F1729] shadow-[0_2px_8px_rgba(0,0,0,0.12)]': variant === 'glass',
            'bg-[#0F1729] text-white shadow-md hover:bg-[#243761]': variant === 'filled',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
export default IconButton;
