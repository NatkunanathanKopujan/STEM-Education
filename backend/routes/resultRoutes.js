import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { resultController } from '../controllers/resultController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: resultController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  readPermissions: [PERMISSIONS.REPORTS_READ],
});
