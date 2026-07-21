import { useEffect, useState } from 'react';
import { FiCpu, FiDollarSign, FiRefreshCw, FiServer, FiZap } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { superAdminService } from '../../services/superAdminService';

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-5 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm font-semibold text-muted">{title}</p>
    </Card>
  );
}

export function AIMonitoringPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAiMonitoring({ keepData = false } = {}) {
    if (!keepData) setIsLoading(true);
    setError('');
    try {
      const [providers, costs, logs] = await Promise.all([
        superAdminService.getAiProviders(),
        superAdminService.getAiCosts(),
        superAdminService.getAiLogs({ limit: 25 }),
      ]);

      setData({ providers, costs, logs });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load AI monitoring data.');
    } finally {
      if (!keepData) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadAiMonitoring();
  }, []);

  if (isLoading) {
    return <Loader label="Loading AI monitoring" />;
  }

  if (error || !data) {
    return <EmptyState title="AI monitoring unavailable" description={error} />;
  }

  const totals = data.costs.totals || {};
  const providers = data.providers.providers || [];
  const providerUsage = data.costs.providers || [];
  const logs = Array.isArray(data.logs) ? data.logs : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Monitoring"
        description="Track active AI providers, request volume, token estimates, cost estimates, and generation logs."
      />
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => loadAiMonitoring({ keepData: true })}>
          <FiRefreshCw />
          Refresh
        </Button>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Requests" value={totals.totalRequests || 0} icon={FiZap} />
        <StatCard title="Daily Requests" value={totals.dailyRequests || 0} icon={FiCpu} />
        <StatCard title="Estimated Tokens" value={totals.estimatedTokenUsage || 0} icon={FiServer} />
        <StatCard title="Estimated Cost" value={`$${Number(totals.estimatedCost || 0).toFixed(4)}`} icon={FiDollarSign} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Providers</h2>
          <div className="mt-5 space-y-3">
            {providers.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between rounded-xl border border-line p-4">
                <div>
                  <p className="font-semibold capitalize text-ink">{provider.name}</p>
                  <p className="text-sm text-muted">{provider.model}</p>
                </div>
                <StatusBadge status={provider.active ? 'Success' : 'Inactive'} />
              </div>
            ))}
            {!providers.length ? (
              <EmptyState title="No AI providers" description="Configured AI providers will appear here." />
            ) : null}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Provider Usage</h2>
          <div className="mt-5 space-y-3">
            {providerUsage.map((provider) => (
              <div key={provider.provider} className="rounded-xl bg-page p-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold capitalize text-ink">{provider.provider}</span>
                  <span className="text-primary">{provider.totalRequests} requests</span>
                </div>
                <p className="mt-2 text-muted">
                  Monthly {provider.monthlyRequests} | Tokens {provider.estimatedTokenUsage} | Cost ${Number(provider.estimatedCost || 0).toFixed(4)}
                </p>
              </div>
            ))}
            {!providerUsage.length ? (
              <EmptyState title="No provider usage" description="AI usage will appear after questions are generated." />
            ) : null}
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-bold text-ink">Recent AI Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                {['Provider', 'Model', 'Topic', 'Generated', 'Saved', 'Rejected', 'Status', 'Created'].map((heading) => (
                  <th key={heading} className="px-4 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 capitalize">{log.provider}</td>
                  <td className="px-4 py-3 text-muted">{log.model}</td>
                  <td className="px-4 py-3">{log.topic || 'General'}</td>
                  <td className="px-4 py-3">{log.questionsGenerated}</td>
                  <td className="px-4 py-3">{log.questionsSaved}</td>
                  <td className="px-4 py-3">{log.questionsRejected}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status === 'success' ? 'Success' : 'Danger'} />
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length ? (
          <div className="p-5">
            <EmptyState title="No AI logs" description="Recent AI generation logs will appear here after AI activity." />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
