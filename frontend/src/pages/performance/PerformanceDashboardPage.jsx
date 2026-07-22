import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiActivity, FiCpu, FiDatabase, FiRefreshCw, FiServer, FiZap } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, DashboardCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { VirtualizedList } from '../../components/ui/VirtualizedList';
import { performanceService } from '../../services/performanceService';
import { countAxisDomain, getChartColor } from '../../utils/chartTheme';

function formatMs(value = 0) {
  return `${Number(value || 0).toLocaleString()} ms`;
}

function formatBytes(value = 0) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function PerformanceDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setIsLoading(true);
    setError('');
    try {
      setDashboard(await performanceService.dashboard());
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load performance metrics.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const statusData = useMemo(
    () =>
      Object.entries(dashboard?.api?.statusBreakdown || {}).map(([status, total]) => ({
        status,
        total,
      })),
    [dashboard],
  );

  const queueData = useMemo(
    () => (dashboard?.queues || []).map((queue) => ({ name: queue.name, ready: queue.ready ? 1 : 0 })),
    [dashboard],
  );

  if (isLoading) {
    return <Loader label="Loading performance metrics" />;
  }

  if (!dashboard) {
    return <EmptyState title="Performance metrics unavailable" description={error || 'Refresh metrics and try again.'} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Optimization"
        title="Performance Dashboard"
        description="Monitor API timing, cache efficiency, runtime usage, storage, AI processing, and background queue readiness."
      />

      <div className="flex justify-end">
        <Button variant="secondary" onClick={loadDashboard}>
          <FiRefreshCw />
          Refresh Metrics
        </Button>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Avg API Response" value={formatMs(dashboard.api.averageResponseTimeMs)} icon={FiZap} />
        <DashboardCard title="Cache Hit Rate" value={`${dashboard.cache.hitRate}%`} icon={FiActivity} />
        <DashboardCard title="Memory RSS" value={`${dashboard.runtime.memoryUsageMb} MB`} icon={FiCpu} />
        <DashboardCard title="Avg AI Time" value={formatMs(dashboard.ai.averageProcessingTimeMs)} icon={FiServer} />
        <DashboardCard title="Storage Used" value={formatBytes(dashboard.storage?.summary?.totalStorageUsed)} icon={FiDatabase} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">API Status Distribution</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} domain={countAxisDomain} />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {statusData.map((item, index) => (
                    <Cell key={item.status || index} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Background Queue Readiness</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={queueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="ready" stroke={getChartColor(1)} strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Slow Requests</h2>
          <div className="mt-4">
            <VirtualizedList
              items={dashboard.api.slowRequests || []}
              itemHeight={74}
              height={360}
              renderItem={(item) => (
                <div className="mx-1 flex h-[66px] items-center justify-between gap-4 rounded-xl border border-line px-4">
                  <div>
                    <p className="font-bold text-ink">{item.method} {item.originalUrl}</p>
                    <p className="text-sm text-muted">Status {item.statusCode} - {new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="font-bold text-primary">{formatMs(item.durationMs)}</span>
                </div>
              )}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Optimization Readiness</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(dashboard.optimization).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-page p-3 text-sm">
                <span className="font-semibold capitalize text-ink">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className={value ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                  {value ? 'Ready' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Runtime & Transfer Metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-page p-4">
            <p className="text-sm text-muted">CPU Load</p>
            <p className="mt-2 text-2xl font-bold text-ink">{dashboard.runtime.cpuLoad}</p>
          </div>
          <div className="rounded-xl bg-page p-4">
            <p className="text-sm text-muted">Heap Used</p>
            <p className="mt-2 text-2xl font-bold text-ink">{dashboard.runtime.heapUsedMb} MB</p>
          </div>
          <div className="rounded-xl bg-page p-4">
            <p className="text-sm text-muted">Avg Upload Speed</p>
            <p className="mt-2 text-2xl font-bold text-ink">{dashboard.files.averageUploadSpeedMbps} MB/s</p>
          </div>
          <div className="rounded-xl bg-page p-4">
            <p className="text-sm text-muted">Avg Download Speed</p>
            <p className="mt-2 text-2xl font-bold text-ink">{dashboard.files.averageDownloadSpeedMbps} MB/s</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
