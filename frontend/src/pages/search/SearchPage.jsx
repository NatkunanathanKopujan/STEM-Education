import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiBookmark, FiEdit3, FiFilter, FiSearch, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { searchService } from '../../services/searchService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const categories = [
  ['users', 'Users'],
  ['admins', 'Admins'],
  ['teachers', 'Teachers'],
  ['students', 'Students'],
  ['curriculums', 'Curriculums'],
  ['subjects', 'Subjects'],
  ['lessons', 'Lessons'],
  ['completed_topics', 'Completed Topics'],
  ['learning_materials', 'Learning Materials'],
  ['pdf_files', 'PDF Files'],
  ['ppt_files', 'PPT Files'],
  ['doc_files', 'DOC Files'],
  ['videos', 'Videos'],
  ['teacher_notes', 'Teacher Notes'],
  ['announcements', 'Announcements'],
  ['quizzes', 'Quizzes'],
  ['quiz_results', 'Quiz Results'],
  ['reports', 'Reports'],
  ['notifications', 'Notifications'],
];

const initialFilters = {
  category: '',
  academicYear: '',
  semester: '',
  department: '',
  curriculum: '',
  subject: '',
  teacher: '',
  student: '',
  weekNo: '',
  topic: '',
  completedTopic: '',
  status: '',
  difficulty: '',
  quizNumber: '',
  dateFrom: '',
  dateTo: '',
  uploadDate: '',
  fileType: '',
  createdBy: '',
  role: '',
  sort: 'relevance',
  page: 1,
};

const filterRows = [
  ['academicYear', 'Academic Year'],
  ['semester', 'Semester'],
  ['department', 'Department'],
  ['curriculum', 'Curriculum'],
  ['subject', 'Subject'],
  ['teacher', 'Teacher'],
  ['student', 'Student'],
  ['weekNo', 'Week Number'],
  ['topic', 'Topic'],
  ['quizNumber', 'Quiz Number'],
  ['uploadDate', 'Upload Date'],
  ['createdBy', 'Created By'],
];

function readInitialFilters(searchParams) {
  return Object.fromEntries(
    Object.entries(initialFilters).map(([key, fallback]) => [
      key,
      key === 'page' ? Number(searchParams.get(key) || fallback) : searchParams.get(key) || fallback,
    ]),
  );
}

