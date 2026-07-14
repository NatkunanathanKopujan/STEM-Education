import { loggingService } from '../services/loggingService.js';

export const logger = {
  info: (message, meta = {}) => {
    console.info(message, meta);
    loggingService.server(message, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(message, meta);
    loggingService.warning(message, meta);
  },
  error: (message, meta = {}) => {
    console.error(message, meta);
    loggingService.error(message, meta);
  },
};
