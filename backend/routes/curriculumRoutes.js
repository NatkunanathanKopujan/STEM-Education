import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { curriculumController } from '../controllers/curriculumController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { emptyBodyValidator, idParamValidator, moduleIdParamValidator, paginationValidator } from '../validators/commonValidators.js';

const router = Router();
const readAccess = checkPermissions(PERMISSIONS.CURRICULUM_READ);
const writeAccess = checkPermissions(PERMISSIONS.CURRICULUM_WRITE);

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER));

router.get('/', paginationValidator, validateRequest, readAccess, curriculumController.index);
router.post('/', emptyBodyValidator, validateRequest, writeAccess, curriculumController.create);

router.get('/:id/modules', idParamValidator, validateRequest, readAccess, curriculumController.listModules);
router.post('/:id/modules', idParamValidator, emptyBodyValidator, validateRequest, writeAccess, curriculumController.createModule);
router.put('/:id/modules/:moduleId', idParamValidator, moduleIdParamValidator, validateRequest, writeAccess, curriculumController.updateModule);
router.delete('/:id/modules/:moduleId', idParamValidator, moduleIdParamValidator, validateRequest, writeAccess, curriculumController.removeModule);

router.get('/:id', idParamValidator, validateRequest, readAccess, curriculumController.show);
router.put('/:id', idParamValidator, validateRequest, writeAccess, curriculumController.update);
router.delete('/:id', idParamValidator, validateRequest, writeAccess, curriculumController.remove);

export default router;
