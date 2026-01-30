// ====================================================
// CATEGORY ROUTES
// ====================================================
// Routes for category management endpoints.

import { categoryController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireRole, ROLES } from '../middlewares/rbac.middleware.js';

export const registerCategoryRoutes = async (app) => {
  // Public routes
  app.get('/categories', { preHandler: [optionalAuth] }, categoryController.getAll);
  app.get('/categories/stats', categoryController.getWithStats);
  app.get('/categories/id/:id', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, categoryController.getById);
  app.get('/categories/:slug', categoryController.getBySlug);

  // Admin routes
  app.post('/categories', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, categoryController.create);
  app.patch('/categories/:id', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, categoryController.update);
  app.delete('/categories/:id', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, categoryController.delete);
  app.put('/categories/reorder', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, categoryController.reorder);
};
