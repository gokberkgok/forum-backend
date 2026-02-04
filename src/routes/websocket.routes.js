// ====================================================
// WEBSOCKET ROUTES
// ====================================================
// WebSocket endpoint for real-time online users

import websocketService from '../services/websocket.service.js';

export const registerWebSocketRoutes = async (app) => {
    // WebSocket endpoint - Fastify WebSocket handler
    app.get('/ws', { websocket: true }, async (socket, req) => {
        // In @fastify/websocket, the first param IS the WebSocket
        console.log('[WebSocket Route] New connection attempt');

        // Get access token from query params or cookies
        const accessToken = req.query.token || req.cookies?.accessToken;

        if (!accessToken) {
            console.error('[WebSocket Route] ❌ No access token provided');
            socket.close(1008, 'Authentication required');
            return;
        }

        console.log('[WebSocket Route] ✅ Access token found, connecting...');

        // Register connection
        await websocketService.connect(socket, accessToken);
    });
};
