import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '../uploads');

function ok(component, details = {}) {
  return {
    component,
    status: 'ok',
    checkedAt: new Date().toISOString(),
    ...details,
  };
}

function fail(component, error) {
  return {
    component,
    status: 'error',
    checkedAt: new Date().toISOString(),
    error: error.message,
  };
}

export async function databaseHealth() {
  try {
    await testConnection();
    return ok('database', {
      provider: 'mysql',
      host: env.db.host,
      database: env.db.name,
    });
  } catch (error) {
    return fail('database', error);
  }
}

export async function storageHealth() {
  try {
    await fs.access(uploadsPath);
    const stats = await fs.stat(uploadsPath);
    return ok('storage', {
      provider: env.storage.provider,
      path: uploadsPath,
      writable: stats.isDirectory(),
    });
  } catch (error) {
    return fail('storage', error);
  }
}

export async function aiHealth() {
  return ok('ai', {
    provider: env.ai.provider,
    model:
      env.ai.provider === 'openai'
        ? env.ai.openaiModel
        : env.ai.provider === 'gemini'
          ? env.ai.geminiModel
          : env.ai.ollamaModel,
    externalCall: false,
  });
}

export async function systemHealth() {
  const memory = process.memoryUsage();
  return ok('system', {
    uptimeSeconds: Math.round(process.uptime()),
    platform: os.platform(),
    cpuLoad: os.loadavg()[0],
    memoryUsageMb: Math.round(memory.rss / 1024 / 1024),
    heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    nodeVersion: process.version,
  });
}

export async function overallHealth() {
  const [database, storage, ai, system] = await Promise.all([
    databaseHealth(),
    storageHealth(),
    aiHealth(),
    systemHealth(),
  ]);
  const checks = { database, storage, ai, system };
  const healthy = Object.values(checks).every((check) => check.status === 'ok');

  return {
    status: healthy ? 'ok' : 'degraded',
    service: 'AI Smart LMS API',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checkedAt: new Date().toISOString(),
    checks,
  };
}
