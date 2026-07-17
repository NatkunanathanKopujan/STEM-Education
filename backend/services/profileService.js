import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { findUserById, updatePassword } from '../models/userModel.js';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import {
  closeAllSessions,
  closeSession,
  createSecurityEvent,
  getProfile,
  getUserPreferences,
  isEmailAvailable,
  listLoginHistory,
  listSecurityEvents,
  listSessions,
  removeProfilePhoto,
  saveProfilePhoto,
  touchPasswordChanged,
  updateProfile,
  updateUserPreferences,
} from '../repositories/profileRepository.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../repositories/notificationRepository.js';
import { auditAction } from './securityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileUploadDirectory = path.resolve(__dirname, '..', 'uploads', 'profiles');

const editableProfileFields = new Set([
  'fullName',
  'email',
  'phone',
  'address',
  'bio',
  'department',
  'qualification',
  'curriculum',
]);

const allowedProfilePhotoTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

async function deleteRejectedProfileUpload(file) {
  if (!file?.path) {
    return;
  }

  const resolvedPath = path.resolve(file.path);
  const allowedRoot = `${profileUploadDirectory}${path.sep}`;

  if (!resolvedPath.startsWith(allowedRoot)) {
    return;
  }

  try {
    await fs.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function getMyProfile(user) {
  const [profile, preferences, notificationPreferences, sessions, securityEvents] = await Promise.all([
    getProfile(user.id),
    getUserPreferences(user.id),
    getNotificationPreferences(user.id),
    listSessions(user.id),
    listSecurityEvents(user.id),
  ]);

  return {
    profile,
    preferences,
    notificationPreferences,
    sessions,
    securityEvents,
  };
}

export async function updateMyProfile(user, payload, ipAddress) {
  if (payload.email && !(await isEmailAvailable(payload.email, user.id))) {
    throw new AppError('Email is already in use', 409);
  }

  const allowedPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => editableProfileFields.has(key)),
  );

  if (![ROLES.ADMIN, ROLES.TEACHER].includes(user.role)) {
    delete allowedPayload.department;
  }

  if (user.role !== ROLES.TEACHER) {
    delete allowedPayload.qualification;
  }

  if (user.role !== ROLES.STUDENT) {
    delete allowedPayload.curriculum;
  }

  await updateProfile(user.id, allowedPayload);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'profile_updated',
    description: 'Profile information updated',
    ipAddress,
  });
  await auditAction({
    user,
    action: 'profile_updated',
    module: 'profile',
    description: 'Profile information updated',
    ipAddress,
    metadata: { fields: Object.keys(allowedPayload) },
  });

  return getProfile(user.id);
}

export async function uploadProfilePhoto(user, file, ipAddress) {
  if (!file) {
    throw new AppError('Profile photo is required', 422);
  }

  if (file.size > 5 * 1024 * 1024) {
    await deleteRejectedProfileUpload(file);
    throw new AppError('Profile photo must be 5 MB or smaller', 422);
  }

  if (!allowedProfilePhotoTypes.has(file.mimetype)) {
    await deleteRejectedProfileUpload(file);
    throw new AppError('Profile photo must be a valid image file', 422);
  }

  await saveProfilePhoto(user.id, file);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'profile_photo_updated',
    description: 'Profile photo uploaded',
    ipAddress,
    metadata: { fileName: file.filename },
  });
  await auditAction({
    user,
    action: 'profile_photo_updated',
    module: 'profile',
    description: 'Profile photo uploaded',
    ipAddress,
    metadata: { fileName: file.filename },
  });

  return getProfile(user.id);
}

export async function deleteProfilePhoto(user, ipAddress) {
  await removeProfilePhoto(user.id);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'profile_photo_removed',
    description: 'Profile photo removed',
    ipAddress,
  });
  await auditAction({
    user,
    action: 'profile_photo_removed',
    module: 'profile',
    description: 'Profile photo removed',
    ipAddress,
  });
  return { removed: true };
}

