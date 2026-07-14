import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiAlertTriangle, FiDatabase, FiLock, FiRefreshCw, FiShield, FiUsers } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, DashboardCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { securityService } from '../../services/securityService';

function formatBytes(value = 0) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function SeverityBadge({ value }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${styles[value] || styles.medium}`}>{value}</span>;
}

export function SecurityDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [backups, setBackups] = useState([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const auditChart = useMemo(
    () => overview?.dashboard?.auditSummary || [],
    [overview],
  );

  async function loadSecurity() {
    setIsLoading(true);
    const [dashboardData, backupData] = await Promise.all([
      securityService.dashboard(),
      securityService.backups({ limit: 6 }),
    ]);
    setOverview(dashboardData);
    setBackups(backupData.backups || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadSecurity();
  }, []);

  const runBackup = async () => {
    setIsBackingUp(true);
    const result = await securityService.backup({ backupType: 'manual', backupScope: 'full' });
    setMessage(`Backup ${result.backupId} completed.`);
    setIsBackingUp(false);
    await loadSecurity();
  };

  const runRestoreValidation = async (backupId) => {
    const result = await securityService.restore({ backupId, restoreScope: 'metadata_validation' });
    setMessage(`Restore validation ${result.restoreId} completed.`);
  };

  const unlockUser = async (userId) => {
    await securityService.unlockUser(userId);
    setMessage(`User ${userId} unlocked.`);
    await loadSecurity();
  };

  const auditLogs = (overview?.recentAuditLogs || []).filter((item) =>
    auditFilter ? `${item.action} ${item.module} ${item.description}`.toLowerCase().includes(auditFilter.toLowerCase()) : true,
  );

  if (isLoading) {
    return <Loader label="Loading security dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Enterprise Security"
        title="Security, Audit & Recovery"
        description="Monitor authentication, RBAC, alerts, backups, restore readiness, and system health."
      />
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Open Alerts" value={overview.dashboard.openAlerts} icon={FiAlertTriangle} />
        <DashboardCard title="Failed Logins 24h" value={overview.dashboard.failedLogins24h} icon={FiLock} />
        <DashboardCard title="Active Users" value={overview.dashboard.activeUsers} icon={FiUsers} />
        <DashboardCard title="Storage Used" value={formatBytes(overview.dashboard.storage?.storageUsed)} icon={FiDatabase} />
        <DashboardCard title="Health" value={overview.health.status} icon={FiShield} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Top Security Events</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="module" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Backup & Recovery</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manual backups create an auditable manifest for database, files, configuration, AI question bank, notifications, and user data.
          </p>
          <Button className="mt-4 w-full" isLoading={isBackingUp} onClick={runBackup}>
            <FiDatabase />
            Run Full Backup
          </Button>
          <div className="mt-4 space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">Backup #{backup.id}</p>
                    <p className="text-muted">{backup.backupScope} - {backup.status}</p>
                  </div>
                  <Button variant="secondary" className="min-h-9 px-3" onClick={() => runRestoreValidation(backup.id)}>
                    Validate
                  </Button>
                </div>
              </div>
            ))}
            {!backups.length ? <p className="text-sm text-muted">No backups recorded yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-ink">Recent Security Alerts</h2>
            <Button variant="secondary" className="min-h-9 px-3" onClick={loadSecurity}>
              <FiRefreshCw />
              Refresh
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {overview.recentAlerts.map((alert) => (
              <article key={alert.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted">{alert.description}</p>
                  </div>
                  <SeverityBadge value={alert.severity} />
                </div>
              </article>
            ))}
            {!overview.recentAlerts.length ? <EmptyState title="No active alerts" description="Security alerts will appear here when risk thresholds are crossed." /> : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink">Failed Login Attempts</h2>
          <div className="mt-4 space-y-3">
            {overview.failedLoginAttempts.map((attempt) => (
              <div key={attempt.id} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-ink">{attempt.identifier}</p>
                  <p className="text-sm text-muted">{attempt.failureReason || 'failed'} - {attempt.ipAddress || 'unknown IP'}</p>
                </div>
                {attempt.userId ? (
                  <Button variant="secondary" className="min-h-9 px-3" onClick={() => unlockUser(attempt.userId)}>
                    Unlock
                  </Button>
                ) : null}
              </div>
            ))}
            {!overview.failedLoginAttempts.length ? <p className="text-sm text-muted">No failed attempts in the latest security window.</p> : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-ink">Activity Timeline</h2>
          <input
            value={auditFilter}
            onChange={(event) => setAuditFilter(event.target.value)}
            placeholder="Filter activity"
            className="min-h-11 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-page text-left text-xs uppercase text-muted">
              <tr>
                {['User', 'Role', 'Module', 'Action', 'Status', 'Time'].map((heading) => (
                  <th key={heading} className="px-4 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.userName || 'System'}</td>
                  <td className="px-4 py-3 capitalize">{log.role || '-'}</td>
                  <td className="px-4 py-3">{log.module}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 capitalize">{log.status}</td>
                  <td className="px-4 py-3">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
