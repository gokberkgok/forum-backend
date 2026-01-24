// ====================================================
// SIMPLE LOGGER
// ====================================================
// Simple console-based logging for development.

import config from '../config/index.js';

const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
const currentLevel = levels[config.logLevel] ?? 3;

const formatMessage = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
};

const logger = {
  fatal: (data, message) => {
    if (currentLevel >= 0) console.error(formatMessage('fatal', message || data, message ? data : {}));
  },
  error: (data, message) => {
    if (currentLevel >= 1) console.error(formatMessage('error', message || data, message ? data : {}));
  },
  warn: (data, message) => {
    if (currentLevel >= 2) console.warn(formatMessage('warn', message || data, message ? data : {}));
  },
  info: (data, message) => {
    if (currentLevel >= 3) console.log(formatMessage('info', message || data, message ? data : {}));
  },
  debug: (data, message) => {
    if (currentLevel >= 4) console.log(formatMessage('debug', message || data, message ? data : {}));
  },
  trace: (data, message) => {
    if (currentLevel >= 5) console.log(formatMessage('trace', message || data, message ? data : {}));
  },
  child: () => logger, // Return same logger for child loggers
};

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'Unhandled rejection');
});

export default logger;
