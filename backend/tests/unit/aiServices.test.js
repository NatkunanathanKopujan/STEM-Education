import { describe, expect, test } from '@jest/globals';
import { calculateSimilarity, findDuplicateQuestion } from '../../services/ai/duplicateDetectionService.js';
import { parseAiQuestionResponse } from '../../services/ai/responseParser.js';
import { validateGeneratedQuestion } from '../../services/ai/questionValidationService.js';
import { questionFixture } from '../fixtures/lmsData.js';

describe('AI question services', () => {
  test('parses fenced JSON AI responses', () => {
    const parsed = parseAiQuestionResponse(`\`\`\`json
      {"questions":[{"Question":"What is HTML?","Option A":"A language","Option B":"A browser","Option C":"A DB","Option D":"An OS","Correct Answer":"Option A","Explanation":"HTML structures pages","Difficulty":"Easy","Category":"Definition"}]}
    \`\`\``);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      correctAnswer: 'A',
      difficulty: 'easy',
      category: 'definition',
    });
  });

  test('detects similar duplicate questions', () => {
    const similarity = calculateSimilarity('HTML basics and forms', 'HTML forms basics');
    const duplicate = findDuplicateQuestion(
      { question: 'What is HTML forms basics?' },
      [{ question: 'Explain HTML forms basics' }],
      0.4,
    );

    expect(similarity).toBeGreaterThan(0.5);
    expect(duplicate.duplicate).toBe(true);
  });

  test('validates complete MCQ structure', () => {
    expect(() => validateGeneratedQuestion(questionFixture)).not.toThrow();
  });
});
