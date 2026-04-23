'use client';
import { PointerEvent, ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MobileDrawerProps {
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
  contentClassName?: string;
  heightClassName?: string;
  showBackdrop?: boolean;
}

export default function MobileDrawer({
  title,
  children,
  footer,
  onClose,
  className,
  contentClassName,
  heightClassName = 'max-h-[78dvh]',
  showBackdrop = true,
}: MobileDrawerProps) {
  const dragControls = useDragControls();
  const startDrawerDrag = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [data-no-drawer-drag="true"]')) return;
    dragControls.start(event);
  };

  return (
    <>
      {showBackdrop && (
        <motion.button
          type="button"
          aria-label="Close drawer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/25"
          onClick={onClose}
        />
      )}
      <motion.section
        role="dialog"
        aria-modal="true"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.28 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 650) onClose();
        }}
        initial={{ y: 36, opacity: 0.98 }}
        animate={{ y: 0 }}
        exit={{ y: 36, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60] flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_32px_rgba(15,23,41,0.16)]',
          heightClassName,
          className
        )}
      >
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
          style={{ touchAction: 'none' }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="mx-auto mt-2.5 h-1 w-7 rounded-full bg-[#D1D5DB]" />
          <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
            {title && <div className="font-heading text-lg min-w-0 flex-1 truncate text-left text-[#0F1729]">{title}</div>}
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#0F1729] hover:bg-[#F5F6F7]"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </header>
        </div>
        <div
          onPointerDown={startDrawerDrag}
          className={cn('flex-1 overflow-y-auto', contentClassName)}
        >
          {children}
        </div>
        {footer && (
          <footer className="px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
            {footer}
          </footer>
        )}
      </motion.section>
    </>
  );
}
