import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationList } from './NotificationList';
import { Button } from '../ui/Button';
import { notificationService } from '../../services/notificationService';

export function NotificationPanel({ open, onClose }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ unreadCount: 0, notifications: [] });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isMounted = true;

    async function loadUnread() {
      const response = await notificationService.getUnread();

      if (isMounted) {
        setData(response);
      }
    }

    loadUnread();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const refresh = async () => {
    setData(await notificationService.getUnread());
  };

  const handleRead = async (ids) => {
    await notificationService.markRead(ids);
    await refresh();
  };

  const handleDelete = async (id) => {
    await notificationService.deleteNotification(id);
    await refresh();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="absolute right-4 top-16 z-50 w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink">Notifications</h2>
          <p className="text-xs text-muted">{data.unreadCount} unread</p>
        </div>
        <Button variant="ghost" className="min-h-9 px-3" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto pr-1">
        <NotificationList
          compact
          notifications={data.notifications || []}
          onRead={handleRead}
          onDelete={handleDelete}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          className="flex-1"
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
        >
          View All
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await notificationService.markAllRead();
            await refresh();
          }}
        >
          Mark All Read
        </Button>
      </div>
    </div>
  );
}
