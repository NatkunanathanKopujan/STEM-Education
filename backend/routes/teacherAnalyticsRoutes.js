import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import {
  attemptReviewController,
  dashboardController,
  exportReportController,
  questionExposureController,
  reportsController,
  studentAnalyticsController,
  topicAnalyticsController,
} from '../controllers/teacherAnalyticsController.js';
import { weeklyPlanController } from '../controllers/weeklyPlanController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  attemptReviewValidator,
  exportReportValidator,
  reportQueryValidator,
  studentAnalyticsValidator,
} from '../validators/teacherAnalyticsValidators.js';
import {
  weeklyPlanCreateValidator,
  weeklyPlanIdValidator,
  weeklyPlanQueryValidator,
  weeklyPlanUpdateValidator,
} from '../validators/weeklyPlanValidators.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER));

router.get('/analytics/dashboard', dashboardController);
router.get('/analytics/student/:id', studentAnalyticsValidator, validateRequest, studentAnalyticsController);
router.get('/analytics/topics', topicAnalyticsController);
router.get('/analytics/question-exposure', questionExposureController);
router.get('/analytics/reports', reportQueryValidator, validateRequest, reportsController);
router.get('/analytics/attempts/:attemptId/review', attemptReviewValidator, validateRequest, attemptReviewController);
router.post('/reports/export', exportReportValidator, validateRequest, exportReportController);
router.get('/weekly-plans', weeklyPlanQueryValidator, validateRequest, weeklyPlanController.index);
router.post('/weekly-plans', weeklyPlanCreateValidator, validateRequest, weeklyPlanController.create);
router.put('/weekly-plans/:id', weeklyPlanUpdateValidator, validateRequest, weeklyPlanController.update);
router.delete('/weekly-plans/:id', weeklyPlanIdValidator, validateRequest, weeklyPlanController.remove);

export default router;
