import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { teacherController } from '../controllers/teacherController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: teacherController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER],
  readPermissions: [PERMISSIONS.USERS_READ],
  writePermissions: [PERMISSIONS.USERS_WRITE],
});
