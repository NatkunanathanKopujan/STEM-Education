const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'docs', 'testing-procedures');
const screenshotDir = path.join(outputDir, 'screenshots');
const htmlPath = path.join(outputDir, 'DBITLMS_Testing_Procedures.html');
const pdfPath = path.join(outputDir, 'DBITLMS_Testing_Procedures.pdf');
const baseUrl = process.env.DBITLMS_BASE_URL || 'http://127.0.0.1:5173';
const browserExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((candidate) => fs.existsSync(candidate));

const users = {
  'super-admin': {
    id: 1,
    fullName: 'DBIT Super Admin',
    username: 'dbit2026',
    email: 'super.admin@example.invalid',
    role: 'super-admin',
    status: 'active',
  },
  admin: {
    id: 2,
    fullName: 'Academic Admin',
    username: 'admin.user',
    email: 'admin@dbit.edu',
    role: 'admin',
    status: 'active',
  },
  teacher: {
    id: 3,
    fullName: 'Teacher User',
    username: 'teacher.user',
    email: 'teacher@dbit.edu',
    role: 'teacher',
    status: 'active',
  },
  student: {
    id: 4,
    fullName: 'Student User',
    username: 'student.user',
    email: 'student@dbit.edu',
    role: 'student',
    status: 'active',
  },
};

