import { useEffect } from 'react';

export function useDocumentOverscrollLock({ x = true, y = false }: { x?: boolean; y?: boolean } = {}) {
  useEffect(() => {
    const previous = {
      htmlX: document.documentElement.style.overscrollBehaviorX,
      bodyX: document.body.style.overscrollBehaviorX,
      htmlY: document.documentElement.style.overscrollBehaviorY,
      bodyY: document.body.style.overscrollBehaviorY,
    };

    if (x) {
      document.documentElement.style.overscrollBehaviorX = 'none';
      document.body.style.overscrollBehaviorX = 'none';
    }
    if (y) {
      document.documentElement.style.overscrollBehaviorY = 'none';
      document.body.style.overscrollBehaviorY = 'none';
    }

    return () => {
      document.documentElement.style.overscrollBehaviorX = previous.htmlX;
      document.body.style.overscrollBehaviorX = previous.bodyX;
      document.documentElement.style.overscrollBehaviorY = previous.htmlY;
      document.body.style.overscrollBehaviorY = previous.bodyY;
    };
  }, [x, y]);
}
