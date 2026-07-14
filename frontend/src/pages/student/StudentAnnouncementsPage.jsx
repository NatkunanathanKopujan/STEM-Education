import { PageHeader } from '../../components/super-admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studentAnnouncements } from '../../data/studentData';

export function StudentAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Announcements" description="Read announcements published by teachers with attachments and unread indicators." />
      <div className="space-y-4">
        {studentAnnouncements.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="text-lg font-bold text-ink">{item.title}</h2><p className="mt-2 text-sm text-muted">{item.teacher} · {item.date}</p></div>
              {item.unread ? <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-primary">Unread</span> : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{item.message}</p>
            {item.attachment ? <Button className="mt-4" variant="secondary">Download {item.attachment}</Button> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
