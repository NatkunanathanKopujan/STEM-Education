import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  countUnreadNotifications,
  createAnnouncement,
  createNotification,
  deleteAnnouncement,
  deleteNotification,
  findAnnouncementById,
  getNotificationPreferences,
  listAnnouncements,
  listNotifications,
  listUsersForAnnouncement,
  markNotificationsRead,
  replaceAnnouncementTargets,
  resetNotificationPreferences,
  updateAnnouncement,
  updateNotificationPreferences,
} from '../repositories/notificationRepository.js';
import { auditAction } from './securityService.js';

const announcementPublishRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER];

export async function getNotifications(user, filters = {}) {
  const [result, unreadCount] = await Promise.all([
    listNotifications({
      userId: user.id,
      search: filters.search,
      type: filters.type,
      readStatus: filters.readStatus,
      priority: filters.priority,
      limit: Number(filters.limit) || 30,
      offset: Number(filters.offset) || 0,
    }),
    countUnreadNotifications(user.id),
  ]);

  return {
    unreadCount,
    notifications: result.notifications,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  };
}

export async function getUnreadNotifications(user) {
  const notifications = await listNotifications({
    userId: user.id,
    readStatus: 'unread',
    limit: 10,
    offset: 0,
  });

  return {
    unreadCount: await countUnreadNotifications(user.id),
    notifications: notifications.notifications,
  };
}

export async function readNotifications(user, ids = []) {
  const affected = await markNotificationsRead({ userId: user.id, ids });
  if (affected) {
    await auditAction({
      user,
      action: 'notifications_marked_read',
      module: 'notifications',
      description: `${affected} notification${affected === 1 ? '' : 's'} marked as read`,
      metadata: { ids },
    });
  }
  return { affected };
}

export async function readAllNotifications(user) {
  const affected = await markNotificationsRead({ userId: user.id });
  if (affected) {
    await auditAction({
      user,
      action: 'notifications_marked_all_read',
      module: 'notifications',
      description: `${affected} notification${affected === 1 ? '' : 's'} marked as read`,
    });
  }
  return { affected };
}

export async function removeNotification(user, id) {
  const deleted = await deleteNotification({ userId: user.id, id });

  if (!deleted) {
    throw new AppError('Notification not found', 404);
  }
  await auditAction({
    user,
    action: 'notification_deleted',
    module: 'notifications',
    description: `Notification ${id} deleted`,
    metadata: { notificationId: Number(id) },
  });

  return { deleted: true };
}

export async function getPreferences(user) {
  return getNotificationPreferences(user.id);
}

export async function savePreferences(user, payload, requestMeta = {}) {
  const preferences = await updateNotificationPreferences(user.id, payload);
  await auditAction({
    user,
    action: 'notification_preferences_updated',
    module: 'notifications',
    description: 'Notification preferences updated',
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
    metadata: { fields: Object.keys(payload || {}) },
  });
  return preferences;
}

export async function resetPreferences(user, requestMeta = {}) {
  const preferences = await resetNotificationPreferences(user.id);
  await auditAction({
    user,
    action: 'notification_preferences_reset',
    module: 'notifications',
    description: 'Notification preferences reset to defaults',
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
  });
  return preferences;
}

export async function getAnnouncements(user, filters = {}) {
  return listAnnouncements({
    user,
    search: filters.search,
    type: filters.type,
    priority: filters.priority,
    status: filters.status,
    sort: filters.sort,
    limit: Number(filters.limit) || 30,
    offset: Number(filters.offset) || 0,
  });
}

export async function getAnnouncement(user, id) {
  const announcement = await findAnnouncementById({ user, id });

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  if (announcementPublishRoles.includes(user.role)) {
    await auditAction({
      user,
      action: 'announcement_viewed',
      module: 'announcements',
      description: `Announcement ${announcement.title} viewed`,
      metadata: { announcementId: Number(id) },
    });
  }

  return announcement;
}

async function notifyAnnouncementAudience(announcement, createdBy) {
  if (announcement.status !== 'published') {
    return { delivered: 0 };
  }

  const users = await listUsersForAnnouncement({
    audienceRole: announcement.audienceRole,
    targets: announcement.targets || [],
  });

  const notificationIds = await Promise.all(
    users.map((targetUser) =>
      createNotification({
        userId: targetUser.id,
        role: targetUser.role,
        title: announcement.title,
        message: announcement.description,
        notificationType: 'announcement',
        priority: announcement.priority,
        sourceModule: 'announcements',
        actionUrl: '/notifications',
        metadata: { createdBy },
      }),
    ),
  );

  return { delivered: notificationIds.filter(Boolean).length };
}

export async function publishAnnouncement(user, payload) {
  if (!announcementPublishRoles.includes(user.role)) {
    throw new AppError('You do not have permission to publish announcements', 403);
  }

  const announcement = {
    ...payload,
    createdBy: user.id,
    status: payload.status || 'published',
    publishDate: payload.publishDate || new Date(),
    targets: payload.targets || [],
  };
  const id = await createAnnouncement(announcement);
  await replaceAnnouncementTargets(id, payload.targets || []);
  const delivery = await notifyAnnouncementAudience(announcement, user.id);
  await auditAction({
    user,
    action: announcement.status === 'draft' ? 'announcement_draft_created' : 'announcement_published',
    module: 'announcements',
    description: `${announcement.status === 'draft' ? 'Announcement draft' : 'Announcement'} ${announcement.title} saved`,
    metadata: { announcementId: id, delivered: delivery.delivered, audienceRole: announcement.audienceRole },
  });

  return { id, ...delivery };
}

export async function editAnnouncement(user, id, payload) {
  if (!announcementPublishRoles.includes(user.role)) {
    throw new AppError('You do not have permission to update announcements', 403);
  }

  const updated = await updateAnnouncement(id, payload);

  if (!updated && !payload.targets) {
    throw new AppError('Announcement not found or no changes supplied', 404);
  }

  if (payload.targets) {
    await replaceAnnouncementTargets(id, payload.targets);
  }
  await auditAction({
    user,
    action: 'announcement_updated',
    module: 'announcements',
    description: `Announcement ${id} updated`,
    metadata: { announcementId: Number(id), fields: Object.keys(payload || {}) },
  });

  return { updated: true };
}

export async function removeAnnouncement(user, id) {
  if (!announcementPublishRoles.includes(user.role)) {
    throw new AppError('You do not have permission to delete announcements', 403);
  }

  const deleted = await deleteAnnouncement(id);

  if (!deleted) {
    throw new AppError('Announcement not found', 404);
  }
  await auditAction({
    user,
    action: 'announcement_deleted',
    module: 'announcements',
    description: `Announcement ${id} deleted`,
    metadata: { announcementId: Number(id) },
  });

  return { deleted: true };
}

export const notificationChannels = {
  inApp: true,
  email: false,
  sms: false,
  push: false,
  realtime: {
    websocket: false,
    socketIo: false,
    serverSentEvents: false,
  },
};
