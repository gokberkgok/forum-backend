// ====================================================
// REQUEST LOGGING MIDDLEWARE (Fastify Format)
// ====================================================
// Simple HTTP request logging using Fastify hooks.

import logger from '../utils/logger.js';

/**
 * Get real client IP from Cloudflare headers
 */
const getClientIp = (request) => {
  return (
    request.headers['cf-connecting-ip'] ||
    request.headers['x-real-ip'] ||
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.ip
  );
};

/**
 * HTTP request logger - Fastify onResponse hook
 * Register this as an onResponse hook in your app
 */
export const requestLoggerHook = async (request, reply) => {
  // Skip health check logging
  if (request.url === '/health' || request.url === '/api/health') {
    return;
  }

  const logData = {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${Math.round(reply.elapsedTime)}ms`,
    ip: getClientIp(request),
    userId: request.userId || 'anonymous',
  };
  
  if (reply.statusCode >= 500) {
    logger.error(logData, `${request.method} ${request.url}`);
  } else if (reply.statusCode >= 400) {
    logger.warn(logData, `${request.method} ${request.url}`);
  } else {
    logger.info(logData, `${request.method} ${request.url}`);
  }
};
