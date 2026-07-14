import { parseJson } from '../utils/quizRandomizer.js';
import {
  getDashboardMetrics,
  getQuestionBankAnalytics,
  getQuestionExposure,
  listAttemptReview,
  listLeaderboard,
  listQuizAttempts,
  listStudentPerformance,
  listTopicPerformance,
  listWeeklyAnalytics,
} from '../repositories/teacherAnalyticsRepository.js';

function toNumber(value) {
  return Number(value || 0);
}

function buildRecommendations(topic) {
  const recommendations = [];

  if (toNumber(topic.incorrectPercentage) >= 45) {
    recommendations.push('Review Topic Again');
  }
  if (toNumber(topic.totalQuestions) < 5) {
    recommendations.push('Create More Practice Questions');
  }
  if (toNumber(topic.averageScore) < 60) {
    recommendations.push('Upload Additional Notes');
  }

  return recommendations.length ? recommendations : ['Continue Monitoring'];
}

function normalizeAttempt(attempt) {
  return {
    ...attempt,
    weekCoverage: parseJson(attempt.weekCoverage, []),
    durationMinutes: Number((toNumber(attempt.durationSeconds) / 60).toFixed(1)),
  };
}

export async function getTeacherAnalyticsDashboard(user) {
  const [metrics, studentPerformance, weeklyAnalytics, exposure, questionBank, leaderboard] =
    await Promise.all([
      getDashboardMetrics(user),
      listStudentPerformance(user),
      listWeeklyAnalytics(user),
      getQuestionExposure(user),
      getQuestionBankAnalytics(user),
      listLeaderboard(user),
    ]);

  return {
    cards: {
      totalStudents: toNumber(metrics.totalStudents),
      totalQuizAttempts: toNumber(metrics.totalQuizAttempts),
      averageQuizScore: toNumber(metrics.averageQuizScore),
      highestScore: toNumber(metrics.highestScore),
      lowestScore: toNumber(metrics.lowestScore),
      passRate: toNumber(metrics.passRate),
      activeStudents: toNumber(metrics.activeStudents),
      completedTopics: toNumber(metrics.completedTopics),
      aiQuestionsAvailable: toNumber(metrics.aiQuestionsAvailable),
    },
    studentPerformance,
    weeklyAnalytics,
    questionExposure: exposure.summary,
    questionBank,
    leaderboard,
  };
}

export async function getTeacherStudentAnalytics(user, studentId) {
  const [students, attempts] = await Promise.all([
    listStudentPerformance(user),
    listQuizAttempts(user, { studentId }),
  ]);

  return {
    student: students.find((item) => Number(item.studentId) === Number(studentId)) || null,
    attempts: attempts.map(normalizeAttempt),
  };
}

export async function getTeacherTopicAnalytics(user) {
  const topics = await listTopicPerformance(user);

  return {
    topics: topics.map((topic) => ({
      ...topic,
      isWeakTopic: toNumber(topic.incorrectPercentage) >= 40 || toNumber(topic.averageScore) < 60,
      recommendations: buildRecommendations(topic),
    })),
  };
}

export async function getTeacherQuestionExposure(user) {
  return getQuestionExposure(user);
}

export async function getTeacherReports(user, filters = {}) {
  const [students, attempts, topics, weekly, exposure, questionBank, leaderboard] = await Promise.all([
    listStudentPerformance(user),
    listQuizAttempts(user),
    listTopicPerformance(user),
    listWeeklyAnalytics(user),
    getQuestionExposure(user),
    getQuestionBankAnalytics(user, filters),
    listLeaderboard(user),
  ]);

  return {
    studentPerformance: students,
    quizAttempts: attempts.map(normalizeAttempt),
    topicPerformance: topics.map((topic) => ({
      ...topic,
      recommendations: buildRecommendations(topic),
    })),
    weeklyProgress: weekly,
    questionExposure: exposure,
    questionBank,
    leaderboard,
  };
}

export async function getTeacherAttemptReview(user, attemptId) {
  const rows = await listAttemptReview(user, attemptId);

  return {
    quizNumber: rows[0]?.quizNumber || null,
    studentName: rows[0]?.studentName || null,
    questions: rows.map((row) => {
      const randomized = parseJson(row.randomizedOptions, {});
      return {
        questionOrder: row.questionOrder,
        weekNo: row.weekNo,
        topic: row.topic,
        question: row.question,
        options: randomized.options || {},
        selectedAnswer: row.selectedAnswer,
        correctAnswer: randomized.correctAnswer,
        isCorrect: Boolean(row.isCorrect),
        explanation: row.explanation,
      };
    }),
  };
}

export async function exportTeacherReport(user, { reportType = 'student-performance', format = 'excel' } = {}) {
  const reports = await getTeacherReports(user);
  const reportMap = {
    'student-performance': reports.studentPerformance,
    'topic-performance': reports.topicPerformance,
    'weekly-progress': reports.weeklyProgress,
    'quiz-statistics': reports.quizAttempts,
    'question-exposure': reports.questionExposure.questions,
  };
  const rows = reportMap[reportType] || reports.studentPerformance;
  const content = JSON.stringify(rows, null, 2);
  const extension = format === 'pdf' ? 'pdf' : 'json';

  return {
    reportType,
    format,
    filename: `${reportType}-${Date.now()}.${extension}`,
    mimeType: format === 'pdf' ? 'application/pdf' : 'application/json',
    content,
  };
}
