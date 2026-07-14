import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/appError.js';
import { postJson } from './httpProviderClient.js';

export const geminiProvider = {
  name: 'gemini',
  model: env.ai.geminiModel,
  generateText: async ({ prompt }) => {
    if (!env.ai.geminiApiKey) {
      throw new AppError('Gemini API key is not configured', 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.ai.geminiModel}:generateContent?key=${env.ai.geminiApiKey}`;
    const data = await postJson(url, {
      body: {
        generationConfig: {
          temperature: env.ai.temperature,
          maxOutputTokens: env.ai.maxTokens,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    return {
      text: data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  },
};
