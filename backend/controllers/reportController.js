import {
  exportReport,
  getAiReports,
  getDashboardReport,
  getMaterialsReport,
  getQuizzesReport,
  getStudentsReport,
  getTeachersReport,
} from '../services/reportsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function dashboardReportController(req, res, next) {
  try {
    return sendSuccess(res, await getDashboardReport(req.user, req.query), 'Dashboard report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function studentsReportController(req, res, next) {
  try {
    return sendSuccess(res, await getStudentsReport(req.user, req.query), 'Student report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function teachersReportController(req, res, next) {
  try {
    return sendSuccess(res, await getTeachersReport(req.user, req.query), 'Teacher report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function quizzesReportController(req, res, next) {
  try {
    return sendSuccess(res, await getQuizzesReport(req.user, req.query), 'Quiz report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function materialsReportController(req, res, next) {
  try {
    return sendSuccess(res, await getMaterialsReport(req.user, req.query), 'Material report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function aiReportController(req, res, next) {
  try {
    return sendSuccess(res, await getAiReports(req.user, req.query), 'AI report fetched');
  } catch (error) {
    return next(error);
  }
}

export async function exportReportController(req, res, next) {
  try {
    const data = await exportReport(req.user, { ...req.query, ...req.body });
    return sendSuccess(res, data, 'Report export completed');
  } catch (error) {
    return next(error);
  }
}
