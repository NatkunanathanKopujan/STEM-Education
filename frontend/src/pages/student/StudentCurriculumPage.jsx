import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { fileService } from '../../services/fileService';

export function StudentCurriculumPage() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fileService.list({ status: 'active', visibility: 'public', limit: 100 });
      setFiles(data.files || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const curriculums = useMemo(() => {
    const groups = new Map();
    files.forEach((file) => {
      const name = file.curriculum || 'General Curriculum';
      const current = groups.get(name) || { name, subjects: new Set(), topics: new Set(), materials: 0 };
      if (file.subject) current.subjects.add(file.subject);
      if (file.topic) current.topics.add(file.topic);
      current.materials += 1;
      groups.set(name, current);
    });

    const normalized = query.trim().toLowerCase();
    return [...groups.values()]
      .map((item) => ({
        ...item,
        subjects: item.subjects.size,
        topics: item.topics.size,
      }))
      .filter((item) => item.name.toLowerCase().includes(normalized));
  }, [files, query]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="My Curriculum" description="Curriculum coverage is built from published learning materials stored in the database." />
      <Card className="p-5"><SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search curriculums" /></Card>
      {loading ? <Card className="p-5 text-sm text-muted">Loading curriculum records...</Card> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {curriculums.map((item) => (
          <Card key={item.name} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">Published learning content</p>
              </div>
              <StatusBadge status="Active" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.subjects}</p><p className="text-xs text-muted">Subjects</p></div>
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.topics}</p><p className="text-xs text-muted">Topics</p></div>
              <div className="rounded-xl bg-page p-3"><p className="font-bold text-primary">{item.materials}</p><p className="text-xs text-muted">Materials</p></div>
            </div>
          </Card>
        ))}
      </div>
      {!loading && !curriculums.length ? <EmptyState title="No curriculums found" description="Published materials with curriculum metadata will appear here." /> : null}
    </div>
  );
}
