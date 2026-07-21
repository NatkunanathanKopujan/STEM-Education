import { curriculumService } from '../services/curriculumService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { auditAction } from '../services/securityService.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  browser: req.get('user-agent'),
});

export const curriculumController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.list(req.query), 'Curriculums fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      const curriculum = await curriculumService.findById(req.params.id);
      await auditAction({
        user: req.user,
        action: 'curriculum_viewed',
        module: 'curriculum',
        description: `Curriculum ${curriculum.name || req.params.id} viewed`,
        ...requestMeta(req),
        metadata: { curriculumId: Number(req.params.id) },
      });
      return sendSuccess(res, curriculum, 'Curriculum fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const curriculum = await curriculumService.create(req.body, req.user);
      await auditAction({
        user: req.user,
        action: 'curriculum_created',
        module: 'curriculum',
        description: `Curriculum ${curriculum.name || curriculum.id} created`,
        ...requestMeta(req),
        metadata: { curriculumId: curriculum.id },
      });
      return sendSuccess(res, curriculum, 'Curriculum created successfully', 201);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const curriculum = await curriculumService.update(req.params.id, req.body);
      await auditAction({
        user: req.user,
        action: 'curriculum_updated',
        module: 'curriculum',
        description: `Curriculum ${curriculum.name || req.params.id} updated`,
        ...requestMeta(req),
        metadata: { curriculumId: Number(req.params.id) },
      });
      return sendSuccess(res, curriculum, 'Curriculum updated successfully');
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const result = await curriculumService.remove(req.params.id);
      await auditAction({
        user: req.user,
        action: 'curriculum_deleted',
        module: 'curriculum',
        description: `Curriculum ${req.params.id} deleted`,
        ...requestMeta(req),
        metadata: { curriculumId: Number(req.params.id) },
      });
      return sendSuccess(res, result, 'Curriculum deleted successfully');
    } catch (error) {
      return next(error);
    }
  },
};
