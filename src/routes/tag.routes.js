// ====================================================
// TAG ROUTES (Fastify)
// ====================================================
// Tag-related API endpoints.

import tagController from '../controllers/tag.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

export const registerTagRoutes = async (app) => {
  // Public routes
  app.get('/tags', tagController.getAll);
  app.get('/tags/popular', tagController.getPopular);
  app.get('/tags/search', tagController.search);
  app.get('/tags/id/:id', { preHandler: [authenticate, requireRole('ADMIN')] }, tagController.getById);
  app.get('/tags/:slug', tagController.getBySlug);
  app.get('/tags/:slug/topics', tagController.getTopicsByTag);

  // Admin routes
  app.post('/tags', {
    preHandler: [authenticate, requireRole('ADMIN')],
  }, tagController.create);

  app.patch('/tags/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
  }, tagController.update);

  app.delete('/tags/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
  }, tagController.delete);
};
