import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { TeacherStatCard } from '../../components/teacher/TeacherStatCard';
import { Card } from '../../components/ui/Card';
import { quizAnalytics, teacherNotifications, teacherStats } from '../../data/teacherData';

export function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Teacher Dashboard" description="Manage learning content, weekly plans, completed topics, student progress, and AI quiz-ready resources." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{teacherStats.map((stat) => <TeacherStatCard key={stat.title} {...stat} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Quiz Attempts</h2>
          <div className="mt-5 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={quizAnalytics}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Bar dataKey="attempts" fill="#F97316" /></BarChart></ResponsiveContainer></div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Announcements</h2><div className="mt-4 space-y-3">{teacherNotifications.slice(0, 3).map((item) => <p key={item} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">{item}</p>)}</div></Card>
          <Card className="p-5"><h2 className="text-lg font-bold text-ink">Recent Student Activity</h2><div className="mt-4 space-y-3">{['Maya completed Quiz 3', 'Leo submitted Assignment 2', 'Owen viewed HTML Forms'].map((item) => <p key={item} className="rounded-xl bg-page p-3 text-sm text-muted">{item}</p>)}</div></Card>
        </div>
      </div>
    </div>
  );
}
