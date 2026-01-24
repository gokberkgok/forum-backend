// ====================================================
// USER ROUTES
// ====================================================
// Routes for user management endpoints.

import { userController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole, requirePermission, ROLES } from '../middlewares/rbac.middleware.js';

export const registerUserRoutes = async (app) => {
  // Public routes
  app.get('/users/latest', userController.getLatestUsers);
  app.get('/users/:username', userController.getProfile);

  // Protected routes
  app.patch('/users/:id', { preHandler: [authenticate] }, userController.updateProfile);

  // Admin routes
  app.get('/users', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, userController.getUsers);
  app.get('/users/id/:id', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, userController.getById);
  app.patch('/users/:id/role', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, userController.changeRole);
  app.delete('/users/:id', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, userController.deleteUser);

  // Moderator+ routes
  app.post('/users/:id/suspend', { preHandler: [authenticate, requirePermission('user:suspend')] }, userController.suspendUser);
  app.post('/users/:id/activate', { preHandler: [authenticate, requirePermission('user:suspend')] }, userController.activateUser);

  // Admin only
  app.post('/users/:id/ban', { preHandler: [authenticate, requireRole(ROLES.ADMIN)] }, userController.banUser);
};
