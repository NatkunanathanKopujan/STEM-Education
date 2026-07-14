import { loggingService } from '../services/loggingService.js';

export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    loggingService.api(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userId: req.user?.id || null,
    });
  });

  next();
}
