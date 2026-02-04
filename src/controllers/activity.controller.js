// ====================================================
// ACTIVITY CONTROLLER
// ====================================================
// HTTP layer for activity tracking endpoints (Fastify).

import activityService from '../services/activity.service.js';
import { successResponse } from '../utils/response.js';

class ActivityController {
    /**
     * Ping endpoint to update user's activity
     * POST /api/activity/ping
     */
    ping = async (req, res) => {
        const userId = req.user.id;

        await activityService.updateActivity(userId);

        return successResponse(res, { active: true }, 'Activity updated');
    };

    /**
     * Get online users
     * GET /api/users/online
     */
    getOnlineUsers = async (req, res) => {
        const users = await activityService.getOnlineUsers();

        return successResponse(res, users, 'Online users');
    };
}

export default new ActivityController();
