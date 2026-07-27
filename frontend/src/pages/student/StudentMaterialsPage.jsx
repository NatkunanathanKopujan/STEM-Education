import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { studentLearningService } from '../../services/studentLearningService';

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'PDF', value: 'pdf' },
  { label: 'PPT', value: 'ppt' },
  { label: 'Documents', value: 'documents' },
  { label: 'Spreadsheets', value: 'spreadsheets' },
  { label: 'ZIP / Archives', value: 'archives' },
  { label: 'Images', value: 'images' },
  { label: 'Videos', value: 'videos' },
  { label: 'Audio', value: 'audio' },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Most Downloaded', value: 'mostDownloaded' },
  { label: 'Most Viewed', value: 'mostViewed' },
];

export function StudentMaterialsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentLearningService.listMaterialsResult({
        search: query.trim(),
        fileType: filter,
        sort,
        page,
        limit: 20,
      });
      setItems(data.materials || []);
      setTotal(data.total || 0);
      setLimit(data.limit || 20);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load learning materials.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, query, sort]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [limit, total]);

  const updateQuery = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const updateFilter = (event) => {
    setFilter(event.target.value);
    setPage(1);
  };

  const updateSort = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const previewFile = async (id) => {
    const url = await studentLearningService.preview(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = async (item) => {
    const blob = await studentLearningService.download(item.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.title;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Learning Materials" description="View, preview, search, sort, and download PDFs, PPTs, DOCs, ZIP files, and images." />
      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <SearchBar value={query} onChange={updateQuery} placeholder="Search materials, topics, teachers, subjects" />
          <SelectBox value={filter} onChange={updateFilter} options={typeOptions} />
          <SelectBox value={sort} onChange={updateSort} options={sortOptions} />
          <Button variant="secondary" onClick={loadMaterials}>Refresh</Button>
        </div>
      </Card>
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Title', 'Teacher', 'Week', 'Topic', 'Type', 'Upload Date', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>Loading materials...</td></tr> : null}{!loading && items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.teacher}</td><td className="px-4 py-3">{item.week}</td><td className="px-4 py-3 text-muted">{item.topic}</td><td className="px-4 py-3">{item.type}</td><td className="px-4 py-3 text-muted">{item.uploadDate}</td><td className="px-4 py-3"><div className="flex gap-2"><Button variant="secondary" onClick={() => previewFile(item.id)}>Preview</Button><Button onClick={() => downloadFile(item)}>Download</Button></div></td></tr>)}{!loading && !items.length ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>No learning materials found in the database.</td></tr> : null}</tbody></table></div><div className="flex items-center justify-end gap-3 border-t border-line p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</Button><span className="text-sm font-semibold text-muted">Page {page} of {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div></Card>
    </div>
  );
}
