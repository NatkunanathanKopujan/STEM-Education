const tokenize = (value = '') =>
  new Set(
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean),
  );

export function calculateSimilarity(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return Number((intersection / union).toFixed(4));
}

export function findDuplicateQuestion(candidate, existingQuestions, threshold = 0.82) {
  let highest = 0;

  for (const question of existingQuestions) {
    highest = Math.max(highest, calculateSimilarity(candidate.question, question.question));
  }

  return {
    duplicate: highest >= threshold,
    similarityScore: highest,
  };
}
