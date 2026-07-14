import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { quizController } from '../controllers/quizController.js';
import { createCrudRoutes } from './createCrudRoutes.js';

export default createCrudRoutes({
  controller: quizController,
  allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  readPermissions: [PERMISSIONS.QUIZ_READ],
  writePermissions: [PERMISSIONS.QUIZ_WRITE],
});
