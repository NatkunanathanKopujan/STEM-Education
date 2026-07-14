import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DatePicker, SelectBox } from '../../components/ui/FormControls';
import { Loader } from '../../components/ui/Loader';
import { SearchBar } from '../../components/ui/SearchBar';
import { securityService } from '../../services/securityService';

const moduleOptions = [
  { label: 'All Modules', value: '' },
  { label: 'Authentication', value: 'auth' },
  { label: 'Users', value: 'users' },
  { label: 'Permissions', value: 'permissions' },
  { label: 'Backup', value: 'backup' },
  { label: 'Security', value: 'security' },
  { label: 'Reports', value: 'reports' },
  { label: 'Files', value: 'files' },
  { label: 'AI', value: 'ai' },
];

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Failed', value: 'failed' },
];

const statusLabel = {
  success: 'Success',
  warning: 'Warning',
  failed: 'Danger',
};

const defaultFilters = {
  search: '',
  module: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 15,
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function downloadMetadata(logs) {
  const payload = logs.map((log) => ({
    id: log.id,
    user: log.userName || 'System',
    role: log.role,
    module: log.module,
    action: log.action,
    status: log.status,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [result, setResult] = useState({ logs: [], total: 0, page: 1, limit: 15 });
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = useMemo(
    () => Math.max(Math.ceil((result.total || 0) / (result.limit || 15)), 1),
    [result.limit, result.total],
  );

  const loadLogs = useCallback(async (nextFilters) => {
    setIsLoading(true);
    const data = await securityService.auditLogs(nextFilters);
    setResult(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLogs(defaultFilters);
  }, [loadLogs]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadLogs({ ...filters, page: 1 });
  }

  async function changePage(page) {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await loadLogs(nextFilters);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track authentication, RBAC decisions, user changes, backups, restores, and system actions."
      />

      <Card className="p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_170px_170px_170px_170px_auto]" onSubmit={applyFilters}>
          <SearchBar
            placeholder="Search description, action, module, or user"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <SelectBox
            aria-label="Module"
            options={moduleOptions}
            value={filters.module}
            onChange={(event) => updateFilter('module', event.target.value)}
          />
          <SelectBox
            aria-label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          />
          <DatePicker
            aria-label="Date from"
            value={filters.dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
          <DatePicker
            aria-label="Date to"
            value={filters.dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" className="min-w-24" isLoading={isLoading}>
              <FiRefreshCw />
              Filter
            </Button>
            <Button
              variant="secondary"
              aria-label="Download audit log metadata"
              onClick={() => downloadMetadata(result.logs)}
              disabled={!result.logs.length}
            >
              <FiDownload />
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <Loader label="Loading audit logs" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    {['Action', 'Actor', 'Module', 'Description', 'IP Address', 'Date', 'Status'].map((heading) => (
                      <th key={heading} className="px-4 py-3">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {result.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-orange-50/40">
                      <td className="px-4 py-3 font-semibold text-ink">{log.action}</td>
                      <td className="px-4 py-3 text-muted">{log.userName || 'System'}<span className="block text-xs capitalize">{log.role || '-'}</span></td>
                      <td className="px-4 py-3 text-muted">{log.module}</td>
                      <td className="max-w-md px-4 py-3 text-muted">{log.description}</td>
                      <td className="px-4 py-3 text-muted">{log.ipAddress || '-'}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={statusLabel[log.status] || 'Info'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result.logs.length ? (
              <div className="p-6 text-sm text-muted">No audit logs match the selected filters.</div>
            ) : null}
            <div className="flex flex-col gap-3 border-t border-line p-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Showing page {result.page || filters.page} of {totalPages} across {result.total || 0} events</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={(result.page || 1) <= 1} onClick={() => changePage((result.page || 1) - 1)}>
                  Previous
                </Button>
                <Button variant="secondary" disabled={(result.page || 1) >= totalPages} onClick={() => changePage((result.page || 1) + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
