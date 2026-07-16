import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { TeacherStatCard } from '../../components/teacher/TeacherStatCard';
import { Card } from '../../components/ui/Card';
import { teacherLearningService } from '../../services/teacherLearningService';

export function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState({ stats: [], weeklyAnalytics: [], announcements: [], activity: [] });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await teacherLearningService.getDashboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Teacher Dashboard" description="Manage learning content, weekly plans, completed topics, student progress, and AI quiz-ready resources." />
      {loading ? <Card className="p-5 text-sm text-muted">Loading teacher dashboard...</Card> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboard.stats.map((stat) => <TeacherStatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Quiz Attempts</h2>
          <div className="mt-5 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboard.weeklyAnalytics}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="weekNo" /><YAxis /><Tooltip /><Bar dataKey="quizAttempts" fill="#F97316" /></BarChart></ResponsiveContainer></div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{dashboard.announcements.slice(0, 3).map((item) => <p key={item.id} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item.title}</p>)}{!dashboard.announcements.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No announcements published yet.</p> : null}</div></Card>
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Student Activity</h2><div className="mt-4 space-y-3">{dashboard.activity.slice(0, 3).map((item) => <p key={item.studentId} className="rounded-xl bg-page p-3 text-sm text-muted">{item.studentName} average {Math.round(Number(item.averagePercentage || 0))}%</p>)}{!dashboard.activity.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No graded quiz activity yet.</p> : null}</div></Card>
        </div>
      </div>
    </div>
  );
}
