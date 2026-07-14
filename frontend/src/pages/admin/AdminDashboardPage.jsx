import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { dashboardService } from '../../services/dashboardService';

const toAdminStats = (counts = {}) => [
  { title: 'Total Teachers', count: counts.teachers || 0, trend: 'Live DB' },
  { title: 'Total Students', count: counts.students || 0, trend: 'Live DB' },
  { title: 'Total Curriculums', count: counts.curriculums || 0, trend: 'Live DB' },
  { title: 'Subjects', count: counts.subjects || 0, trend: 'Live DB' },
  { title: 'Learning Materials', count: counts.materials || 0, trend: 'Live DB' },
  { title: 'Quiz Attempts', count: counts.quizAttempts || 0, trend: 'Live DB' },
];

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardService
      .summary()
      .then((summary) => {
        if (mounted) setData(summary);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => toAdminStats(data?.counts), [data]);

  if (isLoading) {
    return <Loader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" eyebrow="Admin" description="Manage teachers, students, curriculums, and academic operations from live database records." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => <AdminStatCard key={stat.title} {...stat} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Teacher and Student Registrations</h2>
          {data?.monthlyRegistrations?.length ? (
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip />
                  <Bar dataKey="teachers" fill="#2563EB" />
                  <Bar dataKey="students" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No registration data" description="Create teachers and students to populate this chart." />
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-bold text-ink">Recent Activities</h2>
            <div className="mt-4 space-y-3">
              {data?.recentActivities?.map((item) => (
                <p key={`${item.module}-${item.action}-${item.createdAt}`} className="rounded-xl bg-page p-3 text-sm text-muted">
                  {item.description || `${item.module}: ${item.action}`}
                </p>
              ))}
              {!data?.recentActivities?.length ? (
                <EmptyState title="No activity yet" description="Audit activity will appear after real system changes." />
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-ink">Announcements</h2>
            <div className="mt-4 space-y-3">
              {data?.notifications?.map((item) => (
                <p key={`${item.title}-${item.createdAt}`} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">
                  {item.title}
                </p>
              ))}
              {!data?.notifications?.length ? (
                <EmptyState title="No announcements" description="Published announcements will appear here." />
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
