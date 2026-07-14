import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDirectory = path.resolve(__dirname, '../logs');

function ensureLogsDirectory() {
  if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory, { recursive: true });
  }
}

function writeLog(channel, level, message, meta = {}) {
  ensureLogsDirectory();
  const entry = JSON.stringify({
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  });

  fs.appendFileSync(path.join(logsDirectory, `${channel}.log`), `${entry}\n`);
}

export const loggingService = {
  error: (message, meta) => writeLog('errors', 'error', message, meta),
  warning: (message, meta) => writeLog('warnings', 'warn', message, meta),
  server: (message, meta) => writeLog('server', 'info', message, meta),
  api: (message, meta) => writeLog('api', 'info', message, meta),
  auth: (message, meta) => writeLog('auth', 'info', message, meta),
};
