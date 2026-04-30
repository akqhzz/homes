import { useEffect, type RefObject } from 'react';

export function useOutsidePointerDown<T extends HTMLElement>({
  refs,
  enabled,
  onOutside,
  ignoreClosestSelectors = [],
}: {
  refs: Array<RefObject<T | null>>;
  enabled: boolean;
  onOutside: () => void;
  ignoreClosestSelectors?: string[];
}) {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        target instanceof HTMLElement &&
        ignoreClosestSelectors.some((selector) => target.closest(selector))
      ) {
        return;
      }
      const isInside = refs.some((ref) => ref.current?.contains(target));
      if (!isInside) onOutside();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled, ignoreClosestSelectors, onOutside, refs]);
}
