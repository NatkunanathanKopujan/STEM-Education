import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { assignedStudents } from '../../data/teacherData';
import { useTeacherCollection } from '../../hooks/useTeacherCollection';

export function TeacherStudentsPage() {
  const state = useTeacherCollection(assignedStudents);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="My Students" description="View assigned students, quiz history, marks, profiles, and optional password reset actions." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><SearchBar value={state.query} onChange={(e) => state.setQuery(e.target.value)} placeholder="Search students" /><SelectBox value={state.filter} onChange={(e) => state.setFilter(e.target.value)} options={[{ label: 'All Curriculums', value: 'All' }, { label: 'Computer Science', value: 'Computer Science' }, { label: 'Data Science', value: 'Data Science' }]} /></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Student ID', 'Student Name', 'Curriculum', 'Batch', 'Status', 'Quiz History', 'Marks', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{state.filteredItems.map((student) => <tr key={student.id} className="hover:bg-orange-50/40"><td className="px-4 py-3 text-muted">{student.studentId}</td><td className="px-4 py-3 font-semibold text-ink">{student.name}</td><td className="px-4 py-3 text-muted">{student.curriculum}</td><td className="px-4 py-3 text-muted">{student.batch}</td><td className="px-4 py-3"><StatusBadge status={student.status} /></td><td className="px-4 py-3 text-muted">{student.quizAttempts} attempts</td><td className="px-4 py-3 text-muted">{student.average}% avg</td><td className="px-4 py-3"><div className="flex gap-2"><Button variant="secondary">Profile</Button><Button variant="secondary">Reset</Button></div></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
