import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MaterialHierarchy } from '../../components/learning/MaterialHierarchy';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { studentLearningService } from '../../services/studentLearningService';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Most Downloaded', value: 'mostDownloaded' },
  { label: 'Most Viewed', value: 'mostViewed' },
];

export function StudentNotesPage() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentLearningService.listNotesResult({
        search: query.trim(),
        sort,
        page,
        limit: 20,
      });
      setNotes(data.materials || []);
      setTotal(data.total || 0);
      setLimit(data.limit || 20);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load teacher notes.');
    } finally {
      setLoading(false);
    }
  }, [page, query, sort]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [limit, total]);

  const updateQuery = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const updateSort = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const previewNote = async (id) => {
    const url = await studentLearningService.preview(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadNote = async (note) => {
    const blob = await studentLearningService.download(note.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = note.title;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Teacher Notes" description="Read, search, preview, and download teacher notes stored in the database." />
      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <SearchBar value={query} onChange={updateQuery} placeholder="Search notes, PDF files, topics, subjects, teacher" />
          <SelectBox value={sort} onChange={updateSort} options={sortOptions} />
          <Button variant="secondary" onClick={loadNotes}>Refresh</Button>
        </div>
      </Card>
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      {loading ? <Card className="p-5 text-sm text-muted">Loading notes...</Card> : null}
      {!loading ? (
        <MaterialHierarchy
          items={notes}
          emptyMessage="No public teacher notes found in the database."
          onPreview={previewNote}
          onDownload={downloadNote}
        />
      ) : null}
      {!loading && totalPages > 1 ? (
        <Card className="flex items-center justify-end gap-3 p-4">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</Button>
          <span className="text-sm font-semibold text-muted">Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </Card>
      ) : null}
    </div>
  );
}
