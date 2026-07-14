import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { completedTopics } from '../../data/teacherData';

export function CompletedTopicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Completed Topics" description="Only topics manually marked Completed are made available to the future AI Quiz Engine. Upcoming topics are excluded." />
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Week', 'Topic', 'Status', 'AI Quiz Eligibility', 'Action'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{completedTopics.map((topic) => <tr key={topic.id}><td className="px-4 py-3">Week {topic.week}</td><td className="px-4 py-3 font-semibold text-ink">{topic.topic}</td><td className="px-4 py-3"><StatusBadge status={topic.status} /></td><td className="px-4 py-3 text-muted">{topic.aiQuizEligible ? 'Available for AI quiz preparation' : 'Never included in quizzes'}</td><td className="px-4 py-3"><Button variant={topic.status === 'Completed' ? 'secondary' : 'primary'}>{topic.status === 'Completed' ? 'Completed' : 'Mark Completed'}</Button></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
