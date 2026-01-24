// ====================================================
// MIDDLEWARE INDEX (Fastify Format)
// ====================================================
// Central export for all middlewares/hooks.

export { authenticate, optionalAuth, requireVerified } from './auth.middleware.js';
export { 
  requireRole, 
  requireMinimumRole, 
  requirePermission, 
  requireOwnershipOrRole,
  hasPermission,
  isHigherRole,
  ROLES 
} from './rbac.middleware.js';
export {
  globalRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  contentCreationRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
} from './rateLimit.middleware.js';
export { 
  notFoundHandler, 
  errorHandler, 
  asyncHandler 
} from './error.middleware.js';
export { 
  validateBody, 
  validateQuery, 
  validateParams, 
  schemas 
} from './validation.middleware.js';
export {
  helmetOptions,
  corsOptions,
  validateCloudflareRequest,
  requestIdHook,
  sanitizeRequest,
} from './security.middleware.js';
export { requestLoggerHook } from './logging.middleware.js';
