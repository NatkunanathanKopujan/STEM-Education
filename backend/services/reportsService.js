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

function normalizeCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
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

function rowsFromObjects(items = []) {
  return items.map((item) => flattenObject(item));
}

function createSections(reportType, data, rows) {
  if (reportType === 'dashboard') {
    const cards = data.cards || {};
    return [
      {
        title: 'Dashboard Summary',
        rows: [
          { metric: 'Total Users', value: cards.totalUsers },
          { metric: 'Total Admins', value: cards.totalAdmins },
          { metric: 'Total Teachers', value: cards.totalTeachers },
          { metric: 'Total Students', value: cards.totalStudents },
          { metric: 'Total Curriculums', value: cards.totalCurriculums },
          { metric: 'Learning Materials', value: cards.totalLearningMaterials },
          { metric: 'AI Questions', value: cards.totalAiQuestions },
          { metric: 'Quiz Attempts', value: cards.totalQuizAttempts },
          { metric: 'Monthly Active Users', value: cards.monthlyActiveUsers },
          { metric: 'Average Score', value: `${formatReportValue(cards.averageScore)}%` },
          { metric: 'Pass Rate', value: `${formatReportValue(cards.passRate)}%` },
          { metric: 'System Usage', value: `${formatReportValue(cards.systemUsage)}%` },
          { metric: 'Storage Usage', value: `${formatReportValue(cards.storageUsage)}%` },
        ],
      },
      {
        title: 'Monthly Activity',
        rows: rowsFromObjects(data.charts?.monthlyActivity || []),
      },
      {
        title: 'System Usage',
        rows: rowsFromObjects(data.charts?.systemUsage || []),
      },
      {
        title: 'Storage Usage',
        rows: rowsFromObjects(data.charts?.storageUsage || []),
      },
    ];
  }

  if (reportType === 'students') {
    return [{ title: 'Student Report', rows: rowsFromObjects(data.students || []) }];
  }

  if (reportType === 'teachers') {
    return [{ title: 'Teacher Report', rows: rowsFromObjects(data.teachers || []) }];
  }

  if (reportType === 'quizzes') {
    return [
      { title: 'Quiz Attempts', rows: rowsFromObjects(data.attempts || []) },
      { title: 'Difficulty Analysis', rows: rowsFromObjects(data.difficultyAnalysis || []) },
      { title: 'Topic Analysis', rows: rowsFromObjects(data.topicAnalysis || []) },
      { title: 'Quiz Summary', rows: rowsFromObjects([data.summary || {}]) },
    ];
  }

  if (reportType === 'materials') {
    return [
      { title: 'Uploaded Files', rows: rowsFromObjects(data.files || []) },
      { title: 'Storage By File Type', rows: rowsFromObjects(data.materialTypes || []) },
      { title: 'Uploader Activity', rows: rowsFromObjects(data.teacherActivity || []) },
    ];
  }

  if (reportType === 'ai') {
    return [
      { title: 'AI Provider Usage', rows: rowsFromObjects(data.providerUsage || []) },
      { title: 'AI Question Quality', rows: rowsFromObjects([data.questionQuality || {}]) },
    ];
  }

  return [{ title: humanizeKey(reportType), rows }];
}

