// ====================================================
// UPLOAD ROUTES
// ====================================================

import uploadController from '../controllers/upload.controller.js';
import { authenticate, uploadRateLimiter } from '../middlewares/index.js';

export const registerUploadRoutes = async (app) => {
  // Protected upload endpoint
  app.post('/uploads', { preHandler: [authenticate, uploadRateLimiter] }, uploadController.create);
};

export default registerUploadRoutes;
