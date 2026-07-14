import { Router } from 'express';
import {
  aiReportController,
  dashboardReportController,
  exportReportController,
  materialsReportController,
  quizzesReportController,
  studentsReportController,
  teachersReportController,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { reportExportValidator, reportFilterValidator } from '../validators/reportValidators.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', reportFilterValidator, validateRequest, dashboardReportController);
router.get('/students', reportFilterValidator, validateRequest, studentsReportController);
router.get('/teachers', reportFilterValidator, validateRequest, teachersReportController);
router.get('/quizzes', reportFilterValidator, validateRequest, quizzesReportController);
router.get('/materials', reportFilterValidator, validateRequest, materialsReportController);
router.get('/ai', reportFilterValidator, validateRequest, aiReportController);
router.get('/export', reportFilterValidator, validateRequest, exportReportController);
router.post('/export/pdf', reportExportValidator, validateRequest, exportReportController);
router.post('/export/excel', reportExportValidator, validateRequest, exportReportController);
router.post('/export/csv', reportExportValidator, validateRequest, exportReportController);

export default router;
