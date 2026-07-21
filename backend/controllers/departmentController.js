import { departmentService } from '../services/departmentService.js';
import { auditAction } from '../services/securityService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  browser: req.get('user-agent'),
});

export const departmentController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await departmentService.list(req.query), 'Departments fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      const department = await departmentService.findById(Number(req.params.id));
      return sendSuccess(res, department, 'Department fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const department = await departmentService.create(req.body, req.user);
      await auditAction({
        user: req.user,
        action: 'department_created',
        module: 'departments',
        description: `Department ${department.name} created`,
        ...requestMeta(req),
        metadata: { departmentId: department.id },
      });
      return sendSuccess(res, department, 'Department created successfully', 201);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const department = await departmentService.update(Number(req.params.id), req.body);
      await auditAction({
        user: req.user,
        action: 'department_updated',
        module: 'departments',
        description: `Department ${department.name} updated`,
        ...requestMeta(req),
        metadata: { departmentId: department.id, fields: Object.keys(req.body || {}) },
      });
      return sendSuccess(res, department, 'Department updated successfully');
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const result = await departmentService.remove(Number(req.params.id));
      await auditAction({
        user: req.user,
        action: 'department_deleted',
        module: 'departments',
        description: `Department ${req.params.id} deleted`,
        ...requestMeta(req),
        metadata: { departmentId: Number(req.params.id) },
      });
      return sendSuccess(res, result, 'Department deleted successfully');
    } catch (error) {
      return next(error);
    }
  },
};
