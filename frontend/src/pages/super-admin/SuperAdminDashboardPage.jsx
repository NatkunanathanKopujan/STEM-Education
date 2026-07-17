import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatCard } from '../../components/super-admin/StatCard';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { dashboardService } from '../../services/dashboardService';

const toStats = (counts = {}) => [
  { title: 'Total Admins', count: counts.admins || 0, trend: 'Live DB', icon: 'admins' },
  { title: 'Total Teachers', count: counts.teachers || 0, trend: 'Live DB', icon: 'teachers' },
  { title: 'Total Students', count: counts.students || 0, trend: 'Live DB', icon: 'students' },
  { title: 'Total Curriculums', count: counts.curriculums || 0, trend: 'Live DB', icon: 'curriculums' },
  { title: 'Subjects', count: counts.subjects || 0, trend: 'Live DB', icon: 'materials' },
  { title: 'Learning Materials', count: counts.materials || 0, trend: 'Live DB', icon: 'materials' },
  { title: 'Quiz Attempts', count: counts.quizAttempts || 0, trend: 'Live DB', icon: 'quiz' },
  { title: 'Active Users', count: counts.activeUsers || 0, trend: 'Live DB', icon: 'active' },
  { title: "Today's Logins", count: counts.todaysLogins || 0, trend: 'Live DB', icon: 'logins' },
];

export function SuperAdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadDashboard({ initial = false } = {}) {
      if (initial) {
        setIsLoading(true);
      }
      const summary = await dashboardService.summary();
      if (mounted) {
        setData(summary);
        setIsLoading(false);
      }
    }
    loadDashboard({ initial: true }).catch(() => {
      if (mounted) setIsLoading(false);
    });
    const intervalId = window.setInterval(() => {
      loadDashboard().catch(() => {});
    }, 30000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => toStats(data?.counts), [data]);

  if (isLoading) {
    return <Loader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="Control the entire LMS platform using live database counts."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            <StatCard stat={stat} />
          </motion.div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Monthly User Registrations</h2>
          {data?.monthlyRegistrations?.length ? (
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="students" stroke="#F97316" fill="#FDBA74" />
                  <Area type="monotone" dataKey="teachers" stroke="#2563EB" fill="#BFDBFE" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No registration data" description="New users will appear here after they are created." />
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Account Activity</h2>
          <div className="mt-5 space-y-3">
            {data?.recentActivities?.map((item) => (
              <div key={item.id || `${item.action}-${item.createdAt}`} className="rounded-xl border border-line bg-page p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.description || item.action}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.userName || 'System'}{item.role ? ` - ${item.role}` : ''} - {item.module}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold capitalize text-primary">
                    {item.status || 'success'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
              </div>
            ))}
            {!data?.recentActivities?.length ? (
              <EmptyState title="No account activity" description="Real audit activity will appear here after users perform system actions." />
            ) : null}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Notifications</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data?.notifications?.map((item) => (
            <div key={`${item.title}-${item.createdAt}`} className="rounded-xl border border-line bg-page p-4">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.message}</p>
            </div>
          ))}
          {!data?.notifications?.length ? (
            <EmptyState title="No notifications" description="System notifications will appear here when records are created." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
