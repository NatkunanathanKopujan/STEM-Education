import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnv = ['JWT_SECRET'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'ai_smart_lms',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '7d',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    timeoutMs: Number(process.env.AI_TIMEOUT || process.env.AI_TIMEOUT_MS || 30000),
    maxRetries: Number(process.env.AI_MAX_RETRIES || 2),
    batchSize: Number(process.env.AI_BATCH_SIZE || 25),
    maxTokens: Number(process.env.MAX_TOKENS || 3000),
    temperature: Number(process.env.TEMPERATURE || 0.2),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1',
    costPer1kTokens: {
      openaiInput: Number(process.env.OPENAI_INPUT_COST_PER_1K || 0),
      openaiOutput: Number(process.env.OPENAI_OUTPUT_COST_PER_1K || 0),
      geminiInput: Number(process.env.GEMINI_INPUT_COST_PER_1K || 0),
      geminiOutput: Number(process.env.GEMINI_OUTPUT_COST_PER_1K || 0),
      ollamaInput: Number(process.env.OLLAMA_INPUT_COST_PER_1K || 0),
      ollamaOutput: Number(process.env.OLLAMA_OUTPUT_COST_PER_1K || 0),
    },
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 200),
    localBaseUrl: process.env.STORAGE_LOCAL_BASE_URL || '',
  },
  security: {
    maxFailedLogins: Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5),
    lockoutWindowMinutes: Number(process.env.LOGIN_LOCKOUT_WINDOW_MINUTES || 15),
    apiRateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 300),
  },
  performance: {
    cacheProvider: process.env.CACHE_PROVIDER || 'memory',
    cacheDefaultTtlSeconds: Number(process.env.CACHE_DEFAULT_TTL_SECONDS || 60),
    slowRequestThresholdMs: Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 1000),
    slowQueryThresholdMs: Number(process.env.SLOW_QUERY_THRESHOLD_MS || 500),
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
