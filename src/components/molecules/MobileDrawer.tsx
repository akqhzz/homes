'use client';
import { PointerEvent, ReactNode, TouchEvent, useCallback, useEffect, useRef } from 'react';
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
  const drawerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const swipeStartRef = useRef<{ x: number; y: number; pointerId?: number } | null>(null);
  const trackingRef = useRef(false);
  const nativeSwipeRef = useRef<{
    x: number;
    y: number;
    pointerId?: number;
    active: boolean;
    dragging: boolean;
  } | null>(null);

  const isDrawerContentScrolledTop = useCallback(() => !contentRef.current || contentRef.current.scrollTop <= 1, []);

  const closeIfSwipeDown = useCallback((dx: number, dy: number) => {
    if (!isDrawerContentScrolledTop()) return;
    if (dy > 72 && Math.abs(dy) > Math.abs(dx) * 1.15) onClose();
  }, [isDrawerContentScrolledTop, onClose]);

  const canStartDrawerSwipe = useCallback((target: HTMLElement) => {
    if (!isDrawerContentScrolledTop()) return false;
    return !target.closest('input, textarea, select, a, [data-no-drawer-drag="true"]');
  }, [isDrawerContentScrolledTop]);

  const rememberPointerStart = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!canStartDrawerSwipe(target)) return false;
    swipeStartRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    trackingRef.current = true;
    return true;
  };

  const startDrawerDrag = (event: PointerEvent<HTMLElement>) => {
    if (!rememberPointerStart(event)) return;
    dragControls.start(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    trackingRef.current = false;
    if (!start || start.pointerId !== event.pointerId) return;
    closeIfSwipeDown(event.clientX - start.x, event.clientY - start.y);
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!canStartDrawerSwipe(target)) return;
    const touch = event.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    trackingRef.current = true;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    trackingRef.current = false;
    if (!start) return;
    const touch = event.changedTouches[0];
    closeIfSwipeDown(touch.clientX - start.x, touch.clientY - start.y);
  };

  useEffect(() => {
    const node = drawerRef.current;
    if (!node) return;

    const startNativeSwipe = (x: number, y: number, target: EventTarget | null, pointerId?: number) => {
      if (!(target instanceof HTMLElement) || !canStartDrawerSwipe(target)) return;
      nativeSwipeRef.current = {
        x,
        y,
        pointerId,
        active: true,
        dragging: false,
      };
    };

    const moveNativeSwipe = (x: number, y: number, event: Event) => {
      const start = nativeSwipeRef.current;
      if (!start?.active) return;
      const dx = x - start.x;
      const dy = y - start.y;

      if (dy > 4 && Math.abs(dy) > Math.abs(dx) * 1.05) {
        start.dragging = true;
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const endNativeSwipe = (x: number, y: number, pointerId?: number) => {
      const start = nativeSwipeRef.current;
      nativeSwipeRef.current = null;
      if (!start?.active || (start.pointerId && pointerId && start.pointerId !== pointerId)) return;
      const dx = x - start.x;
      const dy = y - start.y;
      if (start.dragging && dy > 44 && Math.abs(dy) > Math.abs(dx) * 0.75) {
        onClose();
      }
    };

    const onPointerDown = (event: globalThis.PointerEvent) => {
      startNativeSwipe(event.clientX, event.clientY, event.target, event.pointerId);
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const start = nativeSwipeRef.current;
      if (!start?.active || start.pointerId !== event.pointerId) return;
      moveNativeSwipe(event.clientX, event.clientY, event);
    };
    const onPointerUp = (event: globalThis.PointerEvent) => {
      endNativeSwipe(event.clientX, event.clientY, event.pointerId);
    };
    const onTouchStart = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startNativeSwipe(touch.clientX, touch.clientY, event.target);
    };
    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      moveNativeSwipe(touch.clientX, touch.clientY, event);
    };
    const onTouchEnd = (event: globalThis.TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endNativeSwipe(touch.clientX, touch.clientY);
    };

    node.addEventListener('pointerdown', onPointerDown, { capture: true });
    node.addEventListener('pointermove', onPointerMove, { capture: true });
    node.addEventListener('pointerup', onPointerUp, { capture: true });
    node.addEventListener('pointercancel', onPointerUp, { capture: true });
    node.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    node.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    node.addEventListener('touchend', onTouchEnd, { capture: true });
    node.addEventListener('touchcancel', onTouchEnd, { capture: true });

    return () => {
      node.removeEventListener('pointerdown', onPointerDown, { capture: true });
      node.removeEventListener('pointermove', onPointerMove, { capture: true });
      node.removeEventListener('pointerup', onPointerUp, { capture: true });
      node.removeEventListener('pointercancel', onPointerUp, { capture: true });
      node.removeEventListener('touchstart', onTouchStart, { capture: true });
      node.removeEventListener('touchmove', onTouchMove, { capture: true });
      node.removeEventListener('touchend', onTouchEnd, { capture: true });
      node.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, [canStartDrawerSwipe, isDrawerContentScrolledTop, onClose]);

  useEffect(() => {
    const handlePointerUp = (event: globalThis.PointerEvent) => {
      const start = swipeStartRef.current;
      if (!trackingRef.current || !start?.pointerId || start.pointerId !== event.pointerId) return;
      swipeStartRef.current = null;
      trackingRef.current = false;
      closeIfSwipeDown(event.clientX - start.x, event.clientY - start.y);
    };
    const handleTouchEnd = (event: globalThis.TouchEvent) => {
      const start = swipeStartRef.current;
      if (!trackingRef.current || !start || event.changedTouches.length === 0) return;
      swipeStartRef.current = null;
      trackingRef.current = false;
      const touch = event.changedTouches[0];
      closeIfSwipeDown(touch.clientX - start.x, touch.clientY - start.y);
    };
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerUp, { capture: true });
    window.addEventListener('touchend', handleTouchEnd, { capture: true });
    window.addEventListener('touchcancel', handleTouchEnd, { capture: true });
    return () => {
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handlePointerUp, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
    };
  }, [closeIfSwipeDown]);

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
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => {
          handlePointerUp(event);
          event.stopPropagation();
        }}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        onTouchEnd={(event) => {
          handleTouchEnd(event);
          event.stopPropagation();
        }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.28 }}
        onDragEnd={(_, info) => {
          if (!isDrawerContentScrolledTop()) return;
          if (info.offset.y > 90 || info.velocity.y > 650) onClose();
        }}
        initial={{ y: 36, opacity: 0.98 }}
        animate={{ y: 0 }}
        exit={{ y: 36, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60] flex h-auto w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_32px_rgba(15,23,41,0.16)]',
          heightClassName,
          className
        )}
      >
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!isDrawerContentScrolledTop()) return;
            swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
            trackingRef.current = true;
            dragControls.start(e);
          }}
          onTouchStart={handleTouchStart}
          style={{ touchAction: 'none' }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="mx-auto mt-2.5 h-1 w-7 rounded-full bg-[#D1D5DB]" />
          <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
            {title && <div className="type-subtitle min-w-0 flex-1 truncate text-left text-[#0F1729]">{title}</div>}
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
          ref={contentRef}
          onPointerDown={startDrawerDrag}
          onTouchStart={handleTouchStart}
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
