// ====================================================
// WEBSOCKET SERVICE
// ====================================================
// Manages WebSocket connections and online users in real-time

import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

class WebSocketService {
    constructor() {
        // Map to store active connections: userId -> { ws, user }
        this.connections = new Map();
    }

    /**
     * Register a new WebSocket connection
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} accessToken - JWT access token
     */
    async connect(ws, accessToken) {
        try {
            // Verify token
            const decoded = verifyAccessToken(accessToken);
            if (!decoded) {
                ws.close(1008, 'Invalid token');
                return;
            }

            // Get user from database
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    role: true,
                    status: true,
                },
            });

            if (!user || user.status !== 'ACTIVE') {
                ws.close(1008, 'User not active');
                return;
            }

            // Store connection
            this.connections.set(user.id, { ws, user });

            console.log(`[WebSocket] ✅ User connected: ${user.username} (${user.id})`);
            console.log(`[WebSocket] 📊 Total connections: ${this.connections.size}`);

            // Send current online users to this client
            ws.send(JSON.stringify({
                type: 'online-users',
                users: this.getOnlineUsers(),
                count: this.connections.size,
            }));

            // Broadcast update to all clients
            this.broadcastOnlineUsers();

            // Handle disconnect
            ws.on('close', () => {
                this.disconnect(user.id);
            });

            // Handle ping messages (optional keepalive)
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    if (data.type === 'ping') {
                        ws.send(JSON.stringify({ type: 'pong' }));
                    }
                } catch (err) {
                    console.error('[WebSocket] Invalid message:', err);
                }
            });

        } catch (error) {
            console.error('[WebSocket] ❌ Connection error:', error.message);
            ws.close(1011, 'Internal error');
        }
    }

    /**
     * Remove a connection
     * @param {string} userId - User ID
     */
    disconnect(userId) {
        if (this.connections.has(userId)) {
            const { user } = this.connections.get(userId);
            this.connections.delete(userId);

            console.log(`[WebSocket] 🔌 User disconnected: ${user.username} (${userId})`);
            console.log(`[WebSocket] 📊 Total connections: ${this.connections.size}`);

            // Broadcast updated list
            this.broadcastOnlineUsers();
        }
    }

    /**
     * Get list of online users
     * @returns {Array} Online users
     */
    getOnlineUsers() {
        const users = [];
        for (const [userId, { user }] of this.connections) {
            users.push({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                role: user.role,
            });
        }
        return users;
    }

    /**
     * Broadcast online users to all connected clients
     */
    broadcastOnlineUsers() {
        const message = JSON.stringify({
            type: 'online-users',
            users: this.getOnlineUsers(),
            count: this.connections.size,
        });

        let successCount = 0;
        for (const [userId, { ws }] of this.connections) {
            try {
                if (ws.readyState === 1) { // OPEN
                    ws.send(message);
                    successCount++;
                }
            } catch (err) {
                console.error(`[WebSocket] Failed to send to ${userId}:`, err.message);
            }
        }

        console.log(`[WebSocket] 📡 Broadcast to ${successCount}/${this.connections.size} clients`);
    }

    /**
     * Get connection count
     * @returns {number} Number of active connections
     */
    getConnectionCount() {
        return this.connections.size;
    }
}

export default new WebSocketService();
