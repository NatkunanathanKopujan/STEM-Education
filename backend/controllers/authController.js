import { loggingService } from '../services/loggingService.js';
import { closeUserSession } from '../models/sessionModel.js';
import { closeAllSessions } from '../repositories/profileRepository.js';
import {
  changeUserPassword,
  getAuthenticatedUser,
  loginUser,
} from '../services/authService.js';
import { auditAction } from '../services/securityService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { decodeToken } from '../utils/jwt.js';

export async function login(req, res, next) {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    const result = await loginUser({
      identifier,
      password: req.body.password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    loggingService.auth('Login successful', {
      userId: result.user.id,
      role: result.user.role,
      ipAddress: req.ip,
    });

    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    loggingService.auth('Failed login attempt', {
      identifier,
      ipAddress: req.ip,
    });
    await auditAction({
      user: null,
      action: 'login_failed',
      module: 'auth',
      description: `Login failed for ${identifier || 'unknown account'}`,
      status: 'failed',
      ipAddress: req.ip,
      browser: req.get('user-agent'),
      metadata: { identifier },
    });
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await closeUserSession(req.user?.sessionId);
  } catch (error) {
    return next(error);
  }

  const session = {
    loginTime: null,
    logoutTime: new Date().toISOString(),
    sessionId: req.user?.sessionId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };

  loggingService.auth('Logout successful', {
    userId: req.user?.id || null,
    ...session,
  });
  await auditAction({
    user: req.user,
    action: 'logout',
    module: 'auth',
    description: 'User logged out successfully',
    ipAddress: req.ip,
    browser: req.get('user-agent'),
    metadata: { sessionId: req.user?.sessionId || null },
  });

  return sendSuccess(res, { session }, 'Logout successful');
}

export async function me(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req.user.id);
    return sendSuccess(res, { user }, 'Profile fetched successfully');
  } catch (error) {
    return next(error);
  }
}

export async function verify(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req.user.id);
    return sendSuccess(
      res,
      {
        valid: true,
        user,
        token: decodeToken(req.token),
      },
      'Token verified successfully',
    );
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    await changeUserPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    const affectedSessions = await closeAllSessions(req.user.id, req.user.sessionId);
    loggingService.auth('Password changed', { userId: req.user.id });
    await auditAction({
      user: req.user,
      action: 'password_changed',
      module: 'auth',
      description: 'User changed password',
      ipAddress: req.ip,
      browser: req.get('user-agent'),
      metadata: { affectedSessions },
    });
    return sendSuccess(res, { changed: true, affectedSessions }, 'Password changed successfully');
  } catch (error) {
    return next(error);
  }
}

export function forgotPassword(req, res) {
  loggingService.auth('Forgot password requested', {
    identifier: req.body.identifier,
    ipAddress: req.ip,
  });

  return sendSuccess(
    res,
    null,
    'If the account exists, password reset instructions will be sent',
  );
}

export function resetPassword(_req, res) {
  return sendSuccess(res, null, 'Password reset endpoint structure is ready');
}
