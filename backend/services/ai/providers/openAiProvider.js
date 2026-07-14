import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/appError.js';
import { postJson } from './httpProviderClient.js';

export const openAiProvider = {
  name: 'openai',
  model: env.ai.openaiModel,
  generateText: async ({ prompt }) => {
    if (!env.ai.openaiApiKey) {
      throw new AppError('OpenAI API key is not configured', 500);
    }

    const data = await postJson('https://api.openai.com/v1/chat/completions', {
      headers: {
        Authorization: `Bearer ${env.ai.openaiApiKey}`,
      },
      body: {
        model: env.ai.openaiModel,
        temperature: env.ai.temperature,
        max_tokens: env.ai.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate LMS MCQ questions. Return JSON only and use only supplied content.',
          },
          { role: 'user', content: prompt },
        ],
      },
    });

    return {
      text: data.choices?.[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  },
};