function safeParse(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function highlight(text = '', term = '') {
  if (!term) return text || 'No description';
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text || 'No description').split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-orange-100 px-1 text-primary">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState(readInitialFilters(searchParams));
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);
  const [suggestions, setSuggestions] = useState({
    suggestions: [],
    popularSearches: [],
    recentSearches: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const debouncedQuery = useDebouncedValue(query, 350);

  const params = useMemo(
    () => ({
      q: debouncedQuery,
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== null)),
      limit: 20,
    }),
    [debouncedQuery, filters],
  );

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => !['page', 'sort'].includes(key) && value,
  ).length;

  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        const [historyData, savedData, suggestionData] = await Promise.all([
          searchService.history(),
          searchService.saved(),
          searchService.suggestions({ q: debouncedQuery }),
        ]);
        if (!isMounted) return;
        setHistory(historyData.history || []);
        setSaved(savedData.savedSearches || []);
        setSuggestions(suggestionData);
      } catch (apiError) {
        if (isMounted) setError(apiError.response?.data?.message || 'Unable to load search metadata.');
      }
    }

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    let isMounted = true;

    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setResult(null);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const data = await searchService.search(params);
        if (!isMounted) return;
        setResult(data);
        setSearchParams(params);
      } catch (apiError) {
        if (isMounted) setError(apiError.response?.data?.message || 'Search failed.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, params, setSearchParams]);

  const reloadSaved = async () => {
    try {
      setSaved((await searchService.saved()).savedSearches || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to reload saved searches.');
    }
  };

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ ...initialFilters, sort: filters.sort, page: 1 });
  };

  const handleSave = async () => {
    const name = window.prompt('Saved search name', query || 'New search');
    if (!name) return;
    setError('');
    try {
      await searchService.save({
        name,
        searchTerm: query,
        filters,
        isPinned: true,
      });
      setMessage('Search saved.');
      await reloadSaved();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Save search failed.');
    }
  };

  const loadSaved = (item) => {
    setQuery(item.searchTerm);
    setFilters((current) => ({ ...current, ...safeParse(item.filters), page: 1 }));
  };

  const renameSaved = async (item) => {
    const name = window.prompt('Rename saved search', item.name);
    if (!name) return;
    setError('');
    try {
      await searchService.updateSaved(item.id, { name });
      await reloadSaved();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rename saved search failed.');
    }
  };

  const togglePin = async (item) => {
    setError('');
    try {
      await searchService.updateSaved(item.id, { isPinned: !item.isPinned });
      await reloadSaved();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Update saved search failed.');
    }
  };

  const inputClass = 'min-h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-primary';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Search"
        title="Global Search"
        description="Find LMS users, curriculum, lessons, completed topics, materials, quizzes, reports, and notifications with role-based permissions."
      />

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-line pl-10 pr-4 text-sm outline-none focus:border-primary"
              placeholder="Search users, PDF files, videos, completed topics, quiz results"
              type="search"
            />
          </label>
          <Button variant="secondary" onClick={() => setShowFilters((value) => !value)}>
            <FiFilter />
            Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
          </Button>
          <Button disabled={!query.trim()} onClick={handleSave}>
            <FiBookmark />
            Save
          </Button>
        </div>

        {suggestions.suggestions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.suggestions.slice(0, 6).map((item) => (
              <button
                key={`${item.category}-${item.title}`}
                type="button"
                className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-primary"
                onClick={() => setQuery(item.title)}
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}

        {showFilters ? (
          <div className="mt-5 space-y-4 border-t border-line pt-5">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Field label="Category">
                <select
                  value={filters.category}
                  onChange={(event) => changeFilter('category', event.target.value)}
                  className={inputClass}
                >
                  <option value="">All Categories</option>
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <input
                  value={filters.status}
                  onChange={(event) => changeFilter('status', event.target.value)}
                  placeholder="Active, published, approved"
                  className={inputClass}
                />
              </Field>
              <Field label="Difficulty">
                <select
                  value={filters.difficulty}
                  onChange={(event) => changeFilter('difficulty', event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="File Type">
                <select
                  value={filters.fileType}
                  onChange={(event) => changeFilter('fileType', event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  <option value="pdf">PDF</option>
                  <option value="ppt">PPT</option>
                  <option value="doc">DOC</option>
                  <option value="docx">DOCX</option>
                  <option value="video">Video</option>
                  <option value="note">Teacher Note</option>
                </select>
              </Field>
              <Field label="Role">
                <select value={filters.role} onChange={(event) => changeFilter('role', event.target.value)} className={inputClass}>
                  <option value="">Any</option>
                  <option value="super-admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </Field>
              <Field label="Sort">
                <select value={filters.sort} onChange={(event) => changeFilter('sort', event.target.value)} className={inputClass}>
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {filterRows.map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={filters[key]}
                    onChange={(event) => changeFilter(key, event.target.value)}
                    className={inputClass}
                    type={key === 'uploadDate' ? 'date' : 'text'}
                    placeholder={label}
                  />
                </Field>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Field label="Date From">
                <input value={filters.dateFrom} onChange={(event) => changeFilter('dateFrom', event.target.value)} className={inputClass} type="date" />
              </Field>
              <Field label="Date To">
                <input value={filters.dateTo} onChange={(event) => changeFilter('dateTo', event.target.value)} className={inputClass} type="date" />
              </Field>
              <Field label="Completed Topic">
                <select value={filters.completedTopic} onChange={(event) => changeFilter('completedTopic', event.target.value)} className={inputClass}>
                  <option value="">Any</option>
                  <option value="true">Completed only</option>
                  <option value="false">Include upcoming</option>
                </select>
              </Field>
              <div className="flex items-end">
                <Button variant="ghost" className="min-h-11" onClick={clearFilters}>
                  <FiX />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_21rem]">
        <div className="space-y-5">
          {isLoading ? <Loader label="Searching" /> : null}
          {!isLoading && !result ? (
            <EmptyState title="Start searching" description="Use the global search box to find resources you are allowed to access." />
          ) : null}
          {!isLoading && result?.total === 0 ? (
            <EmptyState title="No results found" description="Try a broader keyword or remove a filter." />
          ) : null}
          {!isLoading && result?.total > 0 ? (
            <>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold text-muted">
                  {result.total} results for <span className="text-ink">{result.query}</span>
                </p>
                <p className="text-xs font-semibold uppercase text-muted">
                  Page {result.page}
                </p>
              </div>
              {Object.entries(result.groups).map(([category, items]) => (
                <Card key={category} className="p-5">
                  <h2 className="text-lg font-bold capitalize text-ink">{category.replaceAll('_', ' ')}</h2>
                  <div className="mt-4 grid gap-3">
                    {items.map((item) => (
                      <article key={`${category}-${item.id}`} className="rounded-2xl border border-line p-4 transition hover:border-orange-200 hover:shadow-soft">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-ink">{highlight(item.title, result.query)}</h3>
                              <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold capitalize text-primary">
                                {item.category?.replaceAll('_', ' ')}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted">
                              {highlight(item.description, result.query)}
                            </p>
                            <p className="mt-2 text-xs text-muted">
                              Owner: {item.owner || 'System'} - Created{' '}
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'} - Updated{' '}
                              {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <Link to={item.actionUrl || '/app'}>
                            <Button variant="secondary">Open</Button>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </Card>
              ))}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  disabled={filters.page <= 1}
                  onClick={() => changeFilter('page', Math.max(1, filters.page - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={result.page * result.limit >= result.total}
                  onClick={() => changeFilter('page', filters.page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-bold text-ink">Saved Searches</h2>
            <div className="mt-4 space-y-2">
              {saved.map((item) => (
                <div key={item.id} className="rounded-xl bg-page p-3 text-sm">
                  <button type="button" className="block w-full text-left font-semibold text-ink" onClick={() => loadSaved(item)}>
                    {item.isPinned ? 'Pinned: ' : ''}
                    {item.name}
                  </button>
                  <p className="mt-1 text-xs text-muted">{item.searchTerm}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="rounded-lg p-2 text-primary hover:bg-orange-50" onClick={() => togglePin(item)} aria-label="Pin saved search">
                      <FiStar />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-muted hover:bg-white" onClick={() => renameSaved(item)} aria-label="Rename saved search">
                      <FiEdit3 />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        setError('');
                        try {
                          await searchService.deleteSaved(item.id);
                          await reloadSaved();
                        } catch (apiError) {
                          setError(apiError.response?.data?.message || 'Delete saved search failed.');
                        }
                      }}
                      aria-label="Delete saved search"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              {!saved.length ? <p className="text-sm text-muted">No saved searches yet.</p> : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-ink">Recent Searches</h2>
              <Button
                variant="ghost"
                className="min-h-9 px-2"
                onClick={async () => {
                  setError('');
                  try {
                    await searchService.clearHistory();
                    setHistory([]);
                  } catch (apiError) {
                    setError(apiError.response?.data?.message || 'Clear history failed.');
                  }
                }}
              >
                Clear
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {history.slice(0, 8).map((item) => (
                <button key={item.id} type="button" className="block w-full rounded-xl bg-page p-3 text-left text-sm" onClick={() => setQuery(item.searchTerm)}>
                  <span className="font-semibold text-ink">{item.searchTerm}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {item.searchCategory || 'All'} - {item.resultCount} results
                  </span>
                </button>
              ))}
              {!history.length ? <p className="text-sm text-muted">No recent searches.</p> : null}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-ink">Popular Searches</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(suggestions.popularSearches || []).map((item) => (
                <button key={item.searchTerm} type="button" className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-primary hover:text-primary" onClick={() => setQuery(item.searchTerm)}>
                  {item.searchTerm}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
