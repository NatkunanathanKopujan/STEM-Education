import { teacherService } from '../services/teacherService.js';
import { createUserManagementController } from './userManagementControllerFactory.js';

export const teacherController = createUserManagementController(teacherService, 'Teacher');
