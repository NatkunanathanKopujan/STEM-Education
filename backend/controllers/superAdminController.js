import { superAdminService } from '../services/superAdminService.js';
import { auditAction } from '../services/securityService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  browser: req.get('user-agent'),
});

export const superAdminController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.list(req.query),
        'Admins fetched successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.findById(req.params.id),
        'Admin fetched successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const admin = await superAdminService.create(req.body);
      await auditAction({
        user: req.user,
        action: 'admin_created',
        module: 'users',
        description: `Admin ${admin.fullName || admin.username || admin.id} created`,
        ...requestMeta(req),
        metadata: { targetUserId: admin.id, targetRole: 'admin' },
      });
      return sendSuccess(
        res,
        admin,
        'Admin created successfully',
        201,
      );
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const admin = await superAdminService.update(req.params.id, req.body);
      await auditAction({
        user: req.user,
        action: 'admin_updated',
        module: 'users',
        description: `Admin ${admin.fullName || admin.username || req.params.id} updated`,
        ...requestMeta(req),
        metadata: { targetUserId: Number(req.params.id), targetRole: 'admin' },
      });
      return sendSuccess(
        res,
        admin,
        'Admin updated successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const result = await superAdminService.remove(req.params.id);
      await auditAction({
        user: req.user,
        action: 'admin_deleted',
        module: 'users',
        description: `Admin ${req.params.id} deleted`,
        ...requestMeta(req),
        metadata: { targetUserId: Number(req.params.id), targetRole: 'admin' },
      });
      return sendSuccess(
        res,
        result,
        'Admin deleted successfully',
      );
    } catch (error) {
      return next(error);
    }
  },
};
