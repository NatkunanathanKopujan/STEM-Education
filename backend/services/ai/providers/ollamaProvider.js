import { env } from '../../../config/env.js';
import { postJson } from './httpProviderClient.js';

export const ollamaProvider = {
  name: 'ollama',
  model: env.ai.ollamaModel,
  generateText: async ({ prompt }) => {
    const data = await postJson(`${env.ai.ollamaBaseUrl.replace(/\/$/, '')}/api/generate`, {
      body: {
        model: env.ai.ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: env.ai.temperature,
          num_predict: env.ai.maxTokens,
        },
      },
    });

    return {
      text: data.response || '',
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  },
};
