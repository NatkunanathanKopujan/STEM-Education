import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/appError.js';
import { geminiProvider } from './geminiProvider.js';
import { localQuestionProvider } from './localQuestionProvider.js';
import { ollamaProvider } from './ollamaProvider.js';
import { openAiProvider } from './openAiProvider.js';

const providers = {
  local: localQuestionProvider,
  openai: openAiProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

export function getAiProvider() {
  const provider = env.ai.provider.toLowerCase();

  if (providers[provider]) {
    return providers[provider];
  }

  throw new AppError(`Unsupported AI provider: ${provider}`, 500);
}

export function listAiProviders() {
  return Object.values(providers).map((provider) => ({
    name: provider.name,
    model: provider.model,
    active: provider.name === env.ai.provider.toLowerCase(),
  }));
}

export function listAiModels() {
  return {
    openai: [env.ai.openaiModel],
    gemini: [env.ai.geminiModel],
    ollama: [env.ai.ollamaModel],
    local: [localQuestionProvider.model],
  };
}
