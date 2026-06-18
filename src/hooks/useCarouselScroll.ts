import { useCallback, useEffect, useState } from 'react';

// Tracks a horizontal scroll container's edges so carousel arrows can disable
// themselves at the very start/end. Returns a callback `ref` for the scroller
// (a function, so it's safe to read during render), edge flags, and a smooth
// scroll-by-page helper.
export function useCarouselScroll(maxStep = 760) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!node) return;
    const update = () => {
      // Snap + container padding (px-1) leaves a few px of rest offset at the
      // very start/end, so compare against a small epsilon rather than 0.
      const EDGE = 8;
      const maxScroll = node.scrollWidth - node.clientWidth;
      setAtStart(node.scrollLeft <= EDGE);
      // No overflow → treat as both ends reached (arrows fully disabled).
      setAtEnd(maxScroll <= EDGE || node.scrollLeft >= maxScroll - EDGE);
    };
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => {
      node.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [node]);

  const scrollByDir = useCallback(
    (dir: 1 | -1) => {
      if (!node) return;
      node.scrollBy({ left: dir * Math.min(maxStep, node.clientWidth * 0.85), behavior: 'smooth' });
    },
    [node, maxStep]
  );

  // `bindScroller` is a callback ref (a function), so reading it during render
  // is safe and not flagged by the refs lint rule.
  return { bindScroller: setNode, atStart, atEnd, scrollByDir };
}
