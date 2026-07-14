import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/appError.js';

export async function postJson(url, { headers = {}, body, timeoutMs = env.ai.timeoutMs }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      throw new AppError(`AI provider request failed with status ${response.status}`, 502, [
        data?.error?.message || data?.message || 'Provider request failed',
      ]);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError('AI provider request timed out', 504);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
