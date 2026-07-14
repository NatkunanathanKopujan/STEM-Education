import { useMemo, useState } from 'react';

export function useVirtualList({ items = [], itemHeight = 56, overscan = 6 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(Math.floor(scrollTop / itemHeight) - overscan, 0);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(startIndex + visibleCount, items.length);

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [containerHeight, itemHeight, items, overscan, scrollTop]);

  return {
    virtualItems,
    totalHeight: items.length * itemHeight,
    onScroll: (event) => {
      setScrollTop(event.currentTarget.scrollTop);
      setContainerHeight(event.currentTarget.clientHeight);
    },
  };
}
