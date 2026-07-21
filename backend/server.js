import app from './app.js';
import { testConnection } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    await testConnection();
    logger.info('[OK] Database connected successfully', {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
    });

    app.listen(env.port, () => {
      logger.info(`AI Smart LMS API running on port ${env.port}`);
    });
  } catch (error) {
    logger.error('[ERROR] Database connection failed. API server was not started.', {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      code: error.code,
      errno: error.errno,
      message: error.message,
    });
    process.exit(1);
  }
}

startServer();
