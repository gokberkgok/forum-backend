// ====================================================
// FASTIFY APPLICATION SETUP
// ====================================================
// Main Fastify application with all plugins and middlewares.

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import config from './config/index.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// Create Fastify instance with pino logger
const app = Fastify({
  logger: {
    level: config.env === 'production' ? 'info' : 'debug',
    transport: config.env !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  trustProxy: config.trustProxy,
  requestIdHeader: 'x-request-id',
});

// ====================================================
// PLUGIN REGISTRATION
// ====================================================

const registerPlugins = async () => {
  // Helmet security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: config.env === 'production',
  });


  await app.register(fastifyCors, {
    origin: [
      'https://ec1856b1.forum-frontend-8kh.pages.dev',
      'forum-frontend-8kh.pages.dev',
      'https://pzturk.com',
      'http://admin.pzturk.com
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With']
  })

  // Cookie parser
  await app.register(fastifyCookie, {
    secret: config.jwt.accessSecret,
    parseOptions: {},
  });

  // Rate limiting
  await app.register(fastifyRateLimit, {
    max: config.rateLimit.maxRequests,
    timeWindow: config.rateLimit.windowMs,
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      };
    },
    keyGenerator: (request) => {
      return request.headers['cf-connecting-ip'] ||
        request.headers['x-real-ip'] ||
        request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        request.ip;
    },
  });

  // Multipart (file uploads)
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB per file
      files: 5,
    },
  });
};

// ====================================================
// REQUEST HOOKS
// ====================================================

// Request sanitization hook
app.addHook('preHandler', async (request, reply) => {
  // Sanitize request body to prevent prototype pollution
  if (request.body && typeof request.body === 'object') {
    delete request.body.__proto__;
    delete request.body.constructor;
    delete request.body.prototype;
  }
});

// ====================================================
// ROUTES
// ====================================================

// Root endpoint
app.get('/', async (request, reply) => {
  return {
    name: 'forum-backend',
    version: '1.0.0',
    status: 'ok'
  };
});

// ====================================================
// ERROR HANDLING
// ====================================================

// Global error handler
app.setErrorHandler(errorHandler);

// 404 handler
app.setNotFoundHandler(notFoundHandler);

// ====================================================
// APP INITIALIZATION
// ====================================================

const initApp = async () => {
  await registerPlugins();
  await registerRoutes(app);
  return app;
};

export { initApp };
export default app;
