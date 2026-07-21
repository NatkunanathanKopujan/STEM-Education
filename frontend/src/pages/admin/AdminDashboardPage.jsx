import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/Alerts';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { dashboardService } from '../../services/dashboardService';

const toAdminStats = (counts = {}) => [
  { title: 'Teacher Registrations', count: counts.teachers || 0, trend: 'Active Live DB' },
  { title: 'Student Registrations', count: counts.students || 0, trend: 'Active Live DB' },
  { title: 'Total Curriculums', count: counts.curriculums || 0, trend: 'Live DB' },
  { title: 'Subjects', count: counts.subjects || 0, trend: 'Live DB' },
  { title: 'Learning Materials', count: counts.materials || 0, trend: 'Live DB' },
  { title: 'Quiz Attempts', count: counts.quizAttempts || 0, trend: 'Live DB' },
];

function formatActivityTime(value) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function activityLabel(action = '') {
  return action
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');
    try {
      setData(await dashboardService.summary());
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const intervalId = window.setInterval(() => loadDashboard({ silent: true }), 30000);
    const refreshOnDataChange = () => loadDashboard({ silent: true });
    window.addEventListener('lms:data-changed', refreshOnDataChange);
    window.addEventListener('focus', refreshOnDataChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('lms:data-changed', refreshOnDataChange);
      window.removeEventListener('focus', refreshOnDataChange);
    };
  }, [loadDashboard]);

  const stats = useMemo(() => toAdminStats(data?.counts), [data]);

  if (isLoading) {
    return <Loader label="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" eyebrow="Admin" description="Manage teachers, students, curriculums, and academic operations from live database records." />
      <ErrorAlert message={error} />
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
                  <Legend />
                  <Bar dataKey="teachers" name="Teachers" fill="#2563EB" />
                  <Bar dataKey="students" name="Students" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No registration data" description="Create teachers and students to populate this chart." />
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Recent Activities</h2>
                <p className="mt-1 text-xs text-muted">Newest admin activities from the audit log.</p>
              </div>
              <Button variant="secondary" className="min-h-9 px-3" disabled={isRefreshing} onClick={() => loadDashboard({ silent: true })}>
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recentActivities?.map((item) => (
                <article key={item.id || `${item.module}-${item.action}-${item.createdAt}`} className="rounded-xl border border-line bg-page p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{item.description || `${item.module}: ${activityLabel(item.action)}`}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.userName || 'System'} {item.role ? `(${activityLabel(item.role)})` : ''} - {formatActivityTime(item.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={item.status === 'failed' ? 'Danger' : 'Success'} />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase text-muted">
                    {item.module || 'system'} - {activityLabel(item.action)}
                  </p>
                </article>
              ))}
              {!data?.recentActivities?.length ? (
                <EmptyState title="No recent activities available" description="Admin activity will appear here after successful system actions." />
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-ink">Announcements</h2>
            <div className="mt-4 space-y-3">
              {data?.announcements?.map((item) => (
                <p key={`${item.title}-${item.createdAt}`} className="rounded-xl bg-orange-50 p-3 text-sm font-semibold text-primary">
                  {item.title}
                </p>
              ))}
              {!data?.announcements?.length ? (
                <EmptyState title="No announcements" description="Published announcements will appear here." />
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
