// ====================================================
// MENU ROUTES
// ====================================================
// Routes for menu management endpoints.

import menuController from '../controllers/menu.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const registerMenuRoutes = async (app) => {
  // Public routes
  app.get('/menus', menuController.getAll);
  app.get('/menus/:id', menuController.getById);

  // Admin only routes
  app.post('/menus', { preHandler: [authenticate, requirePermission('admin:access')] }, menuController.create);
  app.patch('/menus/:id', { preHandler: [authenticate, requirePermission('admin:access')] }, menuController.update);
  app.delete('/menus/:id', { preHandler: [authenticate, requirePermission('admin:access')] }, menuController.delete);
};
