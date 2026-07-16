import { fileService } from './fileService';
import { notificationService } from './notificationService';
import { teacherDashboardService } from './teacherDashboardService';

const fileTypeLabels = {
  pdf: 'PDF',
  ppt: 'PPT',
  documents: 'DOC',
  spreadsheets: 'SHEET',
  archives: 'ZIP',
  videos: 'VIDEO',
  images: 'IMAGE',
  audio: 'AUDIO',
};

function normalizeFile(file) {
  return {
    id: file.id,
    title: file.originalFileName || file.fileName || 'Untitled file',
    topic: file.topic || file.subject || '-',
    week: file.weekNo ? `Week ${file.weekNo}` : '-',
    type: fileTypeLabels[file.fileType] || String(file.fileType || 'FILE').toUpperCase(),
    status: file.status === 'active' ? 'Published' : file.status || 'Draft',
    visibility: file.visibility,
    description: file.description || '',
  };
}

function normalizeStudent(row) {
  return {
    id: row.studentId || row.id,
    studentId: row.studentNo || row.studentId || '-',
    name: row.studentName || row.fullName || row.name || '-',
    curriculum: row.curriculum || '-',
    batch: row.batch || '-',
    status: row.progressStatus || row.status || 'active',
    quizAttempts: row.quizAttempts || 0,
    average: Math.round(Number(row.averagePercentage || row.average || 0)),
    assignment: row.assignmentMarks || 0,
    quiz: Math.round(Number(row.averagePercentage || 0)),
    final: Math.round(Number(row.averagePercentage || 0)),
  };
}

export const teacherLearningService = {
  async getDashboard() {
    const [analytics, announcements] = await Promise.all([
      teacherDashboardService.getAnalyticsDashboard(),
      notificationService.getAnnouncements({ limit: 3 }).catch(() => ({ announcements: [] })),
    ]);
    const cards = analytics.cards || {};
    return {
      stats: [
        { title: 'Students', value: cards.totalStudents || 0 },
        { title: 'Quiz Attempts', value: cards.totalQuizAttempts || 0 },
        { title: 'Average Score', value: `${Math.round(Number(cards.averageQuizScore || 0))}%` },
        { title: 'AI Questions', value: cards.aiQuestionsAvailable || 0 },
      ],
      weeklyAnalytics: analytics.weeklyAnalytics || [],
      announcements: announcements.announcements || [],
      activity: analytics.leaderboard || [],
    };
  },

  async listStudents() {
    const analytics = await teacherDashboardService.getAnalyticsDashboard();
    return (analytics.studentPerformance || analytics.leaderboard || []).map(normalizeStudent);
  },

  async listMarks() {
    const analytics = await teacherDashboardService.getAnalyticsDashboard();
    return (analytics.studentPerformance || []).map(normalizeStudent);
  },

  async listCompletedTopics() {
    const data = await teacherDashboardService.getTopicAnalytics();
    return (data.topics || []).map((topic, index) => ({
      id: `${topic.weekNo || 0}-${topic.topic || index}`,
      week: topic.weekNo || '-',
      topic: topic.topic || '-',
      status: 'Completed',
      aiQuizEligible: Number(topic.totalQuestions || 0) > 0,
    }));
  },

  async listContent(type) {
    const fileType = type === 'video' ? 'videos' : type === 'note' ? 'documents' : undefined;
    const data = await fileService.list({ status: 'active', limit: 100, ...(fileType ? { fileType } : {}) });
    return (data.files || []).map(normalizeFile);
  },
};
