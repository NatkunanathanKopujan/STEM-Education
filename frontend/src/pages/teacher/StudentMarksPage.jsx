import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { SelectBox } from '../../components/ui/FormControls';
import { SearchBar } from '../../components/ui/SearchBar';
import { marks } from '../../data/teacherData';

export function StudentMarksPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Student Marks" description="View assignment marks, quiz marks, final marks, percentage, attempt counts, and recent quiz results." />
      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><SearchBar placeholder="Search by student" /><SelectBox options={[{ label: 'All Curriculums', value: 'All' }, { label: 'Computer Science', value: 'Computer Science' }, { label: 'Data Science', value: 'Data Science' }]} /></div></Card>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Student', 'Curriculum', 'Assignment Marks', 'Quiz Marks', 'Final Marks', 'Percentage', 'Quiz Attempts'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{marks.map((mark) => <tr key={mark.id}><td className="px-4 py-3 font-semibold text-ink">{mark.student}</td><td className="px-4 py-3 text-muted">{mark.curriculum}</td><td className="px-4 py-3">{mark.assignment}</td><td className="px-4 py-3">{mark.quiz}</td><td className="px-4 py-3">{mark.final}</td><td className="px-4 py-3 text-primary font-semibold">{mark.final}%</td><td className="px-4 py-3">{mark.attempts}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
