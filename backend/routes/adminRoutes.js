import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { adminController } from '../controllers/adminController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: adminController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  readPermissions: [PERMISSIONS.USERS_READ],
  writePermissions: [PERMISSIONS.USERS_WRITE],
});
