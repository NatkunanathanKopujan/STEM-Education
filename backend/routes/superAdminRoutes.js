import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { superAdminController } from '../controllers/superAdminController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: superAdminController,
  allowedRoles: [ROLES.SUPER_ADMIN],
  readPermissions: [PERMISSIONS.USERS_READ],
  writePermissions: [PERMISSIONS.USERS_WRITE],
});
