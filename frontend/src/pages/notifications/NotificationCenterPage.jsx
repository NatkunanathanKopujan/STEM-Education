import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { NotificationList } from '../../components/notifications/NotificationList';
import { notificationService } from '../../services/notificationService';

export function NotificationCenterPage() {
  const [data, setData] = useState({ unreadCount: 0, notifications: [] });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async (params = {}) => {
    setIsLoading(true);
    setData(await notificationService.getNotifications(params));
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (ids) => {
    await notificationService.markRead(ids);
    await loadNotifications({ search, type });
  };

  const handleDelete = async (id) => {
    await notificationService.deleteNotification(id);
    await loadNotifications({ search, type });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Notification Center"
        description="Review notification history, unread status, priority alerts, and role-based updates."
      />
      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{data.unreadCount} unread notifications</p>
            <p className="mt-1 text-sm text-muted">Future-ready for Email, SMS, Push, and WebSockets.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
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
            <Button onClick={() => loadNotifications({ search, type })}>Filter</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await notificationService.markAllRead();
                await loadNotifications({ search, type });
              }}
            >
              Mark All Read
            </Button>
          </div>
        </div>
      </Card>
      {isLoading ? (
        <Loader label="Loading notifications" />
      ) : (
        <NotificationList
          notifications={data.notifications}
          onRead={handleRead}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
