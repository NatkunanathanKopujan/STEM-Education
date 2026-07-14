import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  getAiReport,
  getDashboardCounts,
  getMaterialReport,
  getMonthlyActivity,
  getQuizReport,
  getStudentReport,
  getTeacherReport,
  recordGeneratedReport,
  recordReportExport,
  recordReportView,
} from '../repositories/reportsRepository.js';

function ensureAccess(user, reportType) {
  const access = {
    dashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    students: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    teachers: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    quizzes: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    materials: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER],
    ai: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER],
  };

  if (!access[reportType]?.includes(user.role)) {
    throw new AppError('You do not have permission to access this report', 403);
  }
}

function buildCsv(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => JSON.stringify(row[header] ?? '')).join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}

function flattenReport(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.attempts)) {
    return data.attempts;
  }

  if (Array.isArray(data?.providerUsage)) {
    return data.providerUsage;
  }

  return [data];
}

export async function getDashboardReport(user, filters = {}) {
  ensureAccess(user, 'dashboard');
  const [cards, monthlyActivity] = await Promise.all([
    getDashboardCounts(user),
    getMonthlyActivity(user),
  ]);

  await recordReportView({ userId: user.id, reportType: 'dashboard', filters });

  return {
    role: user.role,
    cards,
    charts: {
      monthlyActivity,
      systemUsage: [
        { name: 'Used', value: cards.systemUsage },
        { name: 'Available', value: 100 - cards.systemUsage },
      ],
      storageUsage: [
        { name: 'Used', value: cards.storageUsage },
        { name: 'Available', value: 100 - cards.storageUsage },
      ],
    },
    scheduledReports: {
      daily: false,
      weekly: false,
      monthly: false,
      emailReports: false,
    },
  };
}

export async function getStudentsReport(user, filters = {}) {
  ensureAccess(user, 'students');
  const data = await getStudentReport(user, filters);
  await recordReportView({ userId: user.id, reportType: 'students', filters });
  return { students: data };
}

export async function getTeachersReport(user, filters = {}) {
  ensureAccess(user, 'teachers');
  const data = await getTeacherReport(user, filters);
  await recordReportView({ userId: user.id, reportType: 'teachers', filters });
  return { teachers: data };
}

export async function getQuizzesReport(user, filters = {}) {
  ensureAccess(user, 'quizzes');
  const data = await getQuizReport(user, filters);
  await recordReportView({ userId: user.id, reportType: 'quizzes', filters });
  return data;
}

export async function getMaterialsReport(user, filters = {}) {
  ensureAccess(user, 'materials');
  const data = await getMaterialReport(user, filters);
  await recordReportView({ userId: user.id, reportType: 'materials', filters });
  return data;
}

export async function getAiReports(user, filters = {}) {
  ensureAccess(user, 'ai');
  const data = await getAiReport(user, filters);
  await recordReportView({ userId: user.id, reportType: 'ai', filters });
  return data;
}

export async function exportReport(user, { reportType = 'dashboard', format = 'csv', scope, filters } = {}) {
  const reportLoaders = {
    dashboard: getDashboardReport,
    students: getStudentsReport,
    teachers: getTeachersReport,
    quizzes: getQuizzesReport,
    materials: getMaterialsReport,
    ai: getAiReports,
  };
  const loader = reportLoaders[reportType] || getDashboardReport;
  const data = await loader(user, filters);
  const rows = flattenReport(data);
  const content = format === 'csv' ? buildCsv(rows) : JSON.stringify(data, null, 2);
  const extension = format === 'excel' ? 'xlsx' : format;
  const fileName = `${reportType}-${Date.now()}.${extension}`;

  await recordGeneratedReport({
    reportType,
    role: user.role,
    userId: user.id,
    filters,
    reportPayload: data,
  });
  await recordReportExport({
    reportType,
    format,
    scope,
    userId: user.id,
    role: user.role,
    fileName,
    filters,
  });

  return {
    fileName,
    format,
    mimeType:
      format === 'pdf'
        ? 'application/pdf'
        : format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
    content,
  };
}
