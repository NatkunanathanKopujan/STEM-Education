import { AppError } from '../utils/AppError.js';
import { parseJson, randomizeQuestionOptions, shuffle } from '../utils/quizRandomizer.js';
import {
  createAttempt,
  createAttemptAnswer,
  createQuestionHistory,
  createQuizResult,
  createStudentNotification,
  findActiveAttempt,
  findAttemptForStudent,
  findStudentByUserId,
  getNextQuizNumber,
  listAttemptAnswers,
  listEligibleQuestions,
  listQuizHistory,
  listStudentQuestionIds,
  markAnswerCorrectness,
  recordQuestionExposure,
  saveAnswer,
  submitAttempt,
} from '../repositories/studentQuizRepository.js';

const QUIZ_SIZE = 10;
const PASS_PERCENTAGE = Number(process.env.QUIZ_PASS_PERCENTAGE || 50);

function ensureStudentRecord(student) {
  if (!student) {
    throw new AppError('Student profile was not found for this account', 404);
  }
}

function serializeAttempt(attempt, answers, { includeReview = false } = {}) {
  return {
    id: attempt.id,
    uuid: attempt.uuid,
    quizNumber: attempt.quizNumber,
    studentId: attempt.studentId,
    studentName: attempt.studentName,
    curriculum: attempt.curriculum || 'General Curriculum',
    curriculumId: attempt.curriculumId,
    subject: attempt.subject || 'Mixed Subjects',
    weekCoverage: parseJson(attempt.weekCoverage, []),
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    status: attempt.status,
    reuseNotice: Boolean(attempt.reuseNotice),
    questions: answers.map((answer) => {
      const randomized = parseJson(answer.randomizedOptions, {});
      const question = {
        questionId: answer.questionId,
        order: answer.questionOrder,
        question: answer.question,
        difficulty: answer.difficulty,
        category: answer.category,
        subject: answer.subject,
        weekNo: answer.weekNo,
        topic: answer.topic,
        options: randomized.options || {},
        selectedAnswer: answer.selectedAnswer,
      };

      if (includeReview) {
        question.correctAnswer = randomized.correctAnswer;
        question.isCorrect = Boolean(answer.isCorrect);
        question.explanation = answer.explanation;
      }

      return question;
    }),
  };
}

async function getStudent(user) {
  const student = await findStudentByUserId(user.id);
  ensureStudentRecord(student);
  return student;
}

async function getOwnedAttempt({ user, attemptId, quizNumber }) {
  const student = await getStudent(user);
  const attempt = await findAttemptForStudent({
    studentId: student.id,
    attemptId,
    quizNumber,
  });

  if (!attempt) {
    throw new AppError('Quiz attempt was not found', 404);
  }

  return { student, attempt };
}

export async function startStudentQuiz({ user, filters = {} }) {
  const student = await getStudent(user);
  const activeAttempt = await findActiveAttempt(student.id);

  if (activeAttempt) {
    const answers = await listAttemptAnswers(activeAttempt.id);
    return {
      restored: true,
      attempt: serializeAttempt({ ...activeAttempt, studentName: student.fullName }, answers),
    };
  }

  const questions = await listEligibleQuestions(filters);

  if (questions.length < QUIZ_SIZE) {
    throw new AppError(
      `At least ${QUIZ_SIZE} approved questions from completed topics are required to start a quiz`,
      409,
    );
  }

  const previousQuestionIds = new Set(await listStudentQuestionIds(student.id));
  const unusedQuestions = questions.filter((question) => !previousQuestionIds.has(question.id));
  const useReusablePool = unusedQuestions.length < QUIZ_SIZE;
  const selectedQuestions = shuffle(useReusablePool ? questions : unusedQuestions).slice(0, QUIZ_SIZE);
  const firstQuestion = selectedQuestions[0];
  const quizNumber = await getNextQuizNumber(student.id);
  const weekCoverage = [
    ...new Set(selectedQuestions.map((question) => question.weekNo).filter(Boolean)),
  ].sort((first, second) => first - second);
  const attemptId = await createAttempt({
    studentId: student.id,
    courseId: firstQuestion.courseId,
    curriculumId: firstQuestion.curriculumId,
    subject: filters.subject || firstQuestion.subject,
    quizNumber,
    weekCoverage,
    reuseNotice: useReusablePool,
  });

  await Promise.all(
    selectedQuestions.map(async (question, index) => {
      await createAttemptAnswer({
        attemptId,
        questionId: question.id,
        quizNumber,
        questionOrder: index + 1,
        randomizedOptions: randomizeQuestionOptions(question),
      });
      await recordQuestionExposure({
        studentId: student.id,
        questionId: question.id,
        quizNumber,
      });
    }),
  );

  const attempt = await findAttemptForStudent({ studentId: student.id, attemptId });
  const answers = await listAttemptAnswers(attemptId);

  return {
    restored: false,
    attempt: serializeAttempt({ ...attempt, studentName: student.fullName }, answers),
  };
}

