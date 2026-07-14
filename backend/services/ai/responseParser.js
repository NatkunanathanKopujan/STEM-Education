import { AppError } from '../../utils/appError.js';

const categoryMap = {
  concept_questions: 'concept',
  concept: 'concept',
  definition_questions: 'definition',
  definition: 'definition',
  scenario_questions: 'scenario',
  scenario: 'scenario',
  practical_questions: 'practical',
  practical: 'practical',
  true_false: 'true_false_mcq',
  true_false_mcq: 'true_false_mcq',
  application_questions: 'application',
  application: 'application',
};

function normalizeAnswer(value) {
  const text = String(value || '').trim().toUpperCase();

  if (['A', 'B', 'C', 'D'].includes(text)) {
    return text;
  }

  const match = text.match(/OPTION\s*([ABCD])/);
  return match?.[1] || text.slice(0, 1);
}

function normalizeCategory(value) {
  const key = String(value || 'concept')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return categoryMap[key] || 'concept';
}

function extractJson(text) {
  const trimmed = String(text || '').trim();

  if (!trimmed) {
    throw new AppError('AI provider returned an empty response', 502);
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new AppError('AI response did not contain valid JSON', 502);
}

export function parseAiQuestionResponse(rawResponse) {
  let parsed;

  try {
    parsed = JSON.parse(extractJson(rawResponse));
  } catch (error) {
    throw new AppError('Malformed AI response could not be parsed', 502, [error.message]);
  }

  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(questions)) {
    throw new AppError('AI response JSON must include a questions array', 502);
  }

  return questions.map((question) => ({
    question: question.question || question.Question,
    optionA: question.optionA || question['Option A'] || question.option_a,
    optionB: question.optionB || question['Option B'] || question.option_b,
    optionC: question.optionC || question['Option C'] || question.option_c,
    optionD: question.optionD || question['Option D'] || question.option_d,
    correctAnswer: normalizeAnswer(
      question.correctAnswer || question['Correct Answer'] || question.correct_answer,
    ),
    explanation: question.explanation || question.Explanation,
    difficulty: String(question.difficulty || question.Difficulty || '').toLowerCase(),
    category: normalizeCategory(question.category || question.Category),
    topic: question.topic || question.Topic,
    weekNo: question.weekNo || question.Week || question.week,
    confidenceScore: question.confidenceScore || question['Confidence Score'] || null,
  }));
}
