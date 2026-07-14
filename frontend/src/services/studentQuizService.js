import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const studentQuizService = {
  startQuiz: async (payload = {}) => unwrap(await apiClient.post('/student/quiz/start', payload)),
  getCurrentQuiz: async () => unwrap(await apiClient.get('/student/quiz/current')),
  saveAnswer: async (payload) => unwrap(await apiClient.post('/student/quiz/save-answer', payload)),
  submitQuiz: async (attemptId) => unwrap(await apiClient.post('/student/quiz/submit', { attemptId })),
  getHistory: async () => unwrap(await apiClient.get('/student/quiz/history')),
  getResult: async (quizNumber) => unwrap(await apiClient.get(`/student/quiz/result/${quizNumber}`)),
  getReview: async (quizNumber) => unwrap(await apiClient.get(`/student/quiz/review/${quizNumber}`)),
};
