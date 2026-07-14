import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { studentController } from '../controllers/studentController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: studentController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  readPermissions: [PERMISSIONS.USERS_READ],
  writePermissions: [PERMISSIONS.USERS_WRITE],
});
