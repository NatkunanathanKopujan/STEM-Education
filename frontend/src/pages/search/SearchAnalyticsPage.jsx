import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { searchService } from '../../services/searchService';

const colors = ['#F97316', '#2563EB', '#16A34A', '#EF4444'];

export function SearchAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const data = await searchService.analytics();
        if (isMounted) setAnalytics(data);
      } catch (apiError) {
        if (isMounted) setError(apiError.response?.data?.message || 'Unable to load search analytics.');
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) return <EmptyState title="Search analytics unavailable" description={error} />;
  if (!analytics) return <Loader label="Loading search analytics" />;

  const totalSearches = analytics.keywords.reduce((total, item) => total + Number(item.searches || 0), 0);
  const noResults = analytics.keywords.reduce((total, item) => total + Number(item.noResultSearches || 0), 0);
  const averageSuccess = analytics.keywords.length
    ? Math.round(
        analytics.keywords.reduce((total, item) => total + Number(item.successRate || 0), 0) /
          analytics.keywords.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Search Analytics"
        description="Monitor most searched keywords, popular categories, no-result searches, success rate, and user search activity."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{totalSearches}</p><p className="text-sm text-muted">Total Searches</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{noResults}</p><p className="text-sm text-muted">No-Result Searches</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink">{averageSuccess}%</p><p className="text-sm text-muted">Average Success Rate</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Most Searched Keywords</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.keywords}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="keyword" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="searches" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">User Search Activity</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.activity} dataKey="searches" nameKey="role" outerRadius={105}>
                  {analytics.activity.map((entry, index) => (
                    <Cell key={entry.role || index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-bold text-ink">Popular Topics & Categories</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Searches</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.topics.map((topic) => (
                <tr key={topic.category || 'uncategorized'}>
                  <td className="px-4 py-3 capitalize">{topic.category || 'all'}</td>
                  <td className="px-4 py-3">{topic.searches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
