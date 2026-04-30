import { cn } from '@/lib/utils/cn';

/**
 * Button variant guide:
 * - primary: dark filled main action, e.g. listing "Book A Tour" and filter "Show results".
 * - secondary: light bordered action, e.g. filter "Reset" and delete-confirm "Cancel".
 * - ghost: transparent hover-only action, currently used internally for plain close controls.
 * - danger: red destructive action, e.g. delete-confirm "Delete".
 * - surface: flat light-gray surface action, e.g. listing Back, listing Contact Agent, header Collections.
 * - elevated: white shadow control, e.g. map/filter pills through MapControlButton and ControlPillButton.
 * - overlay: light translucent circle over media, e.g. listing card hearts/arrows and cards undo.
 */

export type ButtonSize = 'xs' | 'sm' | 'md' | 'control' | 'lg';
export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'elevated' | 'surface' | 'overlay';
export type ButtonShape = 'pill' | 'circle';
export type MapControlButtonShape = 'pill' | 'circle';

const buttonBase =
  'inline-flex items-center justify-center rounded-full transition-all duration-150 outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 no-select';

const buttonToneClasses: Record<ButtonTone, string> = {
  primary:
    'type-btn bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'type-btn border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
  ghost: 'type-btn bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
  danger: 'type-btn bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:opacity-90',
  elevated:
    'bg-white text-[var(--color-text-primary)] shadow-[var(--shadow-control)] hover:bg-[var(--color-surface)]',
  surface:
    'type-btn bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]',
  overlay:
    'pointer-events-auto bg-white/85 text-[var(--color-text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur hover:bg-white',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1 px-2',
  sm: 'px-3 h-8 gap-1.5',
  md: 'px-4 h-10 gap-2',
  control: 'px-4 h-11 gap-2',
  lg: 'px-6 h-12 gap-2',
};

const buttonCircleSizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  control: 'h-11 w-11',
  lg: 'h-12 w-12',
};

export function getButtonClasses({
  tone = 'primary',
  size = 'md',
  shape = 'pill',
  fullWidth = false,
  active = false,
  className,
}: {
  tone?: ButtonTone;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  active?: boolean;
  className?: string;
}) {
  return cn(
    buttonBase,
    buttonToneClasses[tone],
    shape === 'circle' ? buttonCircleSizeClasses[size] : buttonSizeClasses[size],
    active && 'border border-[var(--color-text-primary)] shadow-[inset_0_0_0_1px_var(--color-text-primary)]',
    fullWidth && shape !== 'circle' && 'w-full',
    className
  );
}

export function getBackButtonClasses({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  return cn(
    'inline-flex items-center rounded-full bg-[#F3F4F6] text-[#0F1729] transition-colors hover:bg-[#E9EDF1]',
    !iconOnly && 'type-btn',
    iconOnly ? 'h-11 w-11 justify-center' : 'h-10 gap-2 px-4 pr-4',
    className
  );
}