const screenshotPlan = [
  {
    key: 'landing-ui',
    title: 'Public Landing Page and Navigation',
    path: '/',
    role: null,
  },
  {
    key: 'role-selection',
    title: 'Role Selection Login Entry',
    path: '/login',
    role: null,
  },
  {
    key: 'login-validation',
    title: 'Login Form Validation',
    path: '/login/student',
    role: null,
    action: async (page) => {
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    key: 'super-admin-dashboard',
    title: 'Super Admin Dashboard',
    path: '/super-admin/dashboard',
    role: 'super-admin',
  },
  {
    key: 'super-admin-crud',
    title: 'Super Admin Admin Management CRUD Area',
    path: '/super-admin/admins',
    role: 'super-admin',
  },
  {
    key: 'admin-dashboard',
    title: 'Admin Dashboard',
    path: '/admin/dashboard',
    role: 'admin',
  },
  {
    key: 'admin-teacher-management',
    title: 'Admin Teacher Management Search and Filters',
    path: '/admin/teachers',
    role: 'admin',
  },
  {
    key: 'teacher-dashboard',
    title: 'Teacher Dashboard',
    path: '/teacher/dashboard',
    role: 'teacher',
  },
  {
    key: 'teacher-materials',
    title: 'Teacher Learning Materials CRUD Area',
    path: '/teacher/materials',
    role: 'teacher',
  },
  {
    key: 'student-dashboard',
    title: 'Student Dashboard',
    path: '/student/dashboard',
    role: 'student',
  },
  {
    key: 'student-assignment-upload',
    title: 'Student Assignment Upload',
    path: '/student/assignments',
    role: 'student',
  },
  {
    key: 'global-search',
    title: 'Global Search, Filter, and Sorting',
    path: '/search',
    role: 'super-admin',
    action: async (page) => {
      const searchBox = page.getByRole('searchbox').first().or(page.getByPlaceholder(/search users/i).first());
      if (await searchBox.count()) {
        await searchBox.fill('student');
      }
      await page.waitForTimeout(700);
    },
  },
  {
    key: 'notifications',
    title: 'Notification Center',
    path: '/notifications',
    role: 'teacher',
  },
  {
    key: 'file-manager',
    title: 'File Upload, Download, Preview, and Versioning',
    path: '/files',
    role: 'super-admin',
  },
  {
    key: 'rbac-redirect',
    title: 'Role-Based Access Control Redirect',
    path: '/super-admin/admins',
    role: 'student',
  },
];

function ensureDirs() {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createToken(user) {
  const header = encodeBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeBase64Url({
    sub: String(user?.id || 0),
    role: user?.role || 'guest',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  });
  return `${header}.${payload}.documentation-signature`;
}

async function preparePage(page, role) {
  const user = role ? users[role] : null;

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/auth/verify')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { user } }),
      });
    }

    if (pathname.endsWith('/notifications')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            unreadCount: 2,
            notifications: [
              {
                id: 1,
                title: 'New assignment submitted',
                message: 'Student User submitted Week 1 assignment.',
                type: 'academic',
                priority: 'high',
                isRead: false,
                createdAt: new Date().toISOString(),
              },
              {
                id: 2,
                title: 'Security reminder',
                message: 'Review password and session activity weekly.',
                type: 'security',
                priority: 'medium',
                isRead: false,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    }

    if (pathname.endsWith('/files/storage/statistics')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            summary: {
              totalFiles: 8,
              totalStorageUsed: 24800000,
              averageFileSize: 3100000,
            },
            recentUploads: [{ id: 1 }, { id: 2 }],
            byType: [
              { fileType: 'pdf', storageUsed: 8400000 },
              { fileType: 'videos', storageUsed: 12200000 },
              { fileType: 'images', storageUsed: 4200000 },
            ],
          },
        }),
      });
    }

    if (pathname.endsWith('/files')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            files: [
              {
                id: 1,
                originalFileName: 'week-1-notes.pdf',
                owner: 'Teacher User',
                version: 2,
                logicalFolder: 'Computer Science / Week 1',
                fileType: 'pdf',
                fileSize: 1240000,
                visibility: 'public',
                downloadCount: 42,
                viewCount: 87,
              },
              {
                id: 2,
                originalFileName: 'student-lab-video.mp4',
                owner: 'Student User',
                version: 1,
                logicalFolder: 'Assignments / Videos',
                fileType: 'videos',
                fileSize: 18200000,
                visibility: 'restricted',
                downloadCount: 9,
                viewCount: 21,
              },
            ],
            total: 2,
            limit: 20,
          },
        }),
      });
    }

    if (pathname.endsWith('/search/suggestions')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            { title: 'Student records', category: 'users' },
            { title: 'Learning materials', category: 'learning_materials' },
          ],
          popularSearches: ['quiz results', 'weekly plan'],
          recentSearches: ['student'],
        }),
      });
    }

    if (pathname.endsWith('/search/history')) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ history: [] }) });
    }

    if (pathname.endsWith('/search/saved')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          savedSearches: [
            { id: 1, name: 'Weekly student review', searchTerm: 'student', filters: '{}', isPinned: true },
          ],
        }),
      });
    }

    if (pathname.endsWith('/search')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          query: url.searchParams.get('q') || 'student',
          total: 3,
          page: 1,
          limit: 20,
          groups: {
            users: [
              {
                id: 1,
                title: 'Student User',
                description: 'Active student profile assigned to Computer Science.',
                category: 'users',
                owner: 'Admin User',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                actionUrl: '/student/dashboard',
              },
            ],
            learning_materials: [
              {
                id: 2,
                title: 'Week 1 Notes',
                description: 'Published PDF learning material.',
                category: 'learning_materials',
                owner: 'Teacher User',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                actionUrl: '/files',
              },
            ],
          },
        }),
      });
    }

    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });

  if (user) {
    const token = createToken(user);
    await page.addInitScript(
      ({ storedUser, storedToken }) => {
        localStorage.setItem('ai_smart_lms_token', storedToken);
        localStorage.setItem('ai_smart_lms_user', JSON.stringify(storedUser));
        localStorage.setItem('ai_smart_lms_remember', 'true');
      },
      { storedUser: user, storedToken: token },
    );
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('ai_smart_lms_token');
      localStorage.removeItem('ai_smart_lms_user');
      localStorage.removeItem('ai_smart_lms_remember');
      sessionStorage.clear();
    });
  }
}

async function captureScreenshots() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable,
  });
  const captures = [];

  for (const item of screenshotPlan) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await preparePage(page, item.role);
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(
        () => {
          const text = document.body.innerText || '';
          return !text.includes('Loading LMS') && !text.includes('Verifying session');
        },
        null,
        { timeout: 15000 },
      )
      .catch(() => {});
    if (item.action) {
      await item.action(page);
    }
    await page.waitForTimeout(800);

    const filename = `${item.key}.png`;
    const filepath = path.join(screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    captures.push({ ...item, filename });
    await context.close();
  }

  await browser.close();
  return captures;
}

