'use client';
import type { InputHTMLAttributes, ReactNode, RefObject } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils/cn';

interface CreateInlineFieldProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  collapsedLabel: ReactNode;
  onSubmit: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  submitLabel?: ReactNode;
  submitIcon?: ReactNode;
  submitStyle?: 'button' | 'icon';
  className?: string;
  inputClassName?: string;
  collapsedClassName?: string;
  submitClassName?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'placeholder'>;
}

export default function CreateInlineField({
  open,
  onOpenChange,
  value,
  onValueChange,
  placeholder,
  collapsedLabel,
  onSubmit,
  inputRef,
  autoFocus = false,
  submitLabel = 'Create',
  submitIcon,
  submitStyle = 'button',
  className,
  inputClassName,
  collapsedClassName,
  submitClassName,
  inputProps,
}: CreateInlineFieldProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-dashed border-[#D1D5DB] px-4 py-3 text-sm text-[#6B7280] transition-colors hover:border-[#0F1729] hover:text-[#0F1729]',
          collapsedClassName
        )}
      >
        <Plus size={16} />
        {collapsedLabel}
      </button>
    );
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit();
          if (event.key === 'Escape') {
            onOpenChange(false);
            onValueChange('');
          }
          inputProps?.onKeyDown?.(event);
        }}
        onBlur={(event) => {
          if (!value.trim()) {
            onOpenChange(false);
          }
          inputProps?.onBlur?.(event);
        }}
        placeholder={placeholder}
        className={cn(
          'h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]',
          inputClassName
        )}
        autoFocus={autoFocus}
        {...inputProps}
      />
      {submitStyle === 'icon' ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSubmit}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1729] text-white transition-colors hover:bg-[#1F2937]',
            submitClassName
          )}
          aria-label="Create"
        >
          {submitIcon ?? <Plus size={16} />}
        </button>
      ) : (
        <Button onMouseDown={(event) => event.preventDefault()} onClick={onSubmit} size="lg" className={cn('h-12 px-5', submitClassName)}>
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
