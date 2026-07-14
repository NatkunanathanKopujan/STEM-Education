import { FiArrowRight, FiCheck, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

const priorityStyles = {
  urgent: 'border-red-200 bg-red-50 text-red-700',
  important: 'border-amber-200 bg-amber-50 text-amber-700',
  normal: 'border-line bg-white text-muted',
};

export function NotificationList({ notifications = [], onRead, onDelete, compact = false }) {
  const navigate = useNavigate();

  if (!notifications.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
        No notifications found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-xl border p-4 shadow-sm ${
            notification.isRead ? 'bg-white' : 'border-primary bg-orange-50/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{notification.title}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    priorityStyles[notification.priority] || priorityStyles.normal
                  }`}
                >
                  {notification.priority}
                </span>
              </div>
              <p className={`mt-2 text-sm leading-6 text-muted ${compact ? 'max-h-12 overflow-hidden' : ''}`}>
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-muted">
                {notification.notificationType} • {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {notification.actionUrl ? (
                <Button
                  variant="secondary"
                  className="min-h-9 px-3"
                  onClick={() => navigate(notification.actionUrl)}
                >
                  <FiArrowRight />
                </Button>
              ) : null}
              {!notification.isRead ? (
                <Button variant="secondary" className="min-h-9 px-3" onClick={() => onRead?.([notification.id])}>
                  <FiCheck />
                </Button>
              ) : null}
              <Button variant="ghost" className="min-h-9 px-3" onClick={() => onDelete?.(notification.id)}>
                <FiTrash2 />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
