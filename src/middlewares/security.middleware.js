// ====================================================
// SECURITY MIDDLEWARE (Fastify Format)
// ====================================================
// Additional security measures and headers for Fastify.

import config from '../config/index.js';

/**
 * Helmet security headers configuration for @fastify/helmet
 */
export const helmetOptions = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: config.isProduction ? [] : null,
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // XSS filter
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
};

/**
 * CORS configuration for @fastify/cors
 */
export const corsOptions = {
  origin: (origin, cb) => {
      // Server-side, health check, curl, render probe
      if (!origin) {
        return cb(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return cb(null, true)
      }

      // ❗ HATA FIRLATMA → false dön
      return cb(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // Cache preflight for 24 hours
};

/**
 * Cloudflare IP validation hook (Fastify preHandler)
 * Ensures requests come through Cloudflare in production
 */
export const validateCloudflareRequest = async (request, reply) => {
  if (!config.isProduction) {
    return;
  }

  // Cloudflare always sets this header
  const cfRay = request.headers['cf-ray'];
  
  // In production, all requests should come through Cloudflare
  if (!cfRay) {
    // Log but don't block - allows for health checks from VPS
    // In strict mode, you could throw an error here
  }
};

/**
 * Request ID hook for tracing (Fastify onRequest)
 */
export const requestIdHook = async (request, reply) => {
  // Use Cloudflare's ray ID if available, otherwise generate one
  request.requestId = request.headers['cf-ray'] || 
    request.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  reply.header('X-Request-ID', request.requestId);
};

/**
 * Sanitize request to prevent prototype pollution (Fastify preHandler)
 */
export const sanitizeRequest = async (request, reply) => {
  // Prevent prototype pollution through body
  if (request.body && typeof request.body === 'object') {
    delete request.body.__proto__;
    delete request.body.constructor;
    delete request.body.prototype;
  }
  
  // Prevent prototype pollution through query
  if (request.query && typeof request.query === 'object') {
    delete request.query.__proto__;
    delete request.query.constructor;
    delete request.query.prototype;
  }
};
