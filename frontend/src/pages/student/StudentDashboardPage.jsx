import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentStatCard } from '../../components/student/StudentStatCard';
import { ProgressBar } from '../../components/student/ProgressBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { studentLearningService } from '../../services/studentLearningService';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [dashboard, setDashboard] = useState({
    materials: [],
    stats: [],
    latestQuizResult: 'No result yet',
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadRecentAnnouncements = useCallback(async () => {
    try {
      const data = await notificationService.getAnnouncements({ limit: 2 });
      setRecentAnnouncements(data.announcements || []);
    } catch {
      setRecentAnnouncements([]);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await studentLearningService.getDashboard());
    } catch {
      setDashboard({
        materials: [],
        stats: [],
        latestQuizResult: 'No result yet',
        progress: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentAnnouncements();
    loadDashboard();
  }, [loadDashboard, loadRecentAnnouncements]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {user?.fullName || user?.name || 'Student'}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
          Continue your learning journey with the latest materials, announcements, and quiz progress from the database.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/student/ai-quiz"><Button className="bg-white text-primary hover:bg-slate-100">Start AI Quiz</Button></Link>
          <Link to="/student/materials"><Button variant="secondary" className="border-white bg-primary text-white hover:bg-white hover:text-primary">View Materials</Button></Link>
        </div>
      </Card>
      <PageHeader eyebrow="Student" title="Dashboard" description="Track learning progress, recent content, announcements, quiz results, and upcoming activities." />
      {loading ? <Card className="p-5 text-sm text-muted">Loading dashboard...</Card> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboard.stats.map((stat) => <StudentStatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Learning Progress</h2><div className="mt-5 space-y-5"><ProgressBar label="Quiz Performance" value={dashboard.progress} /><ProgressBar label="Available Materials" value={Math.min(dashboard.materials.length * 10, 100)} /></div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Latest Quiz Result</h2><p className="mt-5 text-5xl font-bold text-primary">{dashboard.latestQuizResult}</p><p className="mt-2 text-sm text-muted">Latest AI quiz assessment result</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{recentAnnouncements.map((item) => <p key={item.id} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item.title}</p>)}{!recentAnnouncements.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No announcements published yet.</p> : null}</div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Learning Materials</h2><div className="mt-4 space-y-3">{dashboard.materials.slice(0, 2).map((item) => <p key={item.id} className="rounded-xl bg-page p-3 text-sm text-muted">{item.title}</p>)}{!dashboard.materials.length ? <p className="rounded-xl bg-page p-3 text-sm text-muted">No public materials uploaded yet.</p> : null}</div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Upcoming Activities</h2><div className="mt-4 space-y-3"><p className="rounded-xl bg-page p-3 text-sm text-muted">No scheduled activities found.</p></div></Card>
      </div>
    </div>
  );
}
