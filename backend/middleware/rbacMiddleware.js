import { ROLE_PERMISSIONS } from '../config/permissions.js';
import { recordPermissionCheck } from '../repositories/securityRepository.js';
import { auditAction, createAlert } from '../services/securityService.js';
import { sendError } from '../utils/apiResponse.js';

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication is required', 401);
    }

    if (req.user.role !== 'super-admin' && !allowedRoles.includes(req.user.role)) {
      auditAction({
        user: req.user,
        action: 'unauthorized_access',
        module: 'rbac',
        description: `Blocked access to ${req.originalUrl}`,
        status: 'failed',
        ipAddress: req.ip,
        browser: req.get('user-agent'),
      }).catch(() => {});
      createAlert({
        alertType: 'unauthorized_access',
        severity: 'medium',
        title: 'Unauthorized access attempt',
        description: `${req.user.role} attempted to access ${req.originalUrl}`,
        userId: req.user.id,
        role: req.user.role,
        ipAddress: req.ip,
      }).catch(() => {});
      return sendError(res, 'You do not have permission to access this resource', 403);
    }

    return next();
  };

export const checkRole = authorize;
export const authorizeRole = authorize;

export const requireSuperAdmin = authorize('super-admin');
export const requireAdmin = authorize('super-admin', 'admin');
export const requireTeacher = authorize('super-admin', 'admin', 'teacher');
export const requireStudent = authorize('super-admin', 'admin', 'teacher', 'student');

export const checkPermissions =
  (...permissions) =>
  (req, res, next) => {
    const rolePermissions = ROLE_PERMISSIONS[req.user?.role] || [];
    const hasPermission = permissions.every((permission) =>
      rolePermissions.includes(permission),
    );
    const resource = req.originalUrl;

    if (process.env.NODE_ENV !== 'test') {
      permissions.forEach((permission) => {
        recordPermissionCheck({
          userId: req.user?.id,
          role: req.user?.role,
          permission,
          resource,
          allowed: rolePermissions.includes(permission),
          ipAddress: req.ip,
        }).catch(() => {});
      });
    }

    if (!hasPermission) {
      auditAction({
        user: req.user,
        action: 'missing_permission',
        module: 'permissions',
        description: `Missing permission for ${resource}`,
        status: 'failed',
        ipAddress: req.ip,
        browser: req.get('user-agent'),
        metadata: { permissions },
      }).catch(() => {});
      return sendError(res, 'Required permission is missing', 403);
    }

    return next();
  };
