// ====================================================
// SEARCH ROUTES (Fastify)
// ====================================================
// Routes for search functionality

import { searchController } from '../controllers/index.js';

export const registerSearchRoutes = async (app) => {
    /**
     * @route   GET /search/topics
     * @desc    Search topics with filtering
     * @access  Public
     * @query   q - Search query (required, min 2 chars)
     * @query   category - Category ID filter (optional)
     * @query   page - Page number (optional, max 5)
     * @query   limit - Results per page (optional, max 10)
     */
    app.get('/search/topics', searchController.searchTopics);
};
