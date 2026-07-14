import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  countUnreadNotifications,
  createAnnouncement,
  createNotification,
  deleteAnnouncement,
  deleteNotification,
  getNotificationPreferences,
  listAnnouncements,
  listNotifications,
  listUsersForAnnouncement,
  markNotificationsRead,
  replaceAnnouncementTargets,
  updateAnnouncement,
  updateNotificationPreferences,
} from '../repositories/notificationRepository.js';

const announcementPublishRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER];

export async function getNotifications(user, filters = {}) {
  const [items, unreadCount] = await Promise.all([
    listNotifications({
      userId: user.id,
      search: filters.search,
      type: filters.type,
      limit: Number(filters.limit) || 30,
      offset: Number(filters.offset) || 0,
    }),
    countUnreadNotifications(user.id),
  ]);

  return { unreadCount, notifications: items };
}

export async function getUnreadNotifications(user) {
  const notifications = await listNotifications({
    userId: user.id,
    limit: 10,
    offset: 0,
  });

  return {
    unreadCount: await countUnreadNotifications(user.id),
    notifications: notifications.filter((item) => !item.isRead),
  };
}

export async function readNotifications(user, ids = []) {
  const affected = await markNotificationsRead({ userId: user.id, ids });
  return { affected };
}

export async function readAllNotifications(user) {
  const affected = await markNotificationsRead({ userId: user.id });
  return { affected };
}

export async function removeNotification(user, id) {
  const deleted = await deleteNotification({ userId: user.id, id });

  if (!deleted) {
    throw new AppError('Notification not found', 404);
  }

  return { deleted: true };
}

export async function getPreferences(user) {
  return getNotificationPreferences(user.id);
}

export async function savePreferences(user, payload) {
  return updateNotificationPreferences(user.id, payload);
}

export async function getAnnouncements(user, filters = {}) {
  return {
    announcements: await listAnnouncements({
      user,
      limit: Number(filters.limit) || 30,
      offset: Number(filters.offset) || 0,
    }),
  };
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

  return { id, ...delivery };
}

export async function editAnnouncement(user, id, payload) {
  if (!announcementPublishRoles.includes(user.role)) {
    throw new AppError('You do not have permission to update announcements', 403);
  }

  const updated = await updateAnnouncement(id, payload);

  if (!updated) {
    throw new AppError('Announcement not found or no changes supplied', 404);
  }

  if (payload.targets) {
    await replaceAnnouncementTargets(id, payload.targets);
  }

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
