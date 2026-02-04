// ====================================================
// ACTIVITY ROUTES
// ====================================================
// Routes for user activity tracking (heartbeat/ping).

import activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const registerActivityRoutes = async (app) => {
    // Authenticated ping endpoint - updates user's last active timestamp
    app.post('/activity/ping', { preHandler: [authenticate] }, activityController.ping);

    // Public endpoint - get online users
    app.get('/users/online', activityController.getOnlineUsers);
};
