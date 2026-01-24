// ====================================================
// TOPIC CONTROLLER
// ====================================================
// HTTP layer for topic endpoints (Fastify).

import { topicService } from '../services/index.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class TopicController {
  /**
   * Get topics list
   * GET /api/topics
   */
  getList = async (req, res) => {
    const { 
      page, 
      limit, 
      categorySlug, 
      authorId, 
      status, 
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await topicService.getList({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      categorySlug,
      authorId,
      status,
      search,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(res, result.topics, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  };

  /**
   * Get topic by slug
   * GET /api/topics/:categorySlug/:topicSlug
   */
  getBySlug = async (req, res) => {
    const { categorySlug, topicSlug } = req.params;

    // Use user ID if authenticated, otherwise use IP address for view tracking
    const visitorKey = req.userId || req.ip || req.headers['x-forwarded-for'];

    const topic = await topicService.getBySlug(categorySlug, topicSlug, visitorKey);
    
    // Check if user has liked this topic
    let userLiked = false;
    if (req.userId) {
      userLiked = await topicService.hasUserLiked(topic.id, req.userId);
    }

    return successResponse(res, { ...topic, userLiked }, 'Topic details');
  };

  /**
   * Get topic by ID
   * GET /api/topics/id/:id
   */
  getById = async (req, res) => {
    const { id } = req.params;

    // Use user ID if authenticated, otherwise use IP address for view tracking
    const visitorKey = req.userId || req.ip || req.headers['x-forwarded-for'];

    const topic = await topicService.getById(id, visitorKey);
    
    // Check if user has liked this topic
    let userLiked = false;
    if (req.userId) {
      userLiked = await topicService.hasUserLiked(topic.id, req.userId);
    }

    return successResponse(res, { ...topic, userLiked }, 'Topic details');
  };

  /**
   * Get latest topics
   * GET /api/topics/latest
   */
  getLatest = async (req, res) => {
    const { limit } = req.query;

    const topics = await topicService.getLatest(parseInt(limit, 10) || 10);

    return successResponse(res, topics, 'Latest topics');
  };

  /**
   * Get popular topics
   * GET /api/topics/popular
   */
  getPopular = async (req, res) => {
    const { limit, days } = req.query;

    const topics = await topicService.getPopular(
      parseInt(limit, 10) || 10,
      parseInt(days, 10) || 7
    );

    return successResponse(res, topics, 'Popular topics');
  };

  /**
   * Get most viewed topics
   * GET /api/topics/most-viewed
   */
  getMostViewed = async (req, res) => {
    const { limit, days } = req.query;

    const topics = await topicService.getMostViewed(
      parseInt(limit, 10) || 10,
      days ? parseInt(days, 10) : null
    );

    return successResponse(res, topics, 'Most viewed topics');
  };

  /**
   * Get most commented topics
   * GET /api/topics/most-commented
   */
  getMostCommented = async (req, res) => {
    const { limit, days } = req.query;

    const topics = await topicService.getMostCommented(
      parseInt(limit, 10) || 10,
      days ? parseInt(days, 10) : null
    );

    return successResponse(res, topics, 'Most commented topics');
  };

  /**
   * Get most liked topics
   * GET /api/topics/most-liked
   */
  getMostLiked = async (req, res) => {
    const { limit, days } = req.query;

    const topics = await topicService.getMostLiked(
      parseInt(limit, 10) || 10,
      days ? parseInt(days, 10) : null
    );

    return successResponse(res, topics, 'Most liked topics');
  };

  /**
   * Toggle like on topic
   * POST /api/topics/:id/like
   */
  toggleLike = async (req, res) => {
    const { id } = req.params;

    const result = await topicService.toggleLike(id, req.user.id);

    return successResponse(res, result, result.userLiked ? 'Topic liked' : 'Like removed');
  };

  /**
   * Create topic
   * POST /api/topics
   */
  create = async (req, res) => {
    const { title, content, categoryId, tags } = req.body;

    const topic = await topicService.create(
      { title, content, categoryId, tags },
      req.user
    );

    return createdResponse(res, topic, 'Topic created');
  };

  /**
   * Update topic
   * PATCH /api/topics/:id
   */
  update = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    const topic = await topicService.update(id, { title, content }, req.user);

    return successResponse(res, topic, 'Topic updated');
  };

  /**
   * Delete topic
   * DELETE /api/topics/:id
   */
  delete = async (req, res) => {
    const { id } = req.params;

    const result = await topicService.delete(id, req.user);

    return successResponse(res, null, result.message);
  };

  /**
   * Pin/unpin topic (moderator+)
   * POST /api/topics/:id/pin
   */
  togglePin = async (req, res) => {
    const { id } = req.params;
    const { pinnedColor } = req.body;

    const topic = await topicService.togglePin(id, req.user, pinnedColor);

    return successResponse(res, topic, topic.isPinned ? 'Topic pinned' : 'Topic unpinned');
  };

  /**
   * Update pinned topic color (moderator+)
   * PATCH /api/topics/:id/pinned-color
   */
  updatePinnedColor = async (req, res) => {
    const { id } = req.params;
    const { pinnedColor } = req.body;

    const topic = await topicService.updatePinnedColor(id, req.user, pinnedColor);

    return successResponse(res, topic, 'Pinned color updated');
  };

  /**
   * Lock/unlock topic (moderator+)
   * POST /api/topics/:id/lock
   */
  toggleLock = async (req, res) => {
    const { id } = req.params;

    const topic = await topicService.toggleLock(id, req.user);

    return successResponse(res, topic, topic.isLocked ? 'Topic locked' : 'Topic unlocked');
  };

  /**
   * Move topic (moderator+)
   * POST /api/topics/:id/move
   */
  move = async (req, res) => {
    const { id } = req.params;
    const { categoryId } = req.body;

    const topic = await topicService.move(id, categoryId, req.user);

    return successResponse(res, topic, 'Topic moved');
  };
}

export default new TopicController();
