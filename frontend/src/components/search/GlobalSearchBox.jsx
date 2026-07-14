import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { searchService } from '../../services/searchService';

export function GlobalSearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [data, setData] = useState({ suggestions: [], recentSearches: [], popularSearches: [] });
  const debouncedQuery = useDebouncedValue(query, 300);
  const options = useMemo(
    () => [
      ...(data.suggestions || []).map((item) => ({
        key: `suggestion-${item.category}-${item.title}`,
        label: item.title,
        meta: item.category,
      })),
      ...(data.recentSearches || []).slice(0, 5).map((item) => ({
        key: `recent-${item.id}`,
        label: item.searchTerm,
        meta: 'recent',
      })),
      ...(data.popularSearches || []).slice(0, 5).map((item) => ({
        key: `popular-${item.searchTerm}`,
        label: item.searchTerm,
        meta: 'popular',
      })),
    ],
    [data],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSuggestions() {
      if (!open) return;
      const response = await searchService.suggestions({ q: debouncedQuery });
      if (isMounted) setData(response);
    }

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  const submit = (term = query) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative">
      <label className="relative block">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((value) => Math.min(value + 1, options.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((value) => Math.max(value - 1, -1));
            }
            if (event.key === 'Enter') submit(activeIndex >= 0 ? options[activeIndex]?.label : query);
            if (event.key === 'Escape') setOpen(false);
          }}
          className="focus-ring h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted transition focus:border-primary"
          type="search"
          placeholder="Search users, materials, quizzes"
        />
      </label>
      {open ? (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-line bg-white p-3 shadow-soft">
          <div className="max-h-80 overflow-y-auto">
            {options.length ? (
              <div>
                <p className="px-2 text-xs font-semibold uppercase text-muted">Suggestions</p>
                {options.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`block w-full rounded-lg px-2 py-2 text-left text-sm ${
                      activeIndex === index ? 'bg-orange-50 text-primary' : 'hover:bg-orange-50'
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={() => submit(item.label)}
                  >
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="ml-2 text-xs text-muted">{item.meta}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-2 py-2 text-sm text-muted">No suggestions yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
