import {
  editAnnouncement,
  getAnnouncements,
  getNotifications,
  getPreferences,
  getUnreadNotifications,
  publishAnnouncement,
  readAllNotifications,
  readNotifications,
  removeAnnouncement,
  removeNotification,
  savePreferences,
} from '../services/notificationService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function notificationsController(req, res, next) {
  try {
    return sendSuccess(res, await getNotifications(req.user, req.query), 'Notifications fetched');
  } catch (error) {
    return next(error);
  }
}

export async function unreadNotificationsController(req, res, next) {
  try {
    return sendSuccess(res, await getUnreadNotifications(req.user), 'Unread notifications fetched');
  } catch (error) {
    return next(error);
  }
}

export async function readNotificationsController(req, res, next) {
  try {
    return sendSuccess(res, await readNotifications(req.user, req.body.ids || []), 'Notifications marked as read');
  } catch (error) {
    return next(error);
  }
}

export async function readAllNotificationsController(req, res, next) {
  try {
    return sendSuccess(res, await readAllNotifications(req.user), 'All notifications marked as read');
  } catch (error) {
    return next(error);
  }
}

export async function deleteNotificationController(req, res, next) {
  try {
    return sendSuccess(res, await removeNotification(req.user, Number(req.params.id)), 'Notification deleted');
  } catch (error) {
    return next(error);
  }
}

export async function announcementsController(req, res, next) {
  try {
    return sendSuccess(res, await getAnnouncements(req.user, req.query), 'Announcements fetched');
  } catch (error) {
    return next(error);
  }
}

export async function createAnnouncementController(req, res, next) {
  try {
    return sendSuccess(res, await publishAnnouncement(req.user, req.body), 'Announcement published', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateAnnouncementController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await editAnnouncement(req.user, Number(req.params.id), req.body),
      'Announcement updated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteAnnouncementController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await removeAnnouncement(req.user, Number(req.params.id)),
      'Announcement deleted',
    );
  } catch (error) {
    return next(error);
  }
}

export async function preferencesController(req, res, next) {
  try {
    return sendSuccess(res, await getPreferences(req.user), 'Notification preferences fetched');
  } catch (error) {
    return next(error);
  }
}

export async function updatePreferencesController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await savePreferences(req.user, req.body, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }),
      'Notification preferences updated',
    );
  } catch (error) {
    return next(error);
  }
}
