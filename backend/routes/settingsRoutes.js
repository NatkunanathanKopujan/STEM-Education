import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { settingsController } from '../controllers/settingsController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: settingsController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  writePermissions: [PERMISSIONS.SETTINGS_WRITE],
});
