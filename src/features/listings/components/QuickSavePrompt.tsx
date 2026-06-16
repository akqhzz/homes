'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';

/**
 * Where the quick-save confirmation toast renders:
 * - `inline` — relative, sits inside a card-mode action row.
 * - `top` — fixed, top center (mobile list view).
 * - `top-below-toolbar` — fixed, top center clearing the map top toolbar (mobile map view).
 * - `bottom` — fixed, bottom center (desktop).
 */
export type QuickSavePromptPlacement = 'inline' | 'top' | 'top-below-toolbar' | 'bottom';

const POSITION_CLASS: Record<QuickSavePromptPlacement, string> = {
  inline: 'relative h-14 w-full max-w-[320px] py-3 pl-6 pr-3',
  top: 'fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] h-11 w-[min(calc(100vw-7.25rem),292px)] -translate-x-1/2 py-1.5 pl-4 pr-1.5',
  'top-below-toolbar':
    'fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] h-11 w-[min(calc(100vw-7.25rem),292px)] -translate-x-1/2 py-1.5 pl-4 pr-1.5',
  bottom:
    'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] left-1/2 h-12 w-[min(calc(100vw-3rem),340px)] -translate-x-1/2 py-2 pl-6 pr-2',
};

// Slide in from the edge the toast is anchored to: top variants drop down, bottom/inline rise up.
const ENTER_Y: Record<QuickSavePromptPlacement, number> = { inline: 10, top: -10, 'top-below-toolbar': -10, bottom: 10 };
const EXIT_Y: Record<QuickSavePromptPlacement, number> = { inline: 8, top: -8, 'top-below-toolbar': -8, bottom: 8 };

/**
 * Confirmation toast shown after a one-tap quick save ("Saved to 'X'"), with a
 * Change action that re-opens the collection picker. Shared by card mode and
 * listing-card hearts.
 */
export default function QuickSavePrompt({
  collectionName,
  extraCount = 0,
  placement = 'top',
  onChangeCollection,
}: {
  collectionName: string;
  /** How many other collections the listing is also saved in (shown as "+n"). */
  extraCount?: number;
  placement?: QuickSavePromptPlacement;
  onChangeCollection: () => void;
}) {
  return (
    <motion.div
      data-card-overlay-control="true"
      data-quick-save-prompt="true"
      className={cn(
        'z-[130] flex items-center justify-between gap-3 rounded-md border border-white/70 bg-white/58 shadow-[0_12px_34px_rgba(15,23,41,0.16)] backdrop-blur-2xl',
        POSITION_CLASS[placement]
      )}
      initial={{ y: ENTER_Y[placement], opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: EXIT_Y[placement], opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      // Rendered through a portal that lives inside the card's React tree, so
      // clicks would otherwise bubble up to a wrapping row's navigation handler.
      onClick={(event) => event.stopPropagation()}
    >
      <p className="min-w-0 truncate type-label text-[var(--color-text-primary)]">
        Saved to &quot;{collectionName}&quot;{extraCount > 0 ? ` +${extraCount}` : ''}
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onChangeCollection();
        }}
        className="h-8 shrink-0 px-3 type-label"
      >
        Change
      </Button>
    </motion.div>
  );
}
