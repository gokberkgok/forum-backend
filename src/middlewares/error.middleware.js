// ====================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// ====================================================
// Consistent error responses and logging for Fastify.

import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * 404 Not Found handler for Fastify
 */
export const notFoundHandler = async (request, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
};

/**
 * Global error handler for Fastify
 */
export const errorHandler = (error, request, reply) => {
  // Default values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details || null;

  // Handle specific error types
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    message = 'A record with this value already exists';
    code = 'DUPLICATE_ERROR';
    const field = error.meta?.target?.[0];
    if (field) {
      message = `A record with this ${field} already exists`;
    }
  } else if (error.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Record not found';
    code = 'NOT_FOUND';
  } else if (error.code === 'P2003') {
    // Prisma foreign key constraint
    statusCode = 400;
    message = 'Invalid reference to related record';
    code = 'FOREIGN_KEY_ERROR';
  } else if (error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    // Fastify empty JSON body
    statusCode = 400;
    message = 'Request body is required';
    code = 'VALIDATION_ERROR';
  }

  // Log error
  const errorLog = {
    statusCode,
    code,
    message,
    path: request.url,
    method: request.method,
    ip: request.ip,
    userId: request.userId || 'anonymous',
    userAgent: request.headers['user-agent'],
  };

  if (statusCode >= 500) {
    // Log full error for server errors
    logger.error({ ...errorLog, stack: error.stack, error }, message);
  } else if (statusCode >= 400) {
    // Log warning for client errors
    logger.warn(errorLog, message);
  }

  // Don't expose internal errors in production
  if (config.isProduction && statusCode === 500 && !error.isOperational) {
    message = 'An unexpected error occurred';
    details = null;
  }

  // Send error response
  reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};
