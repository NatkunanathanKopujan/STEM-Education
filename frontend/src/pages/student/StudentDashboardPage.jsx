import { Link } from 'react-router-dom';
import { StudentStatCard } from '../../components/student/StudentStatCard';
import { ProgressBar } from '../../components/student/ProgressBar';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentAnnouncements, studentMaterials, studentOverview, studentStats, upcomingActivities } from '../../data/studentData';
import { useAuth } from '../../hooks/useAuth';

export function StudentDashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {user?.fullName || user?.name || 'Student'}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-orange-50">
          Continue your {studentOverview.curriculum} learning journey. Current topic: {studentOverview.currentWeekTopic}.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/student/ai-quiz"><Button className="bg-white text-primary hover:from-white hover:to-orange-50">Start AI Quiz</Button></Link>
          <Link to="/student/materials"><Button variant="secondary" className="border-white bg-primary text-white hover:bg-white hover:text-primary">View Materials</Button></Link>
        </div>
      </Card>
      <PageHeader eyebrow="Student" title="Dashboard" description="Track learning progress, recent content, announcements, quiz results, and upcoming activities." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{studentStats.map((stat) => <StudentStatCard key={stat.title} {...stat} suffix={stat.title.includes('Percentage') || stat.title.includes('Performance') ? '%' : ''} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Learning Progress</h2><div className="mt-5 space-y-5"><ProgressBar label="Overall Progress" value={studentOverview.progress} /><ProgressBar label="Quiz Performance" value={86} /><ProgressBar label="Completed Topics" value={72} /></div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Latest Quiz Result</h2><p className="mt-5 text-5xl font-bold text-primary">{studentOverview.latestQuizResult}</p><p className="mt-2 text-sm text-muted">Latest AI quiz assessment result</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{studentAnnouncements.slice(0, 2).map((item) => <p key={item.id} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item.title}</p>)}</div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Learning Materials</h2><div className="mt-4 space-y-3">{studentMaterials.slice(0, 2).map((item) => <p key={item.id} className="rounded-xl bg-page p-3 text-sm text-muted">{item.title}</p>)}</div></Card>
        <Card className="p-5"><h2 className="text-lg font-bold text-ink">Upcoming Activities</h2><div className="mt-4 space-y-3">{upcomingActivities.map((item) => <p key={item} className="rounded-xl bg-page p-3 text-sm text-muted">{item}</p>)}</div></Card>
      </div>
    </div>
  );
}
