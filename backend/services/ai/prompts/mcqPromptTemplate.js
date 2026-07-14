export const MCQ_PROMPT_ID = 'teacher-material-mcq-json-v1';

export function buildMcqPrompt({
  knowledgeItems,
  difficultyConfig,
  topic,
  subject,
  weekNo,
  questionCount,
}) {
  const sourceContent = knowledgeItems
    .map(
      (item, index) =>
        `SOURCE ${index + 1}
Subject: ${item.subject}
Week: ${item.weekNo}
Topic: ${item.topic}
Content:
${item.extractedText}`,
    )
    .join('\n\n---\n\n');

  return `You are an LMS quiz-question generator.

Rules:
- Use ONLY the supplied learning content below.
- Never use internet knowledge, outside knowledge, assumptions, or future topics.
- Generate only multiple-choice questions.
- Each question must have exactly one correct answer and exactly four options.
- Create three meaningful distractors.
- Include a short explanation based only on the supplied content.
- Assign difficulty as easy, medium, or hard.
- Assign topic and week exactly from the completed topic context.
- Return structured JSON only. Do not include markdown or commentary.

Completed topic context:
Subject: ${subject}
Week: ${weekNo}
Topic: ${topic}
Question count: ${questionCount}
Difficulty mix: ${JSON.stringify(difficultyConfig)}

Required JSON shape:
{
  "questions": [
    {
      "question": "Question text",
      "optionA": "Option A",
      "optionB": "Option B",
      "optionC": "Option C",
      "optionD": "Option D",
      "correctAnswer": "A",
      "explanation": "Why the answer is correct",
      "difficulty": "easy",
      "category": "concept",
      "topic": "${topic}",
      "weekNo": ${weekNo},
      "confidenceScore": 0.9
    }
  ]
}

Allowed categories: concept, definition, scenario, practical, true_false_mcq, application.

Learning content:
${sourceContent}`;
}
