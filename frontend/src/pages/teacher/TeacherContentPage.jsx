import { useState } from 'react';
import { ContentForm } from '../../components/teacher/ContentForm';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { announcements, learningMaterials, teacherNotes, videos } from '../../data/teacherData';
import { useTeacherCollection } from '../../hooks/useTeacherCollection';

const sources = { material: learningMaterials, video: videos, note: teacherNotes, announcement: announcements };
const titles = { material: 'Learning Materials', video: 'Videos', note: 'Teacher Notes', announcement: 'Announcements' };

export function TeacherContentPage({ type = 'material' }) {
  const state = useTeacherCollection(sources[type]);
  const [open, setOpen] = useState(false);
  const title = titles[type];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title={title} description="Create and organize learning content used later by the AI Quiz Engine. Only completed-topic resources become quiz eligible." actionLabel={`Create ${title.slice(0, -1)}`} onAction={() => setOpen(true)} />
      <Card className="p-5"><SearchBar value={state.query} onChange={(e) => state.setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Title', 'Topic', 'Week/Target', 'Type', 'Status', 'AI Prep', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{state.filteredItems.map((item) => <tr key={item.id} className="hover:bg-orange-50/40"><td className="px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.topic || item.target}</td><td className="px-4 py-3 text-muted">{item.week || item.publishDate}</td><td className="px-4 py-3 text-muted">{item.type || item.visibility || 'Note'}</td><td className="px-4 py-3"><StatusBadge status={item.status} /></td><td className="px-4 py-3 text-muted">{item.status === 'Published' ? 'Stored for completed-topic matching' : 'Draft excluded'}</td><td className="px-4 py-3"><Button variant="secondary">View</Button></td></tr>)}</tbody></table></div></Card>
      <Modal open={open} title={`Create ${title}`} onClose={() => setOpen(false)}><ContentForm type={type} onCancel={() => setOpen(false)} onSubmit={(values) => { state.addItem({ ...values, aiReady: values.status === 'Published' }); setOpen(false); }} /></Modal>
    </div>
  );
}
