import { useMemo, useState } from 'react';

export function useTeacherCollection(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = Object.values(item).join(' ').toLowerCase().includes(normalized);
      const matchesFilter = filter === 'All' || item.status === filter || item.curriculum === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, items, query]);

  const addItem = (payload) => {
    setItems((current) => [{ id: Date.now(), ...payload }, ...current]);
  };

  const updateItem = (id, payload) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  return { items, filteredItems, query, setQuery, filter, setFilter, addItem, updateItem };
}
