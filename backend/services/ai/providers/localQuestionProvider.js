const categories = [
  'concept',
  'definition',
  'scenario',
  'practical',
  'true_false_mcq',
  'application',
];

const cleanSentence = (text) => {
  const sentences = String(text)
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 30);

  return sentences[0] || String(text).slice(0, 180);
};

const buildQuestion = ({ knowledge, difficulty, category, index }) => {
  const base = cleanSentence(knowledge.extractedText);
  const topic = knowledge.topic;
  const subject = knowledge.subject;
  const stemByCategory = {
    concept: `Which concept is most directly related to ${topic}?`,
    definition: `Which statement best defines the topic ${topic}?`,
    scenario: `In a classroom scenario about ${topic}, which answer is most appropriate?`,
    practical: `Which practical action best applies ${topic}?`,
    true_false_mcq: `Which option is a true statement about ${topic}?`,
    application: `How should a student apply ${topic} in ${subject}?`,
  };

  return {
    difficulty,
    category,
    question: `${stemByCategory[category]} (${difficulty} ${index + 1})`,
    optionA: base,
    optionB: `Use unrelated information from a future topic instead of ${topic}.`,
    optionC: `Ignore the teacher-approved material for ${topic}.`,
    optionD: `Select an answer that is not supported by the completed lesson.`,
    correctAnswer: 'A',
    explanation: `This question is based only on completed topic "${topic}" from teacher-approved LMS knowledge content.`,
    aiVersion: 'foundation-local-mcq-v1',
  };
};

export const localQuestionProvider = {
  name: 'local',
  model: 'foundation-local-mcq-v1',
  generateText: async () => {
    throw new Error('Local provider uses deterministic question generation, not text completion');
  },
  generateQuestions: async ({ knowledgeItems, difficultyConfig }) => {
    const questions = [];

    for (const knowledge of knowledgeItems) {
      for (const [difficulty, count] of Object.entries(difficultyConfig)) {
        for (let index = 0; index < count; index += 1) {
          questions.push(
            buildQuestion({
              knowledge,
              difficulty,
              category: categories[(questions.length + index) % categories.length],
              index,
            }),
          );
        }
      }
    }

    return questions;
  },
};
