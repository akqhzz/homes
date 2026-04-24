'use client';
import { type CSSProperties, type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface AnchoredPopoverProps {
  anchorRect: DOMRect | null;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
  offset?: number;
}

export default function AnchoredPopover({
  anchorRect,
  open,
  onClose,
  children,
  className,
  align = 'right',
  offset = 8,
}: AnchoredPopoverProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open || !anchorRect || typeof document === 'undefined') return null;

  const style: CSSProperties = align === 'left'
    ? { top: anchorRect.bottom + offset, left: anchorRect.left }
    : { top: anchorRect.bottom + offset, right: window.innerWidth - anchorRect.right };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[45]" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className={className}
          style={style}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>,
    document.body
  );
}
