import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { teacherLearningService } from '../../services/teacherLearningService';
import { AnnouncementCenterPage } from '../notifications/AnnouncementCenterPage';

const titles = { material: 'Learning Materials', video: 'Videos', note: 'Teacher Notes', announcement: 'Announcements' };

export function TeacherContentPage({ type = 'material' }) {
  if (type === 'announcement') {
    return <AnnouncementCenterPage />;
  }

  return <TeacherResourceContentPage type={type} />;
}

function TeacherResourceContentPage({ type }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const title = titles[type];

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await teacherLearningService.listContent(type));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => Object.values(item).join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title={title} description="View learning content uploaded to the database. Upload, edit, version, and delete files from File Manager." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} /><Link to="/files"><Button>Upload in File Manager</Button></Link></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Title', 'Topic', 'Week/Target', 'Type', 'Status', 'AI Prep', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>Loading {title.toLowerCase()}...</td></tr> : null}{!loading && filteredItems.map((item) => <tr key={item.id} className="hover:bg-orange-50/40"><td className="px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.topic}</td><td className="px-4 py-3 text-muted">{item.week}</td><td className="px-4 py-3 text-muted">{item.type}</td><td className="px-4 py-3"><StatusBadge status={item.status} /></td><td className="px-4 py-3 text-muted">{item.status === 'Published' ? 'Stored for completed-topic matching' : 'Excluded until published'}</td><td className="px-4 py-3"><Link to="/files"><Button variant="secondary">Manage</Button></Link></td></tr>)}{!loading && !filteredItems.length ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>No records found in the database.</td></tr> : null}</tbody></table></div></Card>
    </div>
  );
}