export async function getCurrentStudentQuiz(user) {
  const student = await getStudent(user);
  const attempt = await findActiveAttempt(student.id);

  if (!attempt) {
    return { attempt: null };
  }

  const answers = await listAttemptAnswers(attempt.id);
  return {
    attempt: serializeAttempt({ ...attempt, studentName: student.fullName }, answers),
  };
}

export async function saveStudentQuizAnswer({ user, attemptId, questionId, selectedAnswer }) {
  const { attempt } = await getOwnedAttempt({ user, attemptId });

  if (attempt.status !== 'started') {
    throw new AppError('Submitted quizzes cannot be edited', 409);
  }

  const saved = await saveAnswer({ attemptId, questionId, selectedAnswer });

  if (!saved) {
    throw new AppError('Question was not found in this quiz attempt', 404);
  }

  return { saved: true, attemptId, questionId, selectedAnswer };
}

export async function submitStudentQuiz({ user, attemptId }) {
  const { student, attempt } = await getOwnedAttempt({ user, attemptId });

  if (attempt.status !== 'started') {
    throw new AppError('This quiz has already been submitted', 409);
  }

  const answers = await listAttemptAnswers(attempt.id);

  if (answers.length !== QUIZ_SIZE) {
    throw new AppError('Quiz attempt is incomplete and cannot be submitted', 409);
  }

  let correctAnswers = 0;
  let score = 0;
  const completedTopics = new Set();

  await Promise.all(
    answers.map(async (answer) => {
      const randomized = parseJson(answer.randomizedOptions, {});
      const isCorrect = Boolean(answer.selectedAnswer && answer.selectedAnswer === randomized.correctAnswer);
      const marksAwarded = isCorrect ? Number(answer.marks || 1) : 0;

      if (isCorrect) {
        correctAnswers += 1;
        score += marksAwarded;
      }

      if (answer.topic) {
        completedTopics.add(answer.topic);
      }

      await markAnswerCorrectness({ answerId: answer.id, isCorrect });
      await createQuestionHistory({
        studentId: student.id,
        quizNumber: attempt.quizNumber,
        attemptId: attempt.id,
        questionId: answer.questionId,
        topic: answer.topic,
        curriculumId: attempt.curriculumId,
        studentAnswer: answer.selectedAnswer,
        isCorrect,
        marksAwarded,
      });
    }),
  );

  const wrongAnswers = QUIZ_SIZE - correctAnswers;
  const percentage = Number(((correctAnswers / QUIZ_SIZE) * 100).toFixed(2));
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000),
  );
  const passStatus = percentage >= PASS_PERCENTAGE ? 'pass' : 'fail';

  await submitAttempt({
    attemptId: attempt.id,
    studentId: student.id,
    score,
    percentage,
    durationSeconds,
    passStatus,
  });
  await createQuizResult({
    attemptId: attempt.id,
    studentId: student.id,
    quizNumber: attempt.quizNumber,
    correctAnswers,
    wrongAnswers,
    score,
    percentage,
    durationSeconds,
    passStatus,
    completedTopics: [...completedTopics],
    reviewEnabled: true,
  });
  await createStudentNotification({
    studentId: student.id,
    title: 'Quiz Completed Successfully',
    message: `Quiz ${attempt.quizNumber} completed with ${percentage}%`,
    metadata: {
      quizNumber: attempt.quizNumber,
      score,
      percentage,
    },
  });

  return getStudentQuizResult({ user, quizNumber: attempt.quizNumber });
}

export async function getStudentQuizHistory(user) {
  const student = await getStudent(user);
  const history = await listQuizHistory(student.id);

  return {
    quizzes: history.map((quiz) => ({
      ...quiz,
      weekCoverage: parseJson(quiz.weekCoverage, []),
    })),
  };
}

export async function getStudentQuizResult({ user, quizNumber }) {
  const { attempt } = await getOwnedAttempt({ user, quizNumber });
  const answers = await listAttemptAnswers(attempt.id);
  const correctAnswers = answers.filter((answer) => Boolean(answer.isCorrect)).length;
  const wrongAnswers = answers.length - correctAnswers;

  return {
    quizNumber: attempt.quizNumber,
    attemptedAt: attempt.submittedAt,
    correctAnswers,
    wrongAnswers,
    score: attempt.score,
    percentage: attempt.percentage,
    durationSeconds: attempt.durationSeconds,
    passStatus: attempt.passStatus,
    completedTopics: [...new Set(answers.map((answer) => answer.topic).filter(Boolean))],
    curriculum: attempt.curriculum || 'General Curriculum',
    subject: attempt.subject || 'Mixed Subjects',
    weekCoverage: parseJson(attempt.weekCoverage, []),
  };
}

export async function getStudentQuizReview({ user, quizNumber }) {
  const { student, attempt } = await getOwnedAttempt({ user, quizNumber });

  if (attempt.status === 'started') {
    throw new AppError('Quiz review is available after submission', 409);
  }

  const answers = await listAttemptAnswers(attempt.id);

  return {
    attempt: serializeAttempt(
      { ...attempt, studentName: student.fullName },
      answers,
      { includeReview: true },
    ),
  };
}
