import { memo } from 'react';
import { useVirtualList } from '../../hooks/useVirtualList';

export const VirtualizedList = memo(function VirtualizedList({
  items,
  itemHeight = 64,
  height = 420,
  renderItem,
  className = '',
}) {
  const { virtualItems, totalHeight, onScroll } = useVirtualList({ items, itemHeight });

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
    >
      <div className="relative" style={{ height: totalHeight }}>
        {virtualItems.map(({ item, index, top }) => (
          <div
            key={item.id || index}
            className="absolute left-0 right-0"
            style={{ height: itemHeight, transform: `translateY(${top}px)` }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});
