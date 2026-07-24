import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { TeacherStatCard } from '../../components/teacher/TeacherStatCard';
import { ErrorAlert } from '../../components/ui/Alerts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { teacherLearningService } from '../../services/teacherLearningService';
import { countAxisDomain, getChartColor } from '../../utils/chartTheme';

function formatActivityDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState({ stats: [], weeklyAnalytics: [], announcements: [], activity: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await teacherLearningService.getDashboard());
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader eyebrow="Teacher" title="Teacher Dashboard" description="Manage learning content, weekly plans, completed topics, student progress, and AI quiz-ready resources." />
        <Button variant="secondary" onClick={loadDashboard} isLoading={loading}>
          Refresh
        </Button>
      </div>
      <ErrorAlert message={error} />
      {loading ? <Card className="p-5 text-sm text-muted">Loading teacher dashboard...</Card> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboard.stats.map((stat) => <TeacherStatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Quiz Attempts</h2>
          <div className="mt-5 h-80">
            {dashboard.weeklyAnalytics.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.weeklyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="weekNo" />
                  <YAxis allowDecimals={false} domain={countAxisDomain} />
                  <Tooltip />
                  <Bar dataKey="quizAttempts" fill={getChartColor(2)} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line bg-page text-sm font-medium text-muted">
                No quiz attempt data available yet.
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{dashboard.announcements.slice(0, 3).map((item) => <p key={item.id} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item.title}</p>)}{!dashboard.announcements.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No announcements published yet.</p> : null}</div></Card>
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Student Activity</h2><div className="mt-4 space-y-3">{dashboard.activity.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl bg-page p-3 text-sm"><p className="font-semibold text-ink">{item.studentName} completed Quiz {item.quizNumber}</p><p className="mt-1 text-muted">{item.subject} - {item.percentage}% {item.passStatus ? `(${item.passStatus})` : ''}</p><p className="mt-1 text-xs text-muted">{formatActivityDate(item.activityDate)}</p></div>)}{!dashboard.activity.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No graded quiz activity yet.</p> : null}</div></Card>
        </div>
      </div>
    </div>
  );
}
