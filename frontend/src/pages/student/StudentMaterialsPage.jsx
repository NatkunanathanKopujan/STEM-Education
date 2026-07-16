import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { studentLearningService } from '../../services/studentLearningService';

export function StudentMaterialsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await studentLearningService.listMaterials());
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load learning materials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = Object.values(item).join(' ').toLowerCase().includes(normalized);
      const matchesFilter = filter === 'All' || item.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, items, query]);

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
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search materials" /><SelectBox value={filter} onChange={(e) => setFilter(e.target.value)} options={[{ label: 'All Types', value: 'All' }, { label: 'PDF', value: 'PDF' }, { label: 'PPT', value: 'PPT' }, { label: 'DOC', value: 'DOC' }, { label: 'ZIP', value: 'ZIP' }, { label: 'IMAGE', value: 'IMAGE' }]} /></div></Card>
      {error ? <Card className="p-5 text-sm text-red-600">{error}</Card> : null}
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Title', 'Teacher', 'Week', 'Topic', 'Type', 'Upload Date', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>Loading materials...</td></tr> : null}{!loading && filteredItems.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.teacher}</td><td className="px-4 py-3">{item.week}</td><td className="px-4 py-3 text-muted">{item.topic}</td><td className="px-4 py-3">{item.type}</td><td className="px-4 py-3 text-muted">{item.uploadDate}</td><td className="px-4 py-3"><div className="flex gap-2"><Button variant="secondary" onClick={() => previewFile(item.id)}>Preview</Button><Button onClick={() => downloadFile(item)}>Download</Button></div></td></tr>)}{!loading && !filteredItems.length ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>No learning materials found in the database.</td></tr> : null}</tbody></table></div></Card>
    </div>
  );
}
