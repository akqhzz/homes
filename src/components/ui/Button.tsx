'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { getButtonClasses, type ButtonShape, type ButtonSize, type ButtonTone } from '@/components/ui/buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonTone;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  active?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', shape = 'pill', fullWidth, active, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={getButtonClasses({ tone: variant, size, shape, fullWidth, active, className })}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
