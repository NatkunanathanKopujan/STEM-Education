import { loggingService } from '../services/loggingService.js';
import { closeUserSession } from '../models/sessionModel.js';
import {
  changeUserPassword,
  getAuthenticatedUser,
  loginUser,
} from '../services/authService.js';
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
    loggingService.auth('Failed login attempt', {
      identifier: req.body.identifier || req.body.email || req.body.username,
      ipAddress: req.ip,
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
    loggingService.auth('Password changed', { userId: req.user.id });
    return sendSuccess(res, null, 'Password changed successfully');
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
