// ====================================================
// TOPIC ROUTES
// ====================================================
// Routes for topic management endpoints.

import { topicController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';
import { contentCreationRateLimiter, searchRateLimiter } from '../middlewares/rateLimit.middleware.js';

export const registerTopicRoutes = async (app) => {
  // Public routes
  app.get('/topics', { preHandler: [searchRateLimiter] }, topicController.getList);
  app.get('/topics/latest', topicController.getLatest);
  app.get('/topics/popular', topicController.getPopular);
  app.get('/topics/most-viewed', topicController.getMostViewed);
  app.get('/topics/most-commented', topicController.getMostCommented);
  app.get('/topics/most-liked', topicController.getMostLiked);
  app.get('/topics/id/:id', { preHandler: [optionalAuth] }, topicController.getById);
  app.get('/topics/:categorySlug/:topicSlug', { preHandler: [optionalAuth] }, topicController.getBySlug);

  // Protected routes
  app.post('/topics', { preHandler: [authenticate, contentCreationRateLimiter] }, topicController.create);
  app.patch('/topics/:id', { preHandler: [authenticate] }, topicController.update);
  app.delete('/topics/:id', { preHandler: [authenticate] }, topicController.delete);
  app.post('/topics/:id/like', { preHandler: [authenticate] }, topicController.toggleLike);

  // Moderator+ routes
  app.post('/topics/:id/pin', { preHandler: [authenticate, requirePermission('topic:pin')] }, topicController.togglePin);
  app.patch('/topics/:id/pinned-color', { preHandler: [authenticate, requirePermission('topic:pin')] }, topicController.updatePinnedColor);
  app.post('/topics/:id/lock', { preHandler: [authenticate, requirePermission('topic:lock')] }, topicController.toggleLock);
  app.post('/topics/:id/move', { preHandler: [authenticate, requirePermission('topic:move')] }, topicController.move);
};
