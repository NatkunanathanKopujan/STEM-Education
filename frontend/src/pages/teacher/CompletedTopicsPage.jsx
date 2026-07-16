import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { teacherLearningService } from '../../services/teacherLearningService';

export function CompletedTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      setTopics(await teacherLearningService.listCompletedTopics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Completed Topics" description="Only topics stored as completed in the database are available to the AI Quiz Engine." />
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-muted"><tr>{['Week', 'Topic', 'Status', 'AI Quiz Eligibility', 'Action'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-line bg-white">{loading ? <tr><td className="px-4 py-6 text-muted" colSpan={5}>Loading completed topics...</td></tr> : null}{!loading && topics.map((topic) => <tr key={topic.id}><td className="px-4 py-3">Week {topic.week}</td><td className="px-4 py-3 font-semibold text-ink">{topic.topic}</td><td className="px-4 py-3"><StatusBadge status={topic.status} /></td><td className="px-4 py-3 text-muted">{topic.aiQuizEligible ? 'Available for AI quiz preparation' : 'No approved questions yet'}</td><td className="px-4 py-3"><Button variant="secondary" disabled>Completed</Button></td></tr>)}{!loading && !topics.length ? <tr><td className="px-4 py-6 text-muted" colSpan={5}>No completed topics found in the database.</td></tr> : null}</tbody></table></div></Card>
    </div>
  );
}
