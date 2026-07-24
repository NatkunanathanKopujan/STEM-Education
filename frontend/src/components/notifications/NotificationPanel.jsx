import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationList } from './NotificationList';
import { Button } from '../ui/Button';
import { notificationService } from '../../services/notificationService';

export function NotificationPanel({ open, onClose }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ unreadCount: 0, notifications: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isMounted = true;

    async function loadUnread() {
      try {
        const response = await notificationService.getUnread();

        if (isMounted) {
          setData(response);
          setError('');
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.response?.data?.message || 'Unable to load notifications.');
        }
      }
    }

    loadUnread();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const refresh = async () => {
    try {
      setData(await notificationService.getUnread());
      setError('');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to refresh notifications.');
    }
  };

  const handleRead = async (ids) => {
    try {
      await notificationService.markRead(ids);
      await refresh();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to mark notification as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      await refresh();
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        setData((current) => ({
          ...current,
          unreadCount: Math.max(
            Number(current.unreadCount || 0) -
              (current.notifications.find((notification) => notification.id === id && !notification.isRead) ? 1 : 0),
            0,
          ),
          notifications: current.notifications.filter((notification) => notification.id !== id),
        }));
        setError('');
        return;
      }
      setError(apiError.response?.data?.message || 'Unable to delete notification.');
    }
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
        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
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
            try {
              await notificationService.markAllRead();
              await refresh();
            } catch (apiError) {
              setError(apiError.response?.data?.message || 'Unable to mark all notifications as read.');
            }
          }}
        >
          Mark All Read
        </Button>
      </div>
    </div>
  );
}
