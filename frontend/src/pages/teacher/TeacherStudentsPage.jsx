import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { teacherLearningService } from '../../services/teacherLearningService';

export function TeacherStudentsPage() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      setStudents(await teacherLearningService.listStudents());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const curriculums = useMemo(
    () => ['All', ...new Set(students.map((student) => student.curriculum).filter(Boolean))],
    [students],
  );

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesQuery = Object.values(student).join(' ').toLowerCase().includes(normalized);
      const matchesFilter = filter === 'All' || student.curriculum === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, students]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="My Students" description="View assigned students, quiz history, marks, and profiles." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><SearchBar value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" /><SelectBox value={filter} onChange={(e) => setFilter(e.target.value)} options={curriculums.map((value) => ({ label: value === 'All' ? 'All Curriculums' : value, value }))} /></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Student ID', 'Student Name', 'Curriculum', 'Batch', 'Status', 'Quiz History', 'Marks', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={8}>Loading students...</td></tr> : null}{!loading && filteredStudents.map((student) => <tr key={student.id} className="hover:bg-orange-50/40"><td className="px-4 py-3 text-muted">{student.studentId}</td><td className="px-4 py-3 font-semibold text-ink">{student.name}</td><td className="px-4 py-3 text-muted">{student.curriculum}</td><td className="px-4 py-3 text-muted">{student.batch}</td><td className="px-4 py-3"><StatusBadge status={student.status} /></td><td className="px-4 py-3 text-muted">{student.quizAttempts} attempts</td><td className="px-4 py-3 text-muted">{student.average}% avg</td><td className="px-4 py-3"><Button variant="secondary">Profile</Button></td></tr>)}{!loading && !filteredStudents.length ? <tr><td className="px-4 py-6 text-muted" colSpan={8}>No student performance records found.</td></tr> : null}</tbody></table></div></Card>
    </div>
  );
}
