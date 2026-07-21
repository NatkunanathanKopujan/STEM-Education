import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { Loader } from '../components/ui/Loader';
import { USER_ROLES } from '../utils/constants';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRedirect } from './RoleRedirect';

const LandingPage = lazy(() =>
  import('../pages/public/LandingPage').then((module) => ({ default: module.LandingPage })),
);
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const RoleSelectionPage = lazy(() =>
  import('../pages/auth/RoleSelectionPage').then((module) => ({
    default: module.RoleSelectionPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('../pages/auth/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ProfilePage = lazy(() =>
  import('../pages/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const UserSettingsPage = lazy(() =>
  import('../pages/profile/UserSettingsPage').then((module) => ({ default: module.UserSettingsPage })),
);
const NotificationCenterPage = lazy(() =>
  import('../pages/notifications/NotificationCenterPage').then((module) => ({
    default: module.NotificationCenterPage,
  })),
);
const AnnouncementCenterPage = lazy(() =>
  import('../pages/notifications/AnnouncementCenterPage').then((module) => ({
    default: module.AnnouncementCenterPage,
  })),
);
const NotificationPreferencesPage = lazy(() =>
  import('../pages/notifications/NotificationPreferencesPage').then((module) => ({
    default: module.NotificationPreferencesPage,
  })),
);
const SearchPage = lazy(() =>
  import('../pages/search/SearchPage').then((module) => ({ default: module.SearchPage })),
);
const SearchAnalyticsPage = lazy(() =>
  import('../pages/search/SearchAnalyticsPage').then((module) => ({
    default: module.SearchAnalyticsPage,
  })),
);
const FileManagerPage = lazy(() =>
  import('../pages/files/FileManagerPage').then((module) => ({ default: module.FileManagerPage })),
);
const SecurityDashboardPage = lazy(() =>
  import('../pages/security/SecurityDashboardPage').then((module) => ({
    default: module.SecurityDashboardPage,
  })),
);
const PerformanceDashboardPage = lazy(() =>
  import('../pages/performance/PerformanceDashboardPage').then((module) => ({
    default: module.PerformanceDashboardPage,
  })),
);
const SuperAdminDashboardPage = lazy(() =>
  import('../pages/super-admin/SuperAdminDashboardPage').then((module) => ({
    default: module.SuperAdminDashboardPage,
  })),
);
const AdminManagementPage = lazy(() =>
  import('../pages/super-admin/AdminManagementPage').then((module) => ({
    default: module.AdminManagementPage,
  })),
);
const UserOverviewPage = lazy(() =>
  import('../pages/super-admin/UserOverviewPage').then((module) => ({
    default: module.UserOverviewPage,
  })),
);
const CurriculumOverviewPage = lazy(() =>
  import('../pages/super-admin/CurriculumOverviewPage').then((module) => ({
    default: module.CurriculumOverviewPage,
  })),
);
const ReportsPage = lazy(() =>
  import('../pages/super-admin/ReportsPage').then((module) => ({ default: module.ReportsPage })),
);
const AIMonitoringPage = lazy(() =>
  import('../pages/super-admin/AIMonitoringPage').then((module) => ({
    default: module.AIMonitoringPage,
  })),
);
const AuditLogsPage = lazy(() =>
  import('../pages/super-admin/AuditLogsPage').then((module) => ({
    default: module.AuditLogsPage,
  })),
);
const SystemSettingsPage = lazy(() =>
  import('../pages/super-admin/SystemSettingsPage').then((module) => ({
    default: module.SystemSettingsPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const PeopleManagementPage = lazy(() =>
  import('../pages/admin/PeopleManagementPage').then((module) => ({
    default: module.PeopleManagementPage,
  })),
);
const DepartmentManagementPage = lazy(() =>
  import('../pages/admin/DepartmentManagementPage').then((module) => ({
    default: module.DepartmentManagementPage,
  })),
);
const CurriculumManagementPage = lazy(() =>
  import('../pages/admin/CurriculumManagementPage').then((module) => ({
    default: module.CurriculumManagementPage,
  })),
);
const LearningMaterialsOverviewPage = lazy(() =>
  import('../pages/admin/LearningMaterialsOverviewPage').then((module) => ({
    default: module.LearningMaterialsOverviewPage,
  })),
);
const AdminReportsPage = lazy(() =>
  import('../pages/admin/AdminReportsPage').then((module) => ({
    default: module.AdminReportsPage,
  })),
);
const TeacherDashboardPage = lazy(() =>
  import('../pages/teacher/TeacherDashboardPage').then((module) => ({ default: module.TeacherDashboardPage })),
);
const TeacherStudentsPage = lazy(() =>
  import('../pages/teacher/TeacherStudentsPage').then((module) => ({ default: module.TeacherStudentsPage })),
);
const TeacherContentPage = lazy(() =>
  import('../pages/teacher/TeacherContentPage').then((module) => ({ default: module.TeacherContentPage })),
);
const WeeklyPlanPage = lazy(() =>
  import('../pages/teacher/WeeklyPlanPage').then((module) => ({ default: module.WeeklyPlanPage })),
);
const CompletedTopicsPage = lazy(() =>
  import('../pages/teacher/CompletedTopicsPage').then((module) => ({ default: module.CompletedTopicsPage })),
);
const QuizAnalyticsPage = lazy(() =>
  import('../pages/teacher/QuizAnalyticsPage').then((module) => ({ default: module.QuizAnalyticsPage })),
);
const TeacherReportsPage = lazy(() =>
  import('../pages/teacher/TeacherReportsPage').then((module) => ({
    default: module.TeacherReportsPage,
  })),
);
const StudentMarksPage = lazy(() =>
  import('../pages/teacher/StudentMarksPage').then((module) => ({ default: module.StudentMarksPage })),
);
const StudentDashboardPage = lazy(() =>
  import('../pages/student/StudentDashboardPage').then((module) => ({ default: module.StudentDashboardPage })),
);
const StudentCurriculumPage = lazy(() =>
  import('../pages/student/StudentCurriculumPage').then((module) => ({ default: module.StudentCurriculumPage })),
);
const StudentMaterialsPage = lazy(() =>
  import('../pages/student/StudentMaterialsPage').then((module) => ({ default: module.StudentMaterialsPage })),
);
const StudentVideosPage = lazy(() =>
  import('../pages/student/StudentVideosPage').then((module) => ({ default: module.StudentVideosPage })),
);
const StudentNotesPage = lazy(() =>
  import('../pages/student/StudentNotesPage').then((module) => ({ default: module.StudentNotesPage })),
);
const StudentAnnouncementsPage = lazy(() =>
  import('../pages/student/StudentAnnouncementsPage').then((module) => ({ default: module.StudentAnnouncementsPage })),
);
const AssignmentUploadPage = lazy(() =>
  import('../pages/student/AssignmentUploadPage').then((module) => ({ default: module.AssignmentUploadPage })),
);
const AIQuizEntryPage = lazy(() =>
  import('../pages/student/AIQuizEntryPage').then((module) => ({ default: module.AIQuizEntryPage })),
);
const StudentQuizAttemptPage = lazy(() =>
  import('../pages/student/StudentQuizAttemptPage').then((module) => ({
    default: module.StudentQuizAttemptPage,
  })),
);
const QuizHistoryPage = lazy(() =>
  import('../pages/student/QuizHistoryPage').then((module) => ({ default: module.QuizHistoryPage })),
);
const StudentResultsPage = lazy(() =>
  import('../pages/student/StudentResultsPage').then((module) => ({ default: module.StudentResultsPage })),
);
const StudentReportsPage = lazy(() =>
  import('../pages/student/StudentReportsPage').then((module) => ({
    default: module.StudentReportsPage,
  })),
);
const StudentQuizResultPage = lazy(() =>
  import('../pages/student/StudentQuizResultPage').then((module) => ({
    default: module.StudentQuizResultPage,
  })),
);
const StudentQuizReviewPage = lazy(() =>
  import('../pages/student/StudentQuizReviewPage').then((module) => ({
    default: module.StudentQuizReviewPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader label="Loading LMS" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<RoleSelectionPage />} />
          <Route path="/login/:role" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app" element={<RoleRedirect />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<UserSettingsPage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/announcements" element={<AnnouncementCenterPage />} />
            <Route path="/notification-preferences" element={<NotificationPreferencesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/files" element={<FileManagerPage />} />

            <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]} />}>
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route
                path="/super-admin/dashboard"
                element={<SuperAdminDashboardPage />}
              />
              <Route path="/super-admin/admins" element={<AdminManagementPage />} />
              <Route path="/super-admin/users" element={<UserOverviewPage />} />
              <Route path="/super-admin/curriculums" element={<CurriculumOverviewPage />} />
              <Route path="/super-admin/reports" element={<ReportsPage />} />
              <Route path="/super-admin/ai-monitoring" element={<AIMonitoringPage />} />
              <Route path="/super-admin/search-analytics" element={<SearchAnalyticsPage />} />
              <Route path="/super-admin/security" element={<SecurityDashboardPage />} />
              <Route path="/super-admin/performance" element={<PerformanceDashboardPage />} />
              <Route path="/super-admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/super-admin/settings" element={<SystemSettingsPage />} />
              <Route path="/super-admin/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} allowSuperAdmin={false} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={<AdminDashboardPage />}
              />
              <Route path="/admin/teachers" element={<PeopleManagementPage type="teacher" />} />
              <Route path="/admin/students" element={<PeopleManagementPage type="student" />} />
              <Route path="/admin/departments" element={<DepartmentManagementPage />} />
              <Route path="/admin/curriculums" element={<CurriculumManagementPage />} />
              <Route path="/admin/curriculum" element={<Navigate to="/admin/curriculums" replace />} />
              <Route path="/admin/materials" element={<LearningMaterialsOverviewPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
              <Route path="/admin/settings" element={<UserSettingsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} />}>
              <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route
                path="/teacher/dashboard"
                element={<TeacherDashboardPage />}
              />
              <Route path="/teacher/students" element={<TeacherStudentsPage />} />
              <Route path="/teacher/materials" element={<TeacherContentPage type="material" />} />
              <Route path="/teacher/videos" element={<TeacherContentPage type="video" />} />
              <Route path="/teacher/notes" element={<TeacherContentPage type="note" />} />
              <Route path="/teacher/announcements" element={<TeacherContentPage type="announcement" />} />
              <Route path="/teacher/weekly-plan" element={<WeeklyPlanPage />} />
              <Route path="/teacher/completed-topics" element={<CompletedTopicsPage />} />
              <Route path="/teacher/quiz-analytics" element={<QuizAnalyticsPage />} />
              <Route path="/teacher/reports" element={<TeacherReportsPage />} />
              <Route path="/teacher/quiz" element={<Navigate to="/teacher/quiz-analytics" replace />} />
              <Route path="/teacher/marks" element={<StudentMarksPage />} />
              <Route path="/teacher/profile" element={<ProfilePage />} />
              <Route path="/teacher/settings" element={<UserSettingsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} />}>
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
              <Route
                path="/student/dashboard"
                element={<StudentDashboardPage />}
              />
              <Route path="/student/courses" element={<Navigate to="/student/curriculum" replace />} />
              <Route path="/student/curriculum" element={<StudentCurriculumPage />} />
              <Route path="/student/materials" element={<StudentMaterialsPage />} />
              <Route path="/student/videos" element={<StudentVideosPage />} />
              <Route path="/student/notes" element={<StudentNotesPage />} />
              <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
              <Route path="/student/assignments" element={<AssignmentUploadPage />} />
              <Route path="/student/upload-video" element={<AssignmentUploadPage />} />
              <Route path="/student/ai-quiz" element={<AIQuizEntryPage />} />
              <Route path="/student/ai-quiz/attempt" element={<StudentQuizAttemptPage />} />
              <Route path="/student/quiz" element={<Navigate to="/student/ai-quiz" replace />} />
              <Route path="/student/quiz-history" element={<QuizHistoryPage />} />
              <Route path="/student/results" element={<StudentResultsPage />} />
              <Route path="/student/reports" element={<StudentReportsPage />} />
              <Route path="/student/quiz-result/:quizNumber" element={<StudentQuizResultPage />} />
              <Route path="/student/quiz-review/:quizNumber" element={<StudentQuizReviewPage />} />
              <Route path="/student/profile" element={<ProfilePage />} />
              <Route path="/student/settings" element={<UserSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
