import { AppError } from '../../utils/appError.js';

const validDifficulties = ['easy', 'medium', 'hard'];
const validCategories = [
  'concept',
  'definition',
  'scenario',
  'practical',
  'true_false_mcq',
  'application',
];

export function validateGeneratedQuestion(question) {
  const errors = [];
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];

  if (!question.question || question.question.trim().length < 12) {
    errors.push('Question text is required and must be clear');
  }

  if (options.some((option) => !option || option.trim().length < 2)) {
    errors.push('Exactly four meaningful options are required');
  }

  if (new Set(options.map((option) => option.trim().toLowerCase())).size !== 4) {
    errors.push('Options must be unique');
  }

  if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    errors.push('Correct answer must be A, B, C, or D');
  }

  if (!question.explanation || question.explanation.trim().length < 10) {
    errors.push('Explanation is required');
  }

  if (!validDifficulties.includes(question.difficulty)) {
    errors.push('Difficulty must be easy, medium, or hard');
  }

  if (!validCategories.includes(question.category)) {
    errors.push('Category is invalid');
  }

  if (!question.topic) {
    errors.push('Topic is required');
  }

  if (errors.length) {
    throw new AppError('Generated question failed validation', 422, errors);
  }

  return true;
}