function buildCsvSections(sections) {
  return sections
    .map((section) => {
      const rows = section.rows || [];
      if (!rows.length) {
        return `${JSON.stringify(section.title)}\n"No data available"`;
      }

      const headers = Object.keys(rows[0]);
      const lines = rows.map((row) =>
        headers.map((header) => JSON.stringify(normalizeCell(row[header]) ?? '')).join(','),
      );
      return [JSON.stringify(section.title), headers.join(','), ...lines].join('\n');
    })
    .join('\n\n');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildExcelSections(sections, title) {
  const tables = sections
    .map((section) => {
      const rows = section.rows || [];
      const headers = Object.keys(rows[0] || {});
      if (!rows.length) {
        return `<h2>${escapeHtml(section.title)}</h2><p>No data available</p>`;
      }

      const head = headers.map((header) => `<th>${escapeHtml(humanizeKey(header))}</th>`).join('');
      const body = rows
        .map(
          (row) =>
            `<tr>${headers
              .map((header) => `<td>${escapeHtml(normalizeCell(row[header]))}</td>`)
              .join('')}</tr>`,
        )
        .join('');

      return `<h2>${escapeHtml(section.title)}</h2><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join('<br />');

  return `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:"Times New Roman",serif;}h1{font-size:22px;}h2{font-size:16px;margin-top:18px;}table{border-collapse:collapse;width:100%;}th,td{padding:6px;border:1px solid #222;}th{background:#f3f4f6;font-weight:bold;}</style></head><body><h1>${escapeHtml(title)}</h1>${tables}</body></html>`;
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

function renderPdfTable({ title, columns, rows, x = 40, y, widths, rowHeight = 22, fontSize = 9 }) {
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
    commands.push(writePdfText(column, currentX + 4, top - 14, { size: fontSize, font: 'F2' }));
    currentX += widths[index];
  });

  rows.forEach((row, rowIndex) => {
    currentX = x;
    row.forEach((cell, cellIndex) => {
      const maxChars = Math.max(Math.floor(widths[cellIndex] / 5.4), 8);
      commands.push(
        writePdfText(formatReportValue(cell).slice(0, maxChars), currentX + 4, top - 14 - (rowIndex + 1) * rowHeight, {
          size: fontSize,
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

function createPdfBuffer(pageCommands) {
  const objects = [
    { id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    {
      id: 2,
      body: `<< /Type /Pages /Kids [${pageCommands.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pageCommands.length} >>`,
    },
    { id: 3, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>' },
    { id: 4, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>' },
  ];

  pageCommands.forEach((commands, index) => {
    const pageId = 5 + index * 2;
    const contentId = pageId + 1;
    const content = commands.join('\n');
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    });
    objects.push({
      id: contentId,
      body: `<< /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream`,
    });
  });

  objects.sort((left, right) => left.id - right.id);
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets[object.id] = Buffer.byteLength(pdf);
    pdf += `${object.id} 0 obj ${object.body} endobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  const maxObjectId = Math.max(...objects.map((object) => object.id));
  pdf += `xref\n0 ${maxObjectId + 1}\n0000000000 65535 f \n`;

  for (let id = 1; id <= maxObjectId; id += 1) {
    pdf += `${String(offsets[id] || 0).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildPdfDocument({ data, rows, reportType, title }) {
  const pages = [[]];
  let commands = pages[0];
  let y = 760;

  const addPage = () => {
    pages.push([]);
    commands = pages[pages.length - 1];
    y = 760;
  };

  const ensureSpace = (height) => {
    if (y - height < 45) {
      addPage();
    }
  };

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

  const sections = createSections(reportType, data, rows);

  for (const section of sections) {
    const sectionRows = section.rows?.length ? section.rows : [{ message: 'No data available' }];
    const headers = Object.keys(sectionRows[0] || {});
    const headerChunks = chunkArray(headers, 5);

    for (const [chunkIndex, headerChunk] of headerChunks.entries()) {
      const pdfRows = sectionRows.map((row) => headerChunk.map((header) => normalizeCell(row[header])));
      const widths = Array(headerChunk.length).fill(Math.floor(500 / Math.max(headerChunk.length, 1)));
      const tableTitle = chunkIndex
        ? `${section.title} - Continued Columns ${chunkIndex + 1}`
        : section.title;

      for (let start = 0; start < pdfRows.length; start += 24) {
        const pageRows = pdfRows.slice(start, start + 24);
        ensureSpace(44 + pageRows.length * 18);
        const table = renderPdfTable({
          title: start ? `${tableTitle} - Continued Rows` : tableTitle,
          columns: headerChunk.map(humanizeKey),
          rows: pageRows,
          x: 40,
          y,
          widths,
          rowHeight: 18,
          fontSize: 7,
        });
        commands.push(...table.commands);
        y = table.nextY;
      }
    }
  }

  return createPdfBuffer(pages);
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
  const sections = createSections(reportType, data, rows);
  const normalizedFormat = ['pdf', 'excel', 'csv'].includes(format) ? format : 'csv';
  const title = `${reportType} report`;
  const exportContent = {
    csv: {
      content: buildCsvSections(sections),
      extension: 'csv',
      mimeType: 'text/csv',
      encoding: 'text',
    },
    excel: {
      content: buildExcelSections(sections, title),
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
