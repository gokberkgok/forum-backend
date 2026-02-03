// ====================================================
// AVATAR ROUTES (Fastify)
// ====================================================
// Routes for avatar upload and deletion

import { avatarController } from '../controllers/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const registerAvatarRoutes = async (app) => {
    // All routes require authentication

    /**
     * @route   POST /users/avatar
     * @desc    Upload user avatar
     * @access  Private
     */
    app.post('/users/avatar', {
        preHandler: [authenticate]
    }, avatarController.uploadAvatar);

    /**
     * @route   DELETE /users/avatar
     * @desc    Delete user avatar
     * @access  Private
     */
    app.delete('/users/avatar', {
        preHandler: [authenticate]
    }, avatarController.deleteAvatar);
};
