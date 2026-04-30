'use client';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useMapStore } from '@/store/mapStore';
import { getWindowRange } from '@/lib/utils/windowing';
import { useDocumentOverscrollLock } from '@/hooks/useDocumentOverscrollLock';

interface CarouselItem {
  id: string;
}

interface UseMobileListingsCarouselOptions<T extends CarouselItem> {
  items: T[];
  cardWidth: number;
  gap: number;
  swipeThreshold: number;
}

export function useMobileListingsCarousel<T extends CarouselItem>({
  items,
  cardWidth,
  gap,
  swipeThreshold,
}: UseMobileListingsCarouselOptions<T>) {
  const [viewportWidth, setViewportWidth] = useState(390);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const activeId = useMapStore.getState().mobileCarouselListingId ?? useMapStore.getState().selectedListingId;
    const index = items.findIndex((item) => item.id === activeId);
    return index >= 0 ? index : 0;
  });
  const [instantMove, setInstantMove] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);
  const syncingExternalSelectionRef = useRef(false);
  const mobileCarouselListingId = useMapStore((s) => s.mobileCarouselListingId);
  const mobileCarouselSelectionSource = useMapStore((s) => s.mobileCarouselSelectionSource);
  const mobileCarouselSelectionVersion = useMapStore((s) => s.mobileCarouselSelectionVersion);
  const setMobileCarouselListingId = useMapStore((s) => s.setMobileCarouselListingId);
  const markVisitedListing = useMapStore((s) => s.markVisitedListing);
  const activeIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  useDocumentOverscrollLock({ x: true });

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => node.removeEventListener('touchmove', handleTouchMove);
  }, []);

  useLayoutEffect(() => {
    if (mobileCarouselSelectionSource !== 'marker') return;
    const activeId = mobileCarouselListingId;
    if (!activeId) return;
    const index = items.findIndex((item) => item.id === activeId);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      syncingExternalSelectionRef.current = true;
      setInstantMove(true);
      setCurrentIndex(index);
    });
    return () => cancelAnimationFrame(frame);
  }, [items, mobileCarouselListingId, mobileCarouselSelectionSource, mobileCarouselSelectionVersion]);

  useEffect(() => {
    if (!instantMove || !syncingExternalSelectionRef.current) return;
    const frame = requestAnimationFrame(() => {
      syncingExternalSelectionRef.current = false;
      setInstantMove(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentIndex, instantMove]);

  useEffect(() => {
    if (!mobileCarouselListingId) return;
    markVisitedListing(mobileCarouselListingId);
  }, [markVisitedListing, mobileCarouselListingId]);

  useEffect(() => {
    if (mobileCarouselSelectionSource === 'marker') return;
    if (syncingExternalSelectionRef.current) return;
    const centeredItem = items[activeIndex];
    if (!centeredItem) return;
    setMobileCarouselListingId(centeredItem.id, 'carousel');
  }, [activeIndex, items, mobileCarouselSelectionSource, setMobileCarouselListingId]);

  const goTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(items.length - 1, index));
    setInstantMove(false);
    setCurrentIndex(nextIndex);
    if (items[nextIndex]) setMobileCarouselListingId(items[nextIndex].id, 'carousel');
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return;
    goTo(currentIndex + (dx < 0 ? 1 : -1));
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) event.preventDefault();
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-card-image="true"]')) return;
    event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 18) return;
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;
    goTo(currentIndex + (event.deltaX > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 320);
  };

  const centeredOffset = Math.max(0, (viewportWidth - cardWidth) / 2);
  const { start: windowStart, end: windowEnd } = useMemo(
    () => getWindowRange(activeIndex, items.length),
    [activeIndex, items.length]
  );
  const visibleItems = items.slice(windowStart, windowEnd);
  const trackWidth = Math.max(0, items.length * cardWidth + Math.max(0, items.length - 1) * gap);

  return {
    activeIndex,
    carouselRef,
    centeredOffset,
    instantMove,
    trackWidth,
    visibleItems,
    windowStart,
    handlers: {
      onPointerDownCapture: handlePointerDown,
      onPointerUpCapture: handlePointerUp,
      onPointerCancelCapture: () => {
        dragStartRef.current = null;
      },
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onWheel: handleWheel,
    },
  };
}
