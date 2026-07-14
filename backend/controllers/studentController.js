import { studentService } from '../services/studentService.js';
import { createUserManagementController } from './userManagementControllerFactory.js';

export const studentController = createUserManagementController(studentService, 'Student');