export async function changeMyPassword(user, { currentPassword, newPassword }, ipAddress) {
  const existing = await findUserById(user.id);

  if (!existing) {
    throw new AppError('User was not found', 404);
  }

  if (!(await comparePassword(currentPassword, existing.passwordHash))) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (await comparePassword(newPassword, existing.passwordHash)) {
    throw new AppError('New password cannot reuse the current password', 422);
  }

  await updatePassword(user.id, await hashPassword(newPassword));
  await touchPasswordChanged(user.id);
  const affectedSessions = await closeAllSessions(user.id, user.sessionId);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'password_changed',
    description: 'Password changed successfully',
    ipAddress,
    metadata: { affectedSessions },
  });
  await auditAction({
    user,
    action: 'password_changed',
    module: 'profile',
    description: 'Password changed successfully',
    ipAddress,
    metadata: { affectedSessions },
  });

  return { changed: true, affectedSessions };
}

export async function getLoginHistory(user, query = {}) {
  return {
    history: await listLoginHistory(user.id, {
      limit: Number(query.limit) || 30,
      offset: Number(query.offset) || 0,
      search: query.search,
      status: query.status,
    }),
  };
}

export async function getSessions(user) {
  const sessions = await listSessions(user.id);

  return {
    sessions: sessions.map((session) => {
      let deviceInfo = session.deviceInfo;

      if (typeof deviceInfo === 'string') {
        try {
          deviceInfo = JSON.parse(deviceInfo);
        } catch {
          deviceInfo = { raw: session.deviceInfo };
        }
      }

      return {
        ...session,
        deviceInfo,
        isActive: Boolean(session.isActive),
        isCurrent: Number(session.sessionId) === Number(user.sessionId),
      };
    }),
  };
}

export async function terminateSession(user, sessionId, ipAddress) {
  if (Number(sessionId) === Number(user.sessionId)) {
    throw new AppError('Current session cannot be removed from Connected Sessions. Use Logout instead.', 400);
  }

  const closed = await closeSession({ userId: user.id, sessionId });

  if (!closed) {
    throw new AppError('Session not found', 404);
  }

  await createSecurityEvent({
    userId: user.id,
    eventType: 'session_terminated',
    description: 'A connected session was terminated',
    ipAddress,
    metadata: { sessionId },
  });
  await auditAction({
    user,
    action: 'session_terminated',
    module: 'profile',
    description: 'A connected session was terminated',
    ipAddress,
    metadata: { sessionId },
  });

  return { closed: true };
}

export async function terminateAllSessions(user, { keepCurrent = true, password } = {}, ipAddress) {
  if (!keepCurrent) {
    const existing = await findUserById(user.id);

    if (!password || !(await comparePassword(password, existing.passwordHash))) {
      throw new AppError('Password confirmation is required to logout all devices', 403);
    }
  }

  const affected = await closeAllSessions(user.id, keepCurrent ? user.sessionId : null);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'sessions_terminated',
    description: 'Connected sessions were terminated',
    ipAddress,
    metadata: { affected },
  });
  await auditAction({
    user,
    action: 'sessions_terminated',
    module: 'profile',
    description: 'Connected sessions were terminated',
    ipAddress,
    metadata: { affected, keepCurrent },
  });
  return { affected };
}

export async function getProfilePreferences(user) {
  const [preferences, notificationPreferences] = await Promise.all([
    getUserPreferences(user.id),
    getNotificationPreferences(user.id),
  ]);

  return { preferences, notificationPreferences };
}

export async function updateProfilePreferences(user, payload, ipAddress) {
  const [preferences, notificationPreferences] = await Promise.all([
    updateUserPreferences(user.id, payload),
    payload.notificationPreferences
      ? updateNotificationPreferences(user.id, payload.notificationPreferences)
      : getNotificationPreferences(user.id),
  ]);

  await createSecurityEvent({
    userId: user.id,
    eventType: 'preferences_updated',
    description: 'User preferences updated',
    ipAddress,
  });
  await auditAction({
    user,
    action: 'preferences_updated',
    module: 'profile',
    description: 'User preferences updated',
    ipAddress,
  });

  return { preferences, notificationPreferences };
}
