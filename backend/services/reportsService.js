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

function flattenObject(value, prefix = '', output = {}) {
  if (value === null || value === undefined) {
    output[prefix || 'value'] = '';
    return output;
  }

  if (Array.isArray(value)) {
    output[prefix || 'items'] = value
      .map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
      .join('; ');
    return output;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      flattenObject(nestedValue, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }

  output[prefix || 'value'] = value;
  return output;
}

function flattenReport(data) {
  if (Array.isArray(data)) {
    return data.map((item) => flattenObject(item));
  }

  if (Array.isArray(data?.attempts)) {
    return data.attempts.map((item) => flattenObject(item));
  }

  if (Array.isArray(data?.providerUsage)) {
    return data.providerUsage.map((item) => flattenObject(item));
  }

  return [flattenObject(data)];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildExcelHtml(rows, title) {
  const headers = Object.keys(rows[0] || {});
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><h1>${escapeHtml(title)}</h1><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

function escapePdfText(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function humanizeKey(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReportValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }

  return String(value);
}

function writePdfText(text, x, y, { size = 10, font = 'F1' } = {}) {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function drawLine(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function drawRect(x, y, width, height) {
  return `${x} ${y} ${width} ${height} re S`;
}

function renderPdfTable({ title, columns, rows, x = 40, y, widths, rowHeight = 22 }) {
  const commands = [];
  const tableWidth = widths.reduce((total, width) => total + width, 0);
  const tableHeight = rowHeight * (rows.length + 1);

  commands.push(writePdfText(title, x, y, { size: 12, font: 'F2' }));
  const top = y - 12;
  commands.push(drawRect(x, top - tableHeight, tableWidth, tableHeight));

  let currentX = x;
  widths.slice(0, -1).forEach((width) => {
    currentX += width;
    commands.push(drawLine(currentX, top, currentX, top - tableHeight));
  });

  for (let index = 1; index <= rows.length + 1; index += 1) {
    const lineY = top - index * rowHeight;
    commands.push(drawLine(x, lineY, x + tableWidth, lineY));
  }

  currentX = x;
  columns.forEach((column, index) => {
    commands.push(writePdfText(column, currentX + 5, top - 15, { size: 9, font: 'F2' }));
    currentX += widths[index];
  });

  rows.forEach((row, rowIndex) => {
    currentX = x;
    row.forEach((cell, cellIndex) => {
      const maxChars = Math.max(Math.floor(widths[cellIndex] / 5.4), 8);
      commands.push(
        writePdfText(formatReportValue(cell).slice(0, maxChars), currentX + 5, top - 15 - (rowIndex + 1) * rowHeight, {
          size: 9,
        }),
      );
      currentX += widths[cellIndex];
    });
  });

  return {
    commands,
    nextY: top - tableHeight - 26,
  };
}

function buildPdfDocument({ data, rows, reportType, title }) {
  const commands = [];
  let y = 760;

  commands.push(writePdfText('DBIT Learning Management System', 40, y, { size: 18, font: 'F2' }));
  y -= 24;
  commands.push(writePdfText(humanizeKey(title), 40, y, { size: 14, font: 'F2' }));
  y -= 18;
  commands.push(writePdfText(`Generated At: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, 40, y));
  y -= 14;
  commands.push(writePdfText(`Role Scope: ${data.role || '-'}`, 40, y));
  y -= 14;
  commands.push(drawLine(40, y, 560, y));
  y -= 24;

  if (reportType === 'dashboard') {
    const cards = data.cards || {};
    const summaryRows = [
      ['Total Users', cards.totalUsers],
      ['Total Admins', cards.totalAdmins],
      ['Total Teachers', cards.totalTeachers],
      ['Total Students', cards.totalStudents],
      ['Total Curriculums', cards.totalCurriculums],
      ['Learning Materials', cards.totalLearningMaterials],
      ['AI Questions', cards.totalAiQuestions],
      ['Quiz Attempts', cards.totalQuizAttempts],
      ['Monthly Active Users', cards.monthlyActiveUsers],
      ['Average Score', `${formatReportValue(cards.averageScore)}%`],
      ['Pass Rate', `${formatReportValue(cards.passRate)}%`],
    ];

    const summary = renderPdfTable({
      title: 'Summary',
      columns: ['Metric', 'Value'],
      rows: summaryRows,
      x: 40,
      y,
      widths: [330, 150],
    });
    commands.push(...summary.commands);
    y = summary.nextY;

    const monthlyActivity = (data.charts?.monthlyActivity || []).slice(-8);
    const monthly = renderPdfTable({
      title: 'Monthly Activity',
      columns: ['Month', 'Students', 'Teachers', 'Admins'],
      rows: monthlyActivity.length
        ? monthlyActivity.map((item) => [item.month, item.students, item.teachers, item.admins])
        : [['No data', '-', '-', '-']],
      x: 40,
      y,
      widths: [150, 110, 110, 110],
    });
    commands.push(...monthly.commands);
    y = monthly.nextY;

    const usageRows = [
      ...(data.charts?.systemUsage || []).map((item) => [`System ${item.name}`, `${formatReportValue(item.value)}%`]),
      ...(data.charts?.storageUsage || []).map((item) => [`Storage ${item.name}`, `${formatReportValue(item.value)}%`]),
    ];
    const usage = renderPdfTable({
      title: 'Usage Overview',
      columns: ['Area', 'Value'],
      rows: usageRows.length ? usageRows : [['No data', '-']],
      x: 40,
      y,
      widths: [330, 150],
    });
    commands.push(...usage.commands);
  } else {
    const headers = Object.keys(rows[0] || {}).slice(0, 4);
    const reportTable = renderPdfTable({
      title: 'Report Data',
      columns: headers.length ? headers.map(humanizeKey) : ['Message'],
      rows: headers.length
        ? rows.slice(0, 18).map((row) => headers.map((header) => row[header]))
        : [['No report data available']],
      x: 40,
      y,
      widths: headers.length ? [130, 120, 115, 115] : [480],
    });
    commands.push(...reportTable.commands);
  }

  const content = commands.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >> endobj',
    `6 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
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
  const normalizedFormat = ['pdf', 'excel', 'csv'].includes(format) ? format : 'csv';
  const title = `${reportType} report`;
  const exportContent = {
    csv: {
      content: buildCsv(rows),
      extension: 'csv',
      mimeType: 'text/csv',
      encoding: 'text',
    },
    excel: {
      content: buildExcelHtml(rows, title),
      extension: 'xls',
      mimeType: 'application/vnd.ms-excel',
      encoding: 'text',
    },
    pdf: {
      content: buildPdfDocument({ data, rows, reportType, title }).toString('base64'),
      extension: 'pdf',
      mimeType: 'application/pdf',
      encoding: 'base64',
    },
  }[normalizedFormat];
  const { content, extension, mimeType, encoding } = exportContent;
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
    format: normalizedFormat,
    scope,
    userId: user.id,
    role: user.role,
    fileName,
    filters,
  });

  return {
    fileName,
    format: normalizedFormat,
    mimeType,
    encoding,
    content,
  };
}
