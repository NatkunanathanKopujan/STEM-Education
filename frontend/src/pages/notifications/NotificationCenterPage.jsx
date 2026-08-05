import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog } from '../../components/ui/Modal';
import { NotificationList } from '../../components/notifications/NotificationList';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

const pageSize = 20;

const initialFilters = {
  search: '',
  type: '',
  readStatus: '',
  priority: '',
  sort: 'unreadFirst',
  offset: 0,
};

function isNotFoundError(apiError) {
  return apiError.response?.status === 404;
}

export function NotificationCenterPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    unreadCount: 0,
    readCount: 0,
    totalCount: 0,
    todayCount: 0,
    notifications: [],
    total: 0,
    limit: pageSize,
    offset: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedUnreadIds = useMemo(
    () =>
      data.notifications
        .filter((notification) => selectedIds.includes(notification.id) && !notification.isRead)
        .map((notification) => notification.id),
    [data.notifications, selectedIds],
  );
  const selectedReadIds = useMemo(
    () =>
      data.notifications
        .filter((notification) => selectedIds.includes(notification.id) && notification.isRead)
        .map((notification) => notification.id),
    [data.notifications, selectedIds],
  );

  const currentPage = Math.floor((data.offset || 0) / (data.limit || pageSize)) + 1;
  const totalPages = Math.max(Math.ceil((data.total || 0) / (data.limit || pageSize)), 1);

  const loadNotifications = useCallback(async (nextFilters, { clampPage = false } = {}) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await notificationService.getNotifications({
        ...nextFilters,
        limit: pageSize,
      });

      if (
        clampPage &&
        Number(nextFilters?.offset || 0) > 0 &&
        !result.notifications?.length &&
        Number(result.total || 0) > 0
      ) {
        const lastOffset = Math.max(Math.ceil(Number(result.total || 0) / pageSize) - 1, 0) * pageSize;
        const clampedFilters = { ...nextFilters, offset: lastOffset };
        setFilters(clampedFilters);
        const clampedResult = await notificationService.getNotifications({
          ...clampedFilters,
          limit: pageSize,
        });
        setData(clampedResult);
        setSelectedIds([]);
        return;
      }

      setData(result);
      setSelectedIds([]);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilters(initialFilters);
    setSelectedIds([]);
    setMessage('');
    loadNotifications(initialFilters);
  }, [loadNotifications, user?.id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications(filters, { clampPage: true });
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [filters, loadNotifications]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, offset: 0 }));
  };

  const applyFilters = () => loadNotifications({ ...filters, offset: 0 });

  const resetFilters = () => {
    setFilters(initialFilters);
    loadNotifications(initialFilters);
  };

  const goToPage = (direction) => {
    const nextOffset = Math.max(Number(data.offset || 0) + direction * pageSize, 0);
    const nextFilters = { ...filters, offset: nextOffset };
    setFilters(nextFilters);
    loadNotifications(nextFilters);
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === data.notifications.length ? [] : data.notifications.map((notification) => notification.id),
    );
  };

  const handleRead = async (ids, nextReadState = true) => {
    setError('');
    setMessage('');
    try {
      if (nextReadState) {
        await notificationService.markRead(ids);
        setMessage(ids.length === 1 ? 'Notification marked as read.' : 'Notifications marked as read.');
      } else {
        await notificationService.markUnread(ids);
        setMessage(ids.length === 1 ? 'Notification marked as unread.' : 'Notifications marked as unread.');
      }
      await loadNotifications(filters, { clampPage: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update notification status.');
    }
  };

  const handleBulkRead = async () => {
    if (!selectedUnreadIds.length) return;
    await handleRead(selectedUnreadIds);
  };

  const handleBulkUnread = async () => {
    if (!selectedReadIds.length) return;
    await handleRead(selectedReadIds, false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setMessage('');
    try {
      await notificationService.deleteNotification(deleteTarget.id);
      setData((current) => ({
        ...current,
        unreadCount: !deleteTarget.isRead ? Math.max(Number(current.unreadCount || 0) - 1, 0) : current.unreadCount,
        total: Math.max(Number(current.total || 0) - 1, 0),
        notifications: current.notifications.filter((notification) => notification.id !== deleteTarget.id),
      }));
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== deleteTarget.id));
      setMessage('Notification deleted.');
      setDeleteTarget(null);
      await loadNotifications(filters, { clampPage: true });
    } catch (apiError) {
      if (isNotFoundError(apiError)) {
        setData((current) => ({
          ...current,
          total: Math.max(Number(current.total || 0) - 1, 0),
          notifications: current.notifications.filter((notification) => notification.id !== deleteTarget.id),
        }));
        setSelectedIds((current) => current.filter((selectedId) => selectedId !== deleteTarget.id));
        setMessage('Notification was already removed.');
        setDeleteTarget(null);
        await loadNotifications(filters, { clampPage: true });
        return;
      }
      setError(apiError.response?.data?.message || 'Unable to delete notification.');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setError('');
    setMessage('');
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => notificationService.deleteNotification(id)),
      );
      const failed = results.filter((result) => result.status === 'rejected' && !isNotFoundError(result.reason));

      if (failed.length) {
        throw failed[0].reason;
      }

      setMessage(`${selectedIds.length} notification${selectedIds.length === 1 ? '' : 's'} deleted.`);
      setBulkDeleteOpen(false);
      await loadNotifications(filters, { clampPage: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to delete selected notifications.');
    }
  };

  const handleMarkAllRead = async () => {
    setError('');
    setMessage('');
    try {
      await notificationService.markAllRead();
      setMessage('All notifications marked as read.');
      await loadNotifications(filters);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to mark all notifications as read.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Notification Center"
        description="Review account notifications, unread status, priority alerts, and role-based updates."
      />

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{data.unreadCount}</p>
          <p className="text-sm text-muted">Unread Notifications</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{data.readCount || 0}</p>
          <p className="text-sm text-muted">Read Notifications</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{data.totalCount || 0}</p>
          <p className="text-sm text-muted">Total Notifications</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{data.total || 0}</p>
          <p className="text-sm text-muted">Matching Notifications</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{data.todayCount || 0}</p>
          <p className="text-sm text-muted">Today</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{selectedIds.length}</p>
          <p className="text-sm text-muted">Selected</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_repeat(4,12rem)_auto_auto]">
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search notifications"
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          />
          <select
            value={filters.type}
            onChange={(event) => updateFilter('type', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            <option value="system">System</option>
            <option value="academic">Academic</option>
            <option value="quiz">Quiz</option>
            <option value="material">Material</option>
            <option value="announcement">Announcement</option>
            <option value="security">Security</option>
            <option value="reminder">Reminder</option>
          </select>
          <select
            value={filters.readStatus}
            onChange={(event) => updateFilter('readStatus', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={filters.priority}
            onChange={(event) => updateFilter('priority', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
          </select>
          <select
            value={filters.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          >
            <option value="unreadFirst">Unread First</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority First</option>
          </select>
          <Button onClick={applyFilters}>Filter</Button>
          <Button variant="secondary" onClick={resetFilters}>Reset</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={Boolean(data.notifications.length) && selectedIds.length === data.notifications.length}
                onChange={toggleSelectAll}
                className="size-4 rounded border-line text-primary"
              />
              Select page
            </label>
            <Button variant="secondary" disabled={!selectedUnreadIds.length} onClick={handleBulkRead}>
              Mark Selected Read
            </Button>
            <Button variant="secondary" disabled={!selectedReadIds.length} onClick={handleBulkUnread}>
              Mark Selected Unread
            </Button>
            <Button variant="secondary" disabled={!selectedIds.length} onClick={() => setBulkDeleteOpen(true)}>
              Delete Selected
            </Button>
            <Button variant="secondary" disabled={!data.unreadCount} onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          </div>
          <Button variant="secondary" onClick={() => loadNotifications(filters)}>
            <FiRefreshCw />
            Refresh
          </Button>
        </div>
      </Card>

      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      {isLoading ? (
        <Loader label="Loading notifications" />
      ) : error && !data.notifications.length ? (
        <EmptyState title="Notifications unavailable" description="Refresh the page or try another filter." />
      ) : (
        <NotificationList
          notifications={data.notifications}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onRead={handleRead}
          onDelete={(id) => setDeleteTarget(data.notifications.find((notification) => notification.id === id))}
        />
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" disabled={currentPage <= 1 || isLoading} onClick={() => goToPage(-1)}>
          Previous
        </Button>
        <span className="text-sm font-semibold text-muted">Page {currentPage} of {totalPages}</span>
        <Button variant="secondary" disabled={currentPage >= totalPages || isLoading} onClick={() => goToPage(1)}>
          Next
        </Button>
      </div>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete notification"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmationDialog
        open={bulkDeleteOpen}
        title="Delete selected notifications"
        message={`Delete ${selectedIds.length} selected notification${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
