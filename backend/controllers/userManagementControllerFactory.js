import { sendSuccess } from '../utils/apiResponse.js';
import { auditAction } from '../services/securityService.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  browser: req.get('user-agent'),
});

export function createUserManagementController(service, label) {
  return {
    index: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.list(req.query), `${label}s fetched successfully`);
      } catch (error) {
        return next(error);
      }
    },

    show: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.findById(req.params.id), `${label} fetched successfully`);
      } catch (error) {
        return next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const created = await service.create(req.body);
        await auditAction({
          user: req.user,
          action: `${label.toLowerCase()}_created`,
          module: 'users',
          description: `${label} ${created.fullName || created.username || created.id} created`,
          ...requestMeta(req),
          metadata: { targetUserId: created.id, targetRole: label.toLowerCase() },
        });
        return sendSuccess(res, created, `${label} created successfully`, 201);
      } catch (error) {
        return next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const updated = await service.update(req.params.id, req.body);
        await auditAction({
          user: req.user,
          action: `${label.toLowerCase()}_updated`,
          module: 'users',
          description: `${label} ${updated.fullName || updated.username || req.params.id} updated`,
          ...requestMeta(req),
          metadata: { targetUserId: Number(req.params.id), targetRole: label.toLowerCase() },
        });
        return sendSuccess(res, updated, `${label} updated successfully`);
      } catch (error) {
        return next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        const result = await service.remove(req.params.id);
        await auditAction({
          user: req.user,
          action: `${label.toLowerCase()}_deleted`,
          module: 'users',
          description: `${label} ${req.params.id} deleted`,
          ...requestMeta(req),
          metadata: { targetUserId: Number(req.params.id), targetRole: label.toLowerCase() },
        });
        return sendSuccess(res, result, `${label} deleted successfully`);
      } catch (error) {
        return next(error);
      }
    },
  };
}
