import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { USER_ROLES } from '../../utils/constants';
import { notificationService } from '../../services/notificationService';

const publisherRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.TEACHER];

const initialForm = {
  title: '',
  description: '',
  audienceRole: '',
  priority: 'normal',
  status: 'published',
  publishDate: '',
  expiryDate: '',
  attachmentPath: '',
  targetType: 'all_users',
  targetRole: '',
  targetId: '',
};

export function AnnouncementCenterPage() {
  const { role } = useAuth();
  const canPublish = publisherRoles.includes(role);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const data = await notificationService.getAnnouncements();
    setAnnouncements(data.announcements || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await notificationService.createAnnouncement({
      ...form,
      audienceRole: form.audienceRole || null,
      publishDate: form.publishDate || null,
      expiryDate: form.expiryDate || null,
      attachmentPath: form.attachmentPath || null,
      targets: [
        {
          targetType: form.targetType,
          targetRole: form.targetRole || null,
          targetId: form.targetId ? Number(form.targetId) : null,
        },
      ],
    });
    setForm(initialForm);
    await loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Announcement Center"
        description="Publish and read targeted announcements with priority, expiry, attachments, and delivery notifications."
      />
      {canPublish ? (
        <Card className="p-5">
          <form className="grid gap-4 lg:grid-cols-4" onSubmit={handleSubmit}>
            <input
              value={form.title}
              onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))}
              placeholder="Announcement title"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary lg:col-span-2"
              required
            />
            <select
              value={form.priority}
              onChange={(event) => setForm((value) => ({ ...value, priority: event.target.value }))}
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={form.status}
              onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={form.targetType}
              onChange={(event) => setForm((value) => ({ ...value, targetType: event.target.value }))}
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            >
              <option value="all_users">All Users</option>
              <option value="role">Role</option>
              <option value="curriculum">Specific Curriculum</option>
              <option value="teacher">Specific Teacher</option>
              <option value="student">Specific Student</option>
            </select>
            <select
              value={form.targetRole}
              onChange={(event) => setForm((value) => ({ ...value, targetRole: event.target.value }))}
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
              disabled={form.targetType !== 'role'}
            >
              <option value="">Select Role</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="super-admin">Super Admins</option>
            </select>
            <input
              value={form.targetId}
              onChange={(event) => setForm((value) => ({ ...value, targetId: event.target.value }))}
              placeholder="Target ID"
              type="number"
              min="1"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
              disabled={['all_users', 'role'].includes(form.targetType)}
            />
            <input
              value={form.publishDate}
              onChange={(event) => setForm((value) => ({ ...value, publishDate: event.target.value }))}
              type="datetime-local"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            />
            <input
              value={form.expiryDate}
              onChange={(event) => setForm((value) => ({ ...value, expiryDate: event.target.value }))}
              type="datetime-local"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            />
            <input
              value={form.attachmentPath}
              onChange={(event) => setForm((value) => ({ ...value, attachmentPath: event.target.value }))}
              placeholder="Optional attachment path"
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary lg:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              placeholder="Description"
              className="min-h-24 rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary lg:col-span-4"
              required
            />
            <Button type="submit" className="lg:col-span-1">
              {form.status === 'draft' ? 'Save Draft' : 'Publish Announcement'}
            </Button>
          </form>
        </Card>
      ) : null}
      {isLoading ? <Loader label="Loading announcements" /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">{announcement.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{announcement.description}</p>
              </div>
              <StatusBadge
                status={
                  announcement.priority === 'urgent'
                    ? 'Danger'
                    : announcement.priority === 'important'
                      ? 'Warning'
                      : 'Info'
                }
              />
            </div>
            <p className="mt-4 text-xs text-muted">
              Target: {announcement.audienceRole || announcement.targets?.[0]?.targetType || 'All Users'} •
              Published {announcement.publishDate ? new Date(announcement.publishDate).toLocaleString() : 'recently'}
            </p>
            {announcement.attachments?.length ? (
              <p className="mt-2 text-xs font-semibold text-primary">
                Attachment: {announcement.attachments[0].fileName}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
