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

function validatePasswordStrength(password) {
  const checks = [
    password?.length >= 8,
    /[A-Z]/.test(password || ''),
    /[a-z]/.test(password || ''),
    /\d/.test(password || ''),
    /[^A-Za-z0-9]/.test(password || ''),
  ];

  if (!checks.every(Boolean)) {
    throw new AppError(
      'Password must contain uppercase, lowercase, number, special character, and be at least 8 characters',
      422,
    );
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

  const allowedPayload = { ...payload };

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER].includes(user.role)) {
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

  return getProfile(user.id);
}

export async function uploadProfilePhoto(user, file, ipAddress) {
  if (!file) {
    throw new AppError('Profile photo is required', 422);
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('Profile photo must be 5 MB or smaller', 422);
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    throw new AppError('Profile photo must be JPG, PNG, or WEBP', 422);
  }

  await saveProfilePhoto(user.id, file);
  await createSecurityEvent({
    userId: user.id,
    eventType: 'profile_photo_updated',
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
  return { removed: true };
}

export async function changeMyPassword(user, { currentPassword, newPassword }, ipAddress) {
  validatePasswordStrength(newPassword);
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
  await createSecurityEvent({
    userId: user.id,
    eventType: 'password_changed',
    description: 'Password changed successfully',
    ipAddress,
  });

  return { changed: true };
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
  return { sessions: await listSessions(user.id) };
}

export async function terminateSession(user, sessionId, ipAddress) {
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

  return { preferences, notificationPreferences };
}
