// ====================================================
// ACTIVITY SERVICE
// ====================================================
// Handles user activity tracking for online status.

import prisma from '../config/database.js';

class ActivityService {
    /**
     * Update user's last active timestamp
     * @param {string} userId - User ID
     */
    async updateActivity(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() },
        });
        return { success: true };
    }

    /**
     * Get all online users (active within last 3 minutes)
     * @returns {Promise<Array>} List of online users
     */
    async getOnlineUsers() {
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

        const users = await prisma.user.findMany({
            where: {
                lastActiveAt: {
                    gte: threeMinutesAgo,
                },
                status: 'ACTIVE',
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                role: true,
            },
            orderBy: {
                lastActiveAt: 'desc',
            },
        });

        return users;
    }

    /**
     * Get online user count
     * @returns {Promise<number>} Number of online users
     */
    async getOnlineCount() {
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

        const count = await prisma.user.count({
            where: {
                lastActiveAt: {
                    gte: threeMinutesAgo,
                },
                status: 'ACTIVE',
            },
        });

        return count;
    }
}

export default new ActivityService();
