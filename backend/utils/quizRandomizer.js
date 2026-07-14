const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

export function randomizeQuestionOptions(question) {
  const originalOptions = [
    { originalKey: 'A', text: question.optionA },
    { originalKey: 'B', text: question.optionB },
    { originalKey: 'C', text: question.optionC },
    { originalKey: 'D', text: question.optionD },
  ];
  const randomized = shuffle(originalOptions);
  const mappedOptions = {};
  let correctAnswer = null;

  randomized.forEach((option, index) => {
    const displayKey = OPTION_KEYS[index];
    mappedOptions[displayKey] = option.text;

    if (option.originalKey === question.correctAnswer) {
      correctAnswer = displayKey;
    }
  });

  return {
    options: mappedOptions,
    correctAnswer,
  };
}

export function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
