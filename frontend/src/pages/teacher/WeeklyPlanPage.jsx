import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { teacherLearningService } from '../../services/teacherLearningService';

export function WeeklyPlanPage() {
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
      <PageHeader eyebrow="Teacher" title="Weekly Teaching Plan" description="Weekly progress is shown from completed topics and uploaded learning content stored in the database." />
      {loading ? <Card className="p-5 text-sm text-muted">Loading weekly progress...</Card> : null}
      {!loading && !topics.length ? <Card className="p-5 text-sm text-muted">No weekly completed topics found in the database.</Card> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.id} className="p-5">
            <div className="flex justify-between gap-4"><h2 className="text-lg font-bold text-ink">Week {topic.week}: {topic.topic}</h2><StatusBadge status={topic.status} /></div>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p><span className="font-semibold text-ink">Learning Objectives:</span> Stored from teacher-approved completed topic data.</p>
              <p><span className="font-semibold text-ink">Reference Materials:</span> Published LMS materials from File Manager.</p>
              <p><span className="font-semibold text-ink">AI Eligibility:</span> {topic.aiQuizEligible ? 'Approved questions available' : 'No approved questions yet'}</p>
            </div>
            <div className="mt-5 flex gap-2"><Link to="/files"><Button variant="secondary">Manage Materials</Button></Link><Link to="/teacher/completed-topics"><Button>View Topic</Button></Link></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
