import { sendSuccess } from '../utils/apiResponse.js';
import {
  exportTeacherReport,
  getTeacherAnalyticsDashboard,
  getTeacherAttemptReview,
  getTeacherQuestionExposure,
  getTeacherReports,
  getTeacherStudentAnalytics,
  getTeacherTopicAnalytics,
} from '../services/teacherAnalyticsService.js';

export async function dashboardController(req, res, next) {
  try {
    const data = await getTeacherAnalyticsDashboard(req.user);
    return sendSuccess(res, data, 'Teacher analytics dashboard fetched');
  } catch (error) {
    return next(error);
  }
}

export async function studentAnalyticsController(req, res, next) {
  try {
    const data = await getTeacherStudentAnalytics(req.user, Number(req.params.id));
    return sendSuccess(res, data, 'Student analytics fetched');
  } catch (error) {
    return next(error);
  }
}

export async function topicAnalyticsController(req, res, next) {
  try {
    const data = await getTeacherTopicAnalytics(req.user);
    return sendSuccess(res, data, 'Topic analytics fetched');
  } catch (error) {
    return next(error);
  }
}

export async function questionExposureController(req, res, next) {
  try {
    const data = await getTeacherQuestionExposure(req.user);
    return sendSuccess(res, data, 'Question exposure analytics fetched');
  } catch (error) {
    return next(error);
  }
}

export async function reportsController(req, res, next) {
  try {
    const data = await getTeacherReports(req.user, req.query);
    return sendSuccess(res, data, 'Teacher reports fetched');
  } catch (error) {
    return next(error);
  }
}

export async function attemptReviewController(req, res, next) {
  try {
    const data = await getTeacherAttemptReview(req.user, Number(req.params.attemptId));
    return sendSuccess(res, data, 'Quiz attempt review fetched');
  } catch (error) {
    return next(error);
  }
}

export async function exportReportController(req, res, next) {
  try {
    const data = await exportTeacherReport(req.user, req.body);
    return sendSuccess(res, data, 'Teacher report export generated');
  } catch (error) {
    return next(error);
  }
}
