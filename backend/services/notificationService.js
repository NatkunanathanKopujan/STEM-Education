import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { findDepartmentById } from '../repositories/departmentRepository.js';
import { findCurriculumById, findCurriculumModuleById } from '../repositories/curriculumRepository.js';
import {
  countUnreadNotifications,
  createAnnouncement,
  createNotification,
  deleteAnnouncement,
  deleteNotification,
  findAnnouncementRawById,
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
import { findTeacherDepartmentsByUserId } from '../repositories/userManagementRepository.js';
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
    visibleOnly: filters.visibleOnly,
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

function getUserId(user) {
  return user?.id || user?.userId;
}

async function resolveAnnouncementScope(user, payload = {}) {
  const targetRole = payload.audienceRole;
  if (!['student', 'teacher'].includes(targetRole)) {
    return {
      departmentId: null,
      curriculumId: null,
      courseId: null,
      weekNo: null,
    };
  }

  const departmentId = Number(payload.departmentId || 0);
  const curriculumId = Number(payload.curriculumId || 0);
  const courseId = Number(payload.courseId || 0);
  const weekNo = Number(payload.weekNo || 0);

  if (!departmentId) throw new AppError('Department is required for student or teacher announcements', 400);
  if (!curriculumId) throw new AppError('Curriculum is required for student or teacher announcements', 400);
  if (!courseId) throw new AppError('Subject/Module is required for student or teacher announcements', 400);
  if (!weekNo || weekNo < 1) throw new AppError('Week number is required for student or teacher announcements', 400);

  const department = await findDepartmentById(departmentId);
  if (!department || department.status !== 'Active') {
    throw new AppError('Select a valid active department', 400);
  }
  if (user.role === ROLES.ADMIN && Number(department.createdBy) !== Number(getUserId(user))) {
    throw new AppError('You can only publish announcements under your campus departments', 403);
  }
  if (user.role === ROLES.TEACHER) {
    const assignedDepartments = await findTeacherDepartmentsByUserId(getUserId(user));
    const assignedIds = assignedDepartments.map((item) => Number(item.departmentId));
    if (!assignedIds.includes(departmentId)) {
      throw new AppError('You can only publish announcements under your assigned departments', 403);
    }
  }

  const curriculum = await findCurriculumById(curriculumId);
  if (!curriculum || curriculum.status !== 'Active') {
    throw new AppError('Select a valid active curriculum', 400);
  }
  if (Number(curriculum.departmentId) !== departmentId) {
    throw new AppError('Selected curriculum does not belong to the selected department', 400);
  }
  if (user.role === ROLES.ADMIN && Number(curriculum.createdBy) !== Number(getUserId(user))) {
    throw new AppError('You can only publish announcements under your campus curriculums', 403);
  }

  const module = await findCurriculumModuleById(curriculumId, courseId);
  if (!module || module.status !== 'Active') {
    throw new AppError('Select a valid active subject/module', 400);
  }

  return { departmentId, curriculumId, courseId, weekNo };
}

async function notifyAnnouncementAudience(announcement, createdBy) {
  if (announcement.status !== 'published') {
    return { delivered: 0 };
  }

  if (announcement.publishDate && new Date(announcement.publishDate).getTime() > Date.now()) {
    return { delivered: 0 };
  }

  if (announcement.expiryDate && new Date(announcement.expiryDate).getTime() <= Date.now()) {
    return { delivered: 0 };
  }

  const users = await listUsersForAnnouncement({
    audienceRole: announcement.audienceRole,
    targets: announcement.targets || [],
    scope: {
      departmentId: announcement.departmentId,
      curriculumId: announcement.curriculumId,
      courseId: announcement.courseId,
      weekNo: announcement.weekNo,
    },
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
        metadata: { announcementId: announcement.id, createdBy },
      }),
    ),
  );

  return { delivered: notificationIds.filter(Boolean).length };
}

export async function publishAnnouncement(user, payload) {
  if (!announcementPublishRoles.includes(user.role)) {
    throw new AppError('You do not have permission to publish announcements', 403);
  }

  const scope = await resolveAnnouncementScope(user, payload);
  const announcement = {
    ...payload,
    ...scope,
    createdBy: user.id,
    status: payload.status || 'published',
    publishDate: payload.publishDate || new Date(),
    targets: payload.targets || [],
  };
  const id = await createAnnouncement(announcement);
  await replaceAnnouncementTargets(id, payload.targets || []);
  const delivery = await notifyAnnouncementAudience({ ...announcement, id }, user.id);
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

  const existing = await findAnnouncementRawById(Number(id));
  if (!existing) {
    throw new AppError('Announcement not found', 404);
  }

  const nextPayload = {
    ...existing,
    ...payload,
    audienceRole: Object.prototype.hasOwnProperty.call(payload, 'audienceRole')
      ? payload.audienceRole
      : existing.audienceRole,
  };
  const scope = await resolveAnnouncementScope(user, nextPayload);
  const scopedPayload = { ...payload, ...scope };
  const updated = await updateAnnouncement(id, scopedPayload);

  if (!updated && !payload.targets) {
    throw new AppError('Announcement not found or no changes supplied', 404);
  }

  if (payload.targets) {
    await replaceAnnouncementTargets(id, payload.targets);
  }

  const updatedAnnouncement = await findAnnouncementById({ user, id: Number(id) });
  const wasDeliverable = existing.status === 'published' &&
    (!existing.publishDate || new Date(existing.publishDate).getTime() <= Date.now()) &&
    (!existing.expiryDate || new Date(existing.expiryDate).getTime() > Date.now());
  const isDeliverable = updatedAnnouncement?.status === 'published' &&
    (!updatedAnnouncement.publishDate || new Date(updatedAnnouncement.publishDate).getTime() <= Date.now()) &&
    (!updatedAnnouncement.expiryDate || new Date(updatedAnnouncement.expiryDate).getTime() > Date.now());
  const shouldNotifyAudience = isDeliverable && (!wasDeliverable || existing.status !== updatedAnnouncement.status);
  const delivery = shouldNotifyAudience
    ? await notifyAnnouncementAudience(updatedAnnouncement, user.id)
    : { delivered: 0 };

  await auditAction({
    user,
    action: 'announcement_updated',
    module: 'announcements',
    description: `Announcement ${id} updated`,
    metadata: { announcementId: Number(id), fields: Object.keys(payload || {}), delivered: delivery.delivered },
  });

  return { updated: true, delivered: delivery.delivered };
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
