import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { materialController } from '../controllers/materialController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: materialController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  readPermissions: [PERMISSIONS.MATERIALS_READ],
  writePermissions: [PERMISSIONS.MATERIALS_WRITE],
});
