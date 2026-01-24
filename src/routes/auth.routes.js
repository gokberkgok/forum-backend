// ====================================================
// AUTHENTICATION ROUTES
// ====================================================
// Routes for authentication endpoints with rate limiting.

import { authController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middlewares/rateLimit.middleware.js';

export const registerAuthRoutes = async (app) => {
  // Public routes (with strict rate limiting)
  app.post('/auth/register', { preHandler: [authRateLimiter] }, authController.register);
  app.post('/auth/login', { preHandler: [authRateLimiter] }, authController.login);
  app.post('/auth/refresh', authController.refresh);
  app.post('/auth/logout', authController.logout);
  app.post('/auth/verify-email', authController.verifyEmail);
  app.post('/auth/forgot-password', { preHandler: [passwordResetRateLimiter] }, authController.forgotPassword);
  app.post('/auth/reset-password', { preHandler: [passwordResetRateLimiter] }, authController.resetPassword);

  // Protected routes
  app.get('/auth/me', { preHandler: [authenticate] }, authController.me);
  app.patch('/auth/profile', { preHandler: [authenticate] }, authController.updateProfile);
  app.post('/auth/logout-all', { preHandler: [authenticate] }, authController.logoutAll);
  app.post('/auth/change-password', { preHandler: [authenticate] }, authController.changePassword);
  app.get('/auth/sessions', { preHandler: [authenticate] }, authController.getSessions);
};
