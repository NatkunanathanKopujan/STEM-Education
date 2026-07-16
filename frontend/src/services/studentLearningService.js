import { fileService } from './fileService';
import { studentQuizService } from './studentQuizService';

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

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}

function normalizeFile(file) {
  return {
    id: file.id,
    title: file.originalFileName || file.fileName || 'Untitled file',
    teacher: file.owner || '-',
    week: file.weekNo ? `Week ${file.weekNo}` : '-',
    weekNo: file.weekNo,
    topic: file.topic || file.subject || '-',
    subject: file.subject || '-',
    type: fileTypeLabels[file.fileType] || String(file.fileType || 'FILE').toUpperCase(),
    fileType: file.fileType,
    uploadDate: formatDate(file.createdAt),
    description: file.description || '',
    downloadCount: file.downloadCount || 0,
    viewCount: file.viewCount || 0,
  };
}

async function listFiles(params = {}) {
  const data = await fileService.list({ status: 'active', visibility: 'public', limit: 100, ...params });
  return (data.files || []).map(normalizeFile);
}

export const studentLearningService = {
  listMaterials: (params = {}) => listFiles(params),
  listVideos: (params = {}) => listFiles({ fileType: 'videos', ...params }),
  listNotes: (params = {}) => listFiles({ fileType: 'documents', ...params }),
  preview: (id) => fileService.previewBlob(id),
  download: (id) => fileService.downloadBlob(id),

  async getDashboard() {
    const [materials, videos, notes, quizHistory] = await Promise.all([
      listFiles({ limit: 5 }),
      listFiles({ fileType: 'videos', limit: 5 }),
      listFiles({ fileType: 'documents', limit: 5 }),
      studentQuizService.getHistory().catch(() => ({ attempts: [] })),
    ]);

    const attempts = quizHistory.attempts || quizHistory.results || [];
    const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed' || attempt.completedAt);
    const latestResult = completedAttempts[0];
    const averageScore = completedAttempts.length
      ? Math.round(
          completedAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage || attempt.scorePercentage || 0), 0) /
            completedAttempts.length,
        )
      : 0;

    return {
      materials,
      videos,
      notes,
      stats: [
        { title: 'Available Materials', value: materials.length },
        { title: 'Video Lessons', value: videos.length },
        { title: 'Teacher Notes', value: notes.length },
        { title: 'Quiz Performance', value: averageScore, suffix: '%' },
      ],
      latestQuizResult: latestResult
        ? `${Math.round(Number(latestResult.percentage || latestResult.scorePercentage || 0))}%`
        : 'No result yet',
      progress: averageScore,
    };
  },
};
