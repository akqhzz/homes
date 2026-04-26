export function getWindowRange(centerIndex: number, totalItems: number, overscanBefore = 2, overscanAfter = 2) {
  if (totalItems <= 0) return { start: 0, end: 0 };

  const start = Math.max(0, centerIndex - overscanBefore);
  const end = Math.min(totalItems, centerIndex + overscanAfter + 1);

  return { start, end };
}
