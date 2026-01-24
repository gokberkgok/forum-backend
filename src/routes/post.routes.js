// ====================================================
// POST ROUTES
// ====================================================
// Routes for post (reply) endpoints.

import { postController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';
import { contentCreationRateLimiter } from '../middlewares/rateLimit.middleware.js';

export const registerPostRoutes = async (app) => {
  // Public routes
  app.get('/posts/topic/:topicId', postController.getByTopic);
  app.get('/posts/user/:userId', postController.getByUser);
  app.get('/posts/most-liked', postController.getMostLiked);
  app.get('/posts/:id', postController.getById);

  // Protected routes
  app.post('/posts', { preHandler: [authenticate, contentCreationRateLimiter] }, postController.create);
  app.patch('/posts/:id', { preHandler: [authenticate] }, postController.update);
  app.delete('/posts/:id', { preHandler: [authenticate] }, postController.delete);

  // Reactions / Like
  app.post('/posts/:id/like', { preHandler: [authenticate] }, postController.toggleLike);
  app.post('/posts/:id/reactions', { preHandler: [authenticate] }, postController.addReaction);
  app.delete('/posts/:id/reactions', { preHandler: [authenticate] }, postController.removeReaction);

  // Moderator+ routes
  app.post('/posts/:id/hide', { preHandler: [authenticate, requirePermission('post:hide')] }, postController.hide);
  app.post('/posts/:id/unhide', { preHandler: [authenticate, requirePermission('post:hide')] }, postController.unhide);
};
