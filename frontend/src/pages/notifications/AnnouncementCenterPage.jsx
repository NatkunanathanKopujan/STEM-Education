import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit3, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { ConfirmationDialog, Modal } from '../../components/ui/Modal';
import { USER_ROLES } from '../../utils/constants';
import { notificationService } from '../../services/notificationService';

const publisherRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.TEACHER];
const pageSize = 20;

const initialForm = {
  title: '',
  description: '',
  audienceRole: '',
  priority: 'normal',
  status: 'published',
  publishDate: '',
  expiryDate: '',
  attachmentPath: '',
  audience: 'all_users',
};

const initialFilters = {
  search: '',
  priority: '',
  status: '',
  sort: 'newest',
  offset: 0,
};
function getApiErrorMessage(apiError, fallback) {
  const errors = apiError.response?.data?.errors || [];
  const detail = errors
    .map((item) => item.msg || item.message)
    .filter(Boolean)
    .join(', ');

  return detail || apiError.response?.data?.message || fallback;
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function buildPayload(form) {
  const targets =
    form.audience === 'all_users'
      ? [{ targetType: 'all_users', targetRole: null, targetId: null }]
      : [{ targetType: 'role', targetRole: form.audience, targetId: null }];

  return {
    title: form.title,
    description: form.description,
    audienceRole: form.audience === 'all_users' ? null : form.audience,
    priority: form.priority,
    status: form.status,
    publishDate: form.publishDate || null,
    expiryDate: form.expiryDate || null,
    attachmentPath: form.attachmentPath || null,
    targets,
  };
}

function validateForm(form) {
  if (form.title.trim().length < 3) {
    return 'Title must be at least 3 characters.';
  }

  if (form.description.trim().length < 5) {
    return 'Description must be at least 5 characters.';
  }

  if (!form.audience) {
    return 'Audience is required.';
  }

  if (form.publishDate && form.expiryDate && new Date(form.expiryDate) <= new Date(form.publishDate)) {
    return 'Expiry date must be after publish date.';
  }

  return '';
}

function formatDateTime(value, fallback = 'Not set') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function getEffectiveStatus(announcement) {
  const now = Date.now();
  const publishAt = announcement.publishDate ? new Date(announcement.publishDate).getTime() : null;
  const expiryAt = announcement.expiryDate ? new Date(announcement.expiryDate).getTime() : null;

  if (announcement.status === 'published' && publishAt && publishAt > now) {
    return 'scheduled';
  }

  if (announcement.status === 'published' && expiryAt && expiryAt <= now) {
    return 'expired';
  }

  return announcement.status || 'draft';
}

function mapAnnouncementToForm(announcement) {
  const target = announcement.targets?.[0] || {};
  const audience =
    announcement.audienceRole ||
    (target.targetType === 'role' ? target.targetRole : '') ||
    'all_users';

  return {
    title: announcement.title || '',
    description: announcement.description || '',
    audienceRole: audience === 'all_users' ? '' : audience,
    priority: announcement.priority || 'normal',
    status: announcement.status || 'published',
    publishDate: toDateTimeLocal(announcement.publishDate),
    expiryDate: toDateTimeLocal(announcement.expiryDate),
    attachmentPath: announcement.attachmentPath || '',
    audience,
  };
}

function getAudienceLabel(announcement) {
  const target = announcement.targets?.[0] || {};
  const audience = announcement.audienceRole || target.targetRole;

  if (!audience || target.targetType === 'all_users') {
    return 'All Users';
  }

  const labels = {
    student: 'Students',
    teacher: 'Teachers',
    admin: 'Admins',
    'super-admin': 'Super Admins',
  };

  return labels[audience] || audience;
}

export function AnnouncementCenterPage() {
  const { role } = useAuth();
  const canPublish = publisherRoles.includes(role);
  const [announcements, setAnnouncements] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const publishedCount = useMemo(
    () => announcements.filter((announcement) => announcement.status === 'published').length,
    [announcements],
  );

  const loadAnnouncements = useCallback(async (nextFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await notificationService.getAnnouncements({ ...nextFilters, limit: pageSize });
      setAnnouncements(data.announcements || []);
      setTotal(data.total || 0);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements(initialFilters);
  }, [loadAnnouncements]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, offset: 0 }));
  };

  const applyFilters = () => loadAnnouncements({ ...filters, offset: 0 });

  const resetFilters = () => {
    setFilters(initialFilters);
    loadAnnouncements(initialFilters);
  };

  const goToPage = (direction) => {
    const nextFilters = {
      ...filters,
      offset: Math.max(Number(filters.offset || 0) + direction * pageSize, 0),
    };
    setFilters(nextFilters);
    loadAnnouncements(nextFilters);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (editingId) {
        await notificationService.updateAnnouncement(editingId, buildPayload(form));
        setMessage('Announcement updated.');
      } else {
        await notificationService.createAnnouncement(buildPayload(form));
        setMessage(form.status === 'draft' ? 'Announcement draft saved.' : 'Announcement published.');
      }
      resetForm();
      await loadAnnouncements(filters);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to save announcement.'));
    }
  };

  const startEdit = (announcement) => {
    setEditingId(announcement.id);
    setForm(mapAnnouncementToForm(announcement));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAnnouncement = async () => {
    if (!deleteTarget) return;
    setError('');
    setMessage('');
    try {
      await notificationService.deleteAnnouncement(deleteTarget.id);
      setMessage('Announcement deleted.');
      setDeleteTarget(null);
      await loadAnnouncements(filters);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to delete announcement.'));
    }
  };

  const viewAnnouncement = async (announcement) => {
    setError('');
    setIsViewing(true);
    try {
      const details = await notificationService.getAnnouncement(announcement.id);
      setSelectedAnnouncement(details);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to load announcement details.'));
    } finally {
      setIsViewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Announcement Center"
        description="Publish, update, target, and manage role-based LMS announcements."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{total}</p>
          <p className="text-sm text-muted">Matching Announcements</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{publishedCount}</p>
          <p className="text-sm text-muted">Published On This Page</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink">{canPublish ? 'Enabled' : 'Read only'}</p>
          <p className="text-sm text-muted">Publishing Access</p>
        </Card>
      </div>

      {canPublish ? (
        <Card className="p-5">
          <form className="grid gap-4 lg:grid-cols-3" onSubmit={handleSubmit}>
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
              value={form.audience}
              onChange={(event) => setForm((value) => ({ ...value, audience: event.target.value }))}
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            >
              <option value="all_users">All Users</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="super-admin">Super Admins</option>
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
              className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              placeholder="Description"
              className="min-h-24 rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-primary lg:col-span-3"
              required
            />
            <div className="flex gap-3 lg:col-span-3">
              <Button type="submit">
                {editingId ? 'Update Announcement' : form.status === 'draft' ? 'Save Draft' : 'Publish Announcement'}
              </Button>
              {editingId ? <Button variant="secondary" onClick={resetForm}>Cancel Edit</Button> : null}
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_11rem_11rem_12rem_auto_auto_auto]">
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search announcements"
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          />
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
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
            disabled={!canPublish}
          >
            <option value="">{canPublish ? 'All Status' : 'Published'}</option>
            {canPublish ? <option value="scheduled">Scheduled</option> : null}
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filters.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            className="min-h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-primary"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="publishDate">Publish date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          <Button onClick={applyFilters}>Filter</Button>
          <Button variant="secondary" onClick={resetFilters}>Reset</Button>
          <Button variant="secondary" onClick={() => loadAnnouncements(filters)}>
            <FiRefreshCw />
            Refresh
          </Button>
        </div>
      </Card>

      {message ? <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      {isLoading ? <Loader label="Loading announcements" /> : null}
      {!isLoading && !announcements.length ? <EmptyState title="No announcements found" description="Create an announcement or adjust filters." /> : null}
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
              Target: {getAudienceLabel(announcement)} -
              Published {formatDateTime(announcement.publishDate, 'recently')} -
              Status {getEffectiveStatus(announcement)}
            </p>
            {announcement.attachments?.length ? (
              <p className="mt-2 text-xs font-semibold text-primary">
                Attachment: {announcement.attachments[0].fileName}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-9 px-3"
                disabled={isViewing}
                onClick={() => viewAnnouncement(announcement)}
              >
                <FiEye />
                View
              </Button>
              {canPublish ? (
                <>
                <Button variant="secondary" className="min-h-9 px-3" onClick={() => startEdit(announcement)}>
                  <FiEdit3 />
                  Edit
                </Button>
                <Button variant="ghost" className="min-h-9 px-3 text-red-600" onClick={() => setDeleteTarget(announcement)}>
                  <FiTrash2 />
                  Delete
                </Button>
                </>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

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
        title="Delete announcement"
        message={`Delete announcement "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDanger
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAnnouncement}
      />
      <Modal
        open={Boolean(selectedAnnouncement)}
        title="Announcement details"
        onClose={() => setSelectedAnnouncement(null)}
      >
        {selectedAnnouncement ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Title</p>
              <p className="mt-1 font-semibold text-ink">{selectedAnnouncement.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Content</p>
              <p className="mt-1 leading-6 text-muted">{selectedAnnouncement.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="font-semibold text-ink">Audience:</span> {getAudienceLabel(selectedAnnouncement)}</p>
              <p><span className="font-semibold text-ink">Priority:</span> {selectedAnnouncement.priority}</p>
              <p><span className="font-semibold text-ink">Status:</span> {getEffectiveStatus(selectedAnnouncement)}</p>
              <p><span className="font-semibold text-ink">Published:</span> {formatDateTime(selectedAnnouncement.publishDate)}</p>
              <p><span className="font-semibold text-ink">Expires:</span> {formatDateTime(selectedAnnouncement.expiryDate)}</p>
              <p><span className="font-semibold text-ink">Updated:</span> {formatDateTime(selectedAnnouncement.updatedAt)}</p>
            </div>
            {selectedAnnouncement.attachments?.length ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Attachment</p>
                <p className="mt-1 text-primary">{selectedAnnouncement.attachments[0].fileName}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
