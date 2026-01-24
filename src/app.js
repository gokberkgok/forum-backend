// ====================================================
// FASTIFY APPLICATION SETUP
// ====================================================
// Main Fastify application with all plugins and middlewares.

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import config from './config/index.js';
import logger from './utils/logger.js';
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

  // CORS configuration
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.) in development
      if (!origin && config.isDevelopment) {
        return cb(null, true);
      }
      
      const allowedOrigins = [config.frontendUrl];
      
      // Add localhost origins for development
      if (config.isDevelopment) {
        allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
      }
      
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

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
    name: 'Forum System API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
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
