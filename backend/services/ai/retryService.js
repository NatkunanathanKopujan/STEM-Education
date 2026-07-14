import { env } from '../../config/env.js';

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export async function withRetry(operation, { maxRetries = env.ai.maxRetries, onRetry } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation(attempt + 1);
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries) {
        break;
      }

      const delay = Math.min(1000 * 2 ** attempt, 8000);
      await onRetry?.({ attempt: attempt + 1, delay, error });
      await wait(delay);
    }
  }

  throw lastError;
}
