import {
  findUserById,
  findUserByLoginIdentifier,
  updateLastLogin,
  updatePassword,
} from '../models/userModel.js';
import { createUserSession } from '../models/sessionModel.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';
import {
  countRecentFailedAttempts,
  recordLoginAttempt,
  setUserStatus,
} from '../repositories/securityRepository.js';
import { touchPasswordChanged } from '../repositories/profileRepository.js';
import { auditAction, createAlert } from './securityService.js';

const ACTIVE_STATUSES = ['active', 1, true];

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    uuid: user.uuid,
    fullName: user.fullName,
    name: user.fullName,
    username: user.username,
    email: user.email,
    profilePhoto: user.profilePhoto || null,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
  };
}

export async function validateUserCredentials(identifier, password) {
  const user = await findUserByLoginIdentifier(identifier);

  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  return isValid ? user : null;
}

export async function loginUser({ identifier, password, ipAddress, userAgent }) {
  const user = await findUserByLoginIdentifier(identifier);

  if (!user) {
    await recordLoginAttempt({
      identifier,
      status: 'failed',
      failureReason: 'unknown_account',
      ipAddress,
      browser: userAgent,
      deviceInfo: { userAgent },
    });
    throw new AppError('Invalid username, email, or password', 401);
  }

  if (!ACTIVE_STATUSES.includes(user.status)) {
    await recordLoginAttempt({
      userId: user.id,
      identifier,
      status: 'failed',
      failureReason: 'inactive_or_locked',
      ipAddress,
      browser: userAgent,
      deviceInfo: { userAgent },
    });
    throw new AppError('User account is inactive or locked', 403);
  }

  const isValid = await comparePassword(password, user.passwordHash);

  if (!isValid) {
    await recordLoginAttempt({
      userId: user.id,
      identifier,
      status: 'failed',
      failureReason: 'invalid_password',
      ipAddress,
      browser: userAgent,
      deviceInfo: { userAgent },
    });

    const failedCount = await countRecentFailedAttempts(identifier, env.security.lockoutWindowMinutes);
    if (failedCount >= env.security.maxFailedLogins) {
      await setUserStatus(user.id, 'locked');
      await createAlert({
        alertType: 'multiple_failed_logins',
        severity: 'high',
        title: 'Account locked after failed login attempts',
        description: `${user.username} was locked after ${failedCount} failed attempts`,
        userId: user.id,
        role: user.role,
        ipAddress,
        metadata: { failedCount, identifier },
      });
    }

    throw new AppError('Invalid username, email, or password', 401);
  }

  await updateLastLogin(user.id);
  await recordLoginAttempt({
    userId: user.id,
    identifier,
    status: 'successful',
    ipAddress,
    browser: userAgent,
    deviceInfo: { userAgent },
  });

  const sessionId = await createUserSession({
    userId: user.id,
    ipAddress,
    userAgent,
    deviceInfo: {
      userAgent,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    sessionId,
  });

  await auditAction({
    user,
    action: 'login',
    module: 'auth',
    description: 'User logged in successfully',
    ipAddress,
    browser: userAgent,
  });

  return {
    token,
    user: sanitizeUser({ ...user, lastLogin: new Date().toISOString() }),
    session: {
      loginTime: new Date().toISOString(),
      logoutTime: null,
      sessionId,
      ipAddress,
      userAgent,
    },
  };
}

export async function getAuthenticatedUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('Authenticated user was not found', 404);
  }

  return sanitizeUser(user);
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User was not found', 404);
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (await comparePassword(newPassword, user.passwordHash)) {
    throw new AppError('New password cannot reuse the current password', 422);
  }

  await updatePassword(userId, await hashPassword(newPassword));
  await touchPasswordChanged(userId);
  return true;
}
