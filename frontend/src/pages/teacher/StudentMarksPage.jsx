import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { teacherLearningService } from '../../services/teacherLearningService';

export function StudentMarksPage() {
  const [marks, setMarks] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadMarks = useCallback(async () => {
    setLoading(true);
    try {
      setMarks(await teacherLearningService.listMarks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  const curriculums = useMemo(() => ['All', ...new Set(marks.map((mark) => mark.curriculum).filter(Boolean))], [marks]);
  const filteredMarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return marks.filter((mark) => {
      const matchesQuery = Object.values(mark).join(' ').toLowerCase().includes(normalized);
      const matchesFilter = filter === 'All' || mark.curriculum === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, marks, query]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Student Marks" description="View assignment marks, quiz marks, final marks, percentage, attempt counts, and recent quiz results." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by student" /><SelectBox value={filter} onChange={(e) => setFilter(e.target.value)} options={curriculums.map((value) => ({ label: value === 'All' ? 'All Curriculums' : value, value }))} /></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Student', 'Curriculum', 'Assignment Marks', 'Quiz Marks', 'Final Marks', 'Percentage', 'Quiz Attempts'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>Loading marks...</td></tr> : null}{!loading && filteredMarks.map((mark) => <tr key={mark.id}><td className="px-4 py-3 font-semibold text-ink">{mark.name}</td><td className="px-4 py-3 text-muted">{mark.curriculum}</td><td className="px-4 py-3">{mark.assignment}</td><td className="px-4 py-3">{mark.quiz}</td><td className="px-4 py-3">{mark.final}</td><td className="px-4 py-3 text-primary font-semibold">{mark.final}%</td><td className="px-4 py-3">{mark.quizAttempts}</td></tr>)}{!loading && !filteredMarks.length ? <tr><td className="px-4 py-6 text-muted" colSpan={7}>No graded quiz marks found.</td></tr> : null}</tbody></table></div></Card>
    </div>
  );
}
