import { sendSuccess } from '../utils/apiResponse.js';

export function createModuleController(moduleName) {
  return {
    index: async (_req, res) =>
      sendSuccess(res, { module: moduleName, status: 'ready' }, `${moduleName} API ready`),
    show: async (req, res) =>
      sendSuccess(
        res,
        { module: moduleName, id: req.params.id },
        `${moduleName} detail endpoint ready`,
      ),
    create: async (_req, res) =>
      sendSuccess(res, null, `${moduleName} create endpoint ready`, 201),
    update: async (req, res) =>
      sendSuccess(
        res,
        { module: moduleName, id: req.params.id },
        `${moduleName} update endpoint ready`,
      ),
    remove: async (req, res) =>
      sendSuccess(
        res,
        { module: moduleName, id: req.params.id },
        `${moduleName} delete endpoint ready`,
      ),
  };
}