function imgTag(captures, key) {
  const capture = captures.find((item) => item.key === key);
  if (!capture) return '';
  const src = path.join('screenshots', capture.filename).replace(/\\/g, '/');
  return `<figure><img src="${src}" alt="${escapeHtml(capture.title)}" /><figcaption>${escapeHtml(capture.title)}</figcaption></figure>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rows(items) {
  return items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.area)}</td>
        <td>${escapeHtml(item.steps)}</td>
        <td>${escapeHtml(item.valid)}</td>
        <td>${escapeHtml(item.invalid)}</td>
        <td>${escapeHtml(item.expected)}</td>
      </tr>`,
    )
    .join('');
}

function checklist(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function buildHtml(captures) {
  const generatedAt = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const roleTests = [
    {
      id: 'SA-01',
      area: 'Super Admin login and dashboard',
      steps: 'Open /login, choose Super Admin, enter valid credentials, sign in, confirm dashboard cards and navigation.',
      valid: 'Use active super-admin email and password.',
      invalid: 'Use wrong password, inactive account, or different-role user.',
      expected: 'Valid login opens /super-admin/dashboard. Invalid login stays on login with a clear error.',
    },
    {
      id: 'SA-02',
      area: 'Super Admin CRUD',
      steps: 'Open Admin Management, create an admin, edit profile fields, change status, delete/archive if available.',
      valid: 'All required fields, unique email, strong temporary password.',
      invalid: 'Duplicate email, missing required fields, weak password.',
      expected: 'Valid changes persist and appear in table. Invalid data shows field-level validation.',
    },
    {
      id: 'AD-01',
      area: 'Admin teacher/student management',
      steps: 'Login as Admin, open Teacher Management and Student Management, run create, update, status change, search, and filter tests.',
      valid: 'Use permitted admin screens only.',
      invalid: 'Try opening Super Admin settings or security pages.',
      expected: 'Admin can manage assigned academic records and is redirected away from forbidden super-admin routes.',
    },
    {
      id: 'TE-01',
      area: 'Teacher materials, plans, marks, reports',
      steps: 'Login as Teacher, open Materials, Weekly Plan, Completed Topics, Quiz Analytics, Marks, and Reports.',
      valid: 'Upload allowed file types, enter complete plan fields, mark completed topics.',
      invalid: 'Upload blocked file type, missing topic/week, try admin-only pages.',
      expected: 'Teacher workflows succeed only within teacher permissions; invalid inputs show clear errors.',
    },
    {
      id: 'ST-01',
      area: 'Student learning workflow',
      steps: 'Login as Student, open dashboard, materials, notes, announcements, assignments, AI quiz, quiz history, results, and reports.',
      valid: 'View assigned content, upload assignment/video within accepted limits, submit quiz answers.',
      invalid: 'Access teacher/admin pages, upload unsupported file, submit incomplete quiz.',
      expected: 'Student sees only student routes and receives validation or redirect for invalid operations.',
    },
  ];

  const functionalTests = [
    {
      id: 'UI-01',
      area: 'Responsive UI',
      steps: 'Check landing, login, dashboard, forms, tables, and sidebars at desktop, laptop, tablet, and mobile widths.',
      valid: 'Viewport sizes 1440, 1280, 768, 390.',
      invalid: 'Force very long text, narrow sidebar, empty states.',
      expected: 'No overlapping text, broken tables, hidden buttons, or inaccessible menus.',
    },
    {
      id: 'FV-01',
      area: 'Form validation',
      steps: 'Submit every form empty, with invalid formats, with boundary lengths, and then with valid values.',
      valid: 'Required fields complete, email format correct, password length and file metadata valid.',
      invalid: 'Empty field, bad email, short password, duplicate username, invalid dates.',
      expected: 'Invalid fields block submission and show actionable messages; valid forms submit once.',
    },
    {
      id: 'NAV-01',
      area: 'Navigation',
      steps: 'Click each sidebar, header, footer, breadcrumb, pagination, modal close, and back link.',
      valid: 'Links available for the current role.',
      invalid: 'Manual URL entry to another role route or unknown path.',
      expected: 'Correct page loads; forbidden routes redirect; unknown routes show Not Found.',
    },
    {
      id: 'RBAC-01',
      area: 'Role-based access control',
      steps: 'For each role, manually visit every other role route and protected API endpoint.',
      valid: 'Authorized route and API request.',
      invalid: 'Student to admin route, teacher to super-admin route, admin to security settings.',
      expected: 'Frontend redirects and backend returns 401/403 without leaking restricted data.',
    },
    {
      id: 'CRUD-01',
      area: 'CRUD operations',
      steps: 'Create, read, update, delete/archive, bulk update, and refresh tables for admins, teachers, students, curriculum, materials, announcements.',
      valid: 'Unique records with valid references.',
      invalid: 'Duplicate keys, deleting records with dependencies, unauthorized update.',
      expected: 'Database state matches UI state; audit/security logs capture sensitive operations.',
    },
    {
      id: 'FILE-01',
      area: 'File upload/download',
      steps: 'Upload allowed PDF, image, Office, video; preview; download; version; delete/archive; retry failed upload.',
      valid: 'Allowed extension, safe size, required metadata.',
      invalid: 'Executable file, oversized file, missing metadata, interrupted network.',
      expected: 'Allowed files are stored and downloadable; blocked files fail safely with clear errors.',
    },
    {
      id: 'SEARCH-01',
      area: 'Search, filter, sorting',
      steps: 'Search users, files, courses, materials, quizzes; apply category/date/status filters and sort orders.',
      valid: 'Known searchable terms and allowed result categories.',
      invalid: 'No-match term, special characters, forbidden record for role.',
      expected: 'Relevant results only; filters reset correctly; unauthorized records stay hidden.',
    },
    {
      id: 'NOTIF-01',
      area: 'Notifications',
      steps: 'Create announcement or event, verify notification list, unread count, filter, mark read, mark all read, delete.',
      valid: 'Notification targeted to current role/user.',
      invalid: 'Unauthorized target, deleted notification, repeated mark-read request.',
      expected: 'Unread counts update and duplicate operations are harmless.',
    },
    {
      id: 'SEC-01',
      area: 'Security and permission',
      steps: 'Test login lockout, JWT expiry, session verification, password change, CORS, upload security, rate limiting.',
      valid: 'Authenticated request with active role.',
      invalid: 'Missing token, expired token, tampered token, wrong password, unsafe upload.',
      expected: 'Requests are rejected with 401/403/429 where appropriate and sensitive details are not exposed.',
    },
    {
      id: 'ERR-01',
      area: 'Error handling',
      steps: 'Turn off backend, use bad network, submit invalid payload, force 404/500 responses, test empty data states.',
      valid: 'Recover by restoring server and refreshing.',
      invalid: 'Server down, bad JSON, missing DB, unavailable AI provider.',
      expected: 'Friendly errors appear; app remains usable; logs contain diagnostics without secrets.',
    },
  ];

  const integrationTests = [
    {
      id: 'INT-01',
      area: 'Auth to role dashboard',
      steps: 'Login for every role and verify role-specific home path, sidebar, profile, and logout.',
      valid: 'Correct account-role pairing.',
      invalid: 'Login through the wrong role card.',
      expected: 'Role mismatch is blocked; correct role reaches its dashboard.',
    },
    {
      id: 'INT-02',
      area: 'Academic content workflow',
      steps: 'Admin creates curriculum, teacher uploads material and weekly plan, student views material and submits quiz/assignment.',
      valid: 'Linked curriculum, subject, teacher, and student.',
      invalid: 'Missing curriculum assignment or unpublished material.',
      expected: 'Content visibility follows assignments and publish status.',
    },
    {
      id: 'INT-03',
      area: 'Reporting workflow',
      steps: 'Generate activity, quiz, marks, material usage, and export reports for admin/teacher/student.',
      valid: 'Data exists for selected filters.',
      invalid: 'Empty filters, unauthorized report scope.',
      expected: 'Reports match source data and exports download successfully.',
    },
    {
      id: 'E2E-01',
      area: 'End-to-end acceptance path',
      steps: 'Super Admin creates Admin; Admin creates Teacher/Student; Teacher publishes material; Student completes learning and quiz; Teacher/Admin review reports.',
      valid: 'All users active and assigned.',
      invalid: 'Remove assignment or deactivate a user mid-flow.',
      expected: 'Happy path completes; invalid state produces controlled warnings or redirects.',
    },
  ];

  const regressionChecklist = [
    'Run backend unit/integration tests and frontend unit tests before every release.',
    'Run Playwright E2E workflow tests on desktop and mobile Chromium.',
    'Verify login, logout, protected routes, and role redirects for all roles.',
    'Verify dashboards load without console errors.',
    'Verify all create/edit/delete/archive flows preserve database integrity.',
    'Verify uploads, previews, downloads, and version history after storage changes.',
    'Verify search, filters, pagination, and sorting after API or UI updates.',
    'Verify security logs, audit logs, and health endpoints after backend changes.',
    'Verify responsive layouts after Tailwind/component changes.',
    'Confirm no secrets are committed in source or generated logs.',
  ];

  const acceptanceChecklist = [
    'All high-priority valid and invalid test cases pass.',
    'No critical or high severity security issue remains open.',
    'Super Admin, Admin, Teacher, and Student can complete their primary workflows.',
    'Role-based access control is enforced on both frontend and backend.',
    'Data created in the UI persists correctly in MySQL and appears in reports.',
    'File upload/download/preview works for approved file types and rejects unsafe files.',
    'The production build completes successfully.',
    'Health checks return structured status for system, database, storage, and AI.',
    'Backup and restore procedures are documented and smoke-tested.',
    'Final stakeholder review signs off the release.',
  ];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>DBITLMS Testing Procedures</title>
  <style>
    @page { margin: 18mm 14mm; }
    body { color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; margin: 0; }
    h1, h2, h3 { color: #111827; margin: 0 0 8px; }
    h1 { font-size: 28px; }
    h2 { border-bottom: 2px solid #f97316; font-size: 18px; margin-top: 24px; padding-bottom: 5px; }
    h3 { font-size: 13px; margin-top: 14px; }
    p { margin: 0 0 8px; }
    .cover { align-items: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; display: flex; gap: 18px; margin-bottom: 18px; padding: 20px; }
    .cover img { height: 88px; width: 88px; object-fit: contain; }
    .meta { color: #5b6472; font-size: 10px; }
    .note { background: #f8fafc; border-left: 4px solid #f97316; margin: 10px 0; padding: 10px; }
    table { border-collapse: collapse; margin: 10px 0 16px; table-layout: fixed; width: 100%; }
    th { background: #f1f5f9; color: #334155; font-size: 9px; text-align: left; text-transform: uppercase; }
    th, td { border: 1px solid #dbe3ef; padding: 6px; vertical-align: top; word-wrap: break-word; }
    td:first-child { color: #f97316; font-weight: 700; width: 8%; }
    figure { break-inside: avoid; margin: 12px 0 18px; }
    figure img { border: 1px solid #dbe3ef; border-radius: 8px; max-height: 500px; object-fit: contain; width: 100%; }
    figcaption { color: #64748b; font-size: 10px; margin-top: 5px; text-align: center; }
    ul { margin: 8px 0 16px 16px; padding: 0; }
    li { margin: 3px 0; }
    .page-break { break-before: page; }
  </style>
</head>
<body>
  <section class="cover">
    <img src="../../frontend/public/dbit-logo.png" alt="DBIT logo" />
    <div>
      <h1>DBITLMS Testing Procedures</h1>
      <p>Step-by-step testing guide with representative screenshots for the AI Smart Learning Management System.</p>
      <p class="meta">Generated: ${escapeHtml(generatedAt)} | Project folder: DBITLMS/lms</p>
    </div>
  </section>

  <h2>Purpose and Scope</h2>
  <p>This document explains how to test Super Admin, Admin, Teacher, and Student workflows across valid and invalid scenarios. It covers UI, validation, navigation, RBAC, CRUD, files, search, notifications, security, error handling, integration, end-to-end, regression, and final acceptance testing.</p>
  <div class="note"><strong>Testing rule:</strong> perform every valid case first, record baseline results, then run invalid and permission-denied cases. Log actual results, defects, browser, role, user, test data, and screenshot evidence.</div>
  ${imgTag(captures, 'landing-ui')}
  ${imgTag(captures, 'role-selection')}
  ${imgTag(captures, 'login-validation')}

  <h2>Role-Based Test Procedures</h2>
  <table>
    <thead><tr><th>ID</th><th>Area</th><th>Steps</th><th>Valid Scenario</th><th>Invalid Scenario</th><th>Expected Result</th></tr></thead>
    <tbody>${rows(roleTests)}</tbody>
  </table>
  ${imgTag(captures, 'super-admin-dashboard')}
  ${imgTag(captures, 'super-admin-crud')}
  ${imgTag(captures, 'admin-dashboard')}
  ${imgTag(captures, 'admin-teacher-management')}
  ${imgTag(captures, 'teacher-dashboard')}
  ${imgTag(captures, 'teacher-materials')}
  ${imgTag(captures, 'student-dashboard')}
  ${imgTag(captures, 'student-assignment-upload')}

  <h2 class="page-break">Functional Test Procedures</h2>
  <table>
    <thead><tr><th>ID</th><th>Area</th><th>Steps</th><th>Valid Scenario</th><th>Invalid Scenario</th><th>Expected Result</th></tr></thead>
    <tbody>${rows(functionalTests)}</tbody>
  </table>
  ${imgTag(captures, 'global-search')}
  ${imgTag(captures, 'notifications')}
  ${imgTag(captures, 'file-manager')}
  ${imgTag(captures, 'rbac-redirect')}

  <h2 class="page-break">Integration and End-to-End Procedures</h2>
  <table>
    <thead><tr><th>ID</th><th>Area</th><th>Steps</th><th>Valid Scenario</th><th>Invalid Scenario</th><th>Expected Result</th></tr></thead>
    <tbody>${rows(integrationTests)}</tbody>
  </table>

  <h2>Detailed Execution Notes</h2>
  <h3>UI Testing</h3>
  <p>Check visual alignment, readable text, empty/loading/error states, modals, buttons, icons, tables, sidebars, top navigation, and mobile menu. Capture screenshots before and after any defect fix.</p>
  <h3>Form Validation Testing</h3>
  <p>For every input, test required, minimum length, maximum length, format, unique value, numeric range, date range, file type, and server-side validation. Confirm keyboard tab order and screen-reader labels.</p>
  <h3>CRUD Operation Testing</h3>
  <p>Record the database row or API response after create, update, delete/archive, bulk operations, and refresh. Check audit log entries for sensitive actions.</p>
  <h3>Security and Permission Testing</h3>
  <p>Use a matrix of user role versus route/API. Confirm unauthorized access is denied in the browser and from direct API calls. Include expired JWT, missing token, tampered token, and inactive account tests.</p>
  <h3>Error Handling Testing</h3>
  <p>Simulate backend unavailability, MySQL downtime, invalid upload, rate-limit responses, AI provider unavailable, and malformed API responses. Expected behavior is friendly UI feedback and no secret leakage.</p>

  <h2 class="page-break">Regression Testing Checklist</h2>
  ${checklist(regressionChecklist)}

  <h2>Final Acceptance Testing Checklist</h2>
  ${checklist(acceptanceChecklist)}

  <h2>Evidence Log Template</h2>
  <table>
    <thead><tr><th>Test ID</th><th>Role</th><th>Tester</th><th>Date</th><th>Actual Result</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Pass / Fail</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Pass / Fail</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Pass / Fail</td></tr>
    </tbody>
  </table>
</body>
</html>`;
}

async function renderPdf() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable,
  });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
  });
  await browser.close();
}

(async () => {
  ensureDirs();
  const captures = await captureScreenshots();
  fs.writeFileSync(htmlPath, buildHtml(captures), 'utf8');
  await renderPdf();
  console.log(`Created ${pdfPath}`);
})();
