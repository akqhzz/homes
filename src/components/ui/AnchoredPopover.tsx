'use client';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface AnchoredPopoverProps {
  anchorRect: DOMRect | null;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  align?: 'left' | 'right';
  offset?: number;
}

export default function AnchoredPopover({
  anchorRect,
  open,
  onClose,
  children,
  className,
  backdropClassName = 'z-[45]',
  align = 'right',
  offset = 8,
}: AnchoredPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !anchorRect) return;

    const updatePosition = () => {
      const node = popoverRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportPadding = 12;
      const preferredLeft =
        align === 'left' ? anchorRect.left : anchorRect.right - rect.width;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding);
      const left = Math.min(Math.max(viewportPadding, preferredLeft), maxLeft);

      const preferredTop = anchorRect.bottom + offset;
      const fitsBelow = preferredTop + rect.height <= window.innerHeight - viewportPadding;
      const top = fitsBelow
        ? preferredTop
        : Math.max(viewportPadding, anchorRect.top - rect.height - offset);

      setStyle({ left, top });
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, anchorRect, offset, open]);

  if (!open || !anchorRect || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className={`fixed inset-0 ${backdropClassName}`} onClick={onClose} />
      <AnimatePresence>
        <motion.div
          ref={popoverRef}
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
