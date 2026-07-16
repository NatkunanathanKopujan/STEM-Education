import { adminService } from '../services/adminService.js';
import { createUserManagementController } from './userManagementControllerFactory.js';

export const adminController = createUserManagementController(adminService, 'Admin');
