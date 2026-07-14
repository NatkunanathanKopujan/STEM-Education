import { useMemo, useState } from 'react';

export function useStudentCollection(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = Object.values(item).join(' ').toLowerCase().includes(normalized);
      const matchesFilter = filter === 'All' || item.type === filter || item.topic === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, items, query]);

  const addItem = (payload) => {
    setItems((current) => [{ id: Date.now(), ...payload }, ...current]);
  };

  return { items, filteredItems, query, setQuery, filter, setFilter, addItem };
}
