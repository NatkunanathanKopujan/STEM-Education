import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { notificationService } from '../../services/notificationService';

export function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await notificationService.getAnnouncements({ limit: 50 });
      setAnnouncements(data.announcements || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="Announcements"
        description="Read announcements published for students."
        actionLabel="Refresh"
        onAction={loadAnnouncements}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? <Loader label="Loading announcements" /> : null}
      {!isLoading && !announcements.length ? (
        <EmptyState
          title="No announcements"
          description="Student announcements will appear here after they are published."
        />
      ) : null}

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  {item.priority || 'normal'} -{' '}
                  {item.publishDate ? new Date(item.publishDate).toLocaleString() : 'Published'}
                </p>
              </div>
              {item.priority === 'urgent' ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  Urgent
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{item.description}</p>
            {item.attachments?.length ? (
              <Button className="mt-4" variant="secondary">
                Download {item.attachments[0].fileName}
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
