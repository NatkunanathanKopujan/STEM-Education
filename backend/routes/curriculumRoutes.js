import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { curriculumController } from '../controllers/curriculumController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: curriculumController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  readPermissions: [PERMISSIONS.CURRICULUM_READ],
  writePermissions: [PERMISSIONS.CURRICULUM_WRITE],
});
