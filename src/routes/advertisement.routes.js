// ================================================
// ADVERTISEMENT ROUTES
// ================================================
import advertisementController from '../controllers/advertisement.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

export default async function advertisementRoutes(fastify) {
  // Public routes - Aktif reklamları getir
  fastify.get('/banners', advertisementController.getBanners);
  fastify.get('/popup', advertisementController.getPopup);
  
  // Debug route - Tüm reklamları filtre olmadan getir (geliştirme amaçlı)
  fastify.get('/debug/all', advertisementController.debugGetAll);

  // Tracking routes - Public (görüntüleme ve tıklama kaydı)
  fastify.post('/:id/impression', advertisementController.trackImpression);
  fastify.post('/:id/click', advertisementController.trackClick);

  // Admin routes - Reklam yönetimi
  fastify.get('/', { preHandler: [authenticate, requireRole(['ADMIN'])] }, advertisementController.getAll);
  fastify.get('/:id', { preHandler: [authenticate, requireRole(['ADMIN'])] }, advertisementController.getById);
  fastify.post('/', { preHandler: [authenticate, requireRole(['ADMIN'])] }, advertisementController.create);
  fastify.put('/:id', { preHandler: [authenticate, requireRole(['ADMIN'])] }, advertisementController.update);
  fastify.delete('/:id', { preHandler: [authenticate, requireRole(['ADMIN'])] }, advertisementController.delete);
}
