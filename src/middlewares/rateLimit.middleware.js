// ====================================================
// RATE LIMITING MIDDLEWARE
// ====================================================
// Protection against brute force and DDoS attacks.
// Custom rate limiters for Fastify (used as preHandler hooks)

import config from '../config/index.js';
import { RateLimitError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// In-memory store for rate limiting
const rateLimitStore = new Map();

/**
 * Get client IP considering Cloudflare proxy
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
 * Create a rate limiter middleware
 */
const createRateLimiter = (options) => {
  const { windowMs, max, message } = options;

  return async (request, reply) => {
    const ip = getClientIp(request);
    const key = `${ip}:${options.name || 'default'}`;
    const now = Date.now();

    // Clean expired entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }

    let record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', Math.max(0, max - record.count));
    reply.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      logger.warn({
        ip,
        path: request.url,
        method: request.method,
        message: 'Rate limit exceeded',
      });

      throw new RateLimitError(message || 'Too many requests, please try again later');
    }
  };
};

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  name: 'auth',
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.maxRequests,
  message: 'Too many authentication attempts',
});

/**
 * Strict rate limiter for password reset
 */
export const passwordResetRateLimiter = createRateLimiter({
  name: 'password-reset',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts',
});

/**
 * Rate limiter for content creation (posts, topics)
 */
export const contentCreationRateLimiter = createRateLimiter({
  name: 'content-creation',
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Posting too frequently, please slow down',
});

/**
 * Rate limiter for search queries
 */
export const searchRateLimiter = createRateLimiter({
  name: 'search',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests',
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = createRateLimiter({
  name: 'upload',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many file uploads',
});
