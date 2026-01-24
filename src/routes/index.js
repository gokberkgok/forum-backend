// ====================================================
// ROUTES INDEX
// ====================================================
// Central router configuration for Fastify.

import { registerAuthRoutes } from './auth.routes.js';
import { registerUserRoutes } from './user.routes.js';
import { registerCategoryRoutes } from './category.routes.js';
import { registerTopicRoutes } from './topic.routes.js';
import { registerPostRoutes } from './post.routes.js';
import { registerTagRoutes } from './tag.routes.js';
import { registerMenuRoutes } from './menu.routes.js';
import advertisementRoutes from './advertisement.routes.js';

export const registerRoutes = async (app) => {
  // Health check endpoint
  app.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Register all route modules under /api prefix
  await app.register(async (api) => {
    await registerAuthRoutes(api);
    await registerUserRoutes(api);
    await registerCategoryRoutes(api);
    await registerTopicRoutes(api);
    await registerPostRoutes(api);
    await registerTagRoutes(api);
    await registerMenuRoutes(api);
    
    // Advertisement routes
    api.register(advertisementRoutes, { prefix: '/ads' });
  }, { prefix: '/api' });
};

