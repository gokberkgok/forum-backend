// ====================================================
// POST CONTROLLER
// ====================================================
// HTTP layer for post (reply) endpoints (Fastify).

import { postService } from '../services/index.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class PostController {
  /**
   * Get posts for topic
   * GET /api/posts/topic/:topicId
   */
  getByTopic = async (req, res) => {
    const { topicId } = req.params;
    const { page, limit, sortOrder } = req.query;

    const result = await postService.getByTopic({
      topicId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sortOrder: sortOrder || 'asc',
    });

    return paginatedResponse(res, result.posts, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  };

  /**
   * Get posts by user
   * GET /api/posts/user/:userId
   */
  getByUser = async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await postService.getByUser({
      userId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    return paginatedResponse(res, result.posts, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  };

  /**
   * Get most liked posts
   * GET /api/posts/most-liked
   */
  getMostLiked = async (req, res) => {
    const { limit, days } = req.query;

    const posts = await postService.getMostLiked(
      parseInt(limit, 10) || 10,
      days ? parseInt(days, 10) : null
    );

    return successResponse(res, posts, 'Most liked posts');
  };

  /**
   * Get post by ID
   * GET /api/posts/:id
   */
  getById = async (req, res) => {
    const { id } = req.params;

    const post = await postService.getById(id);

    return successResponse(res, post, 'Post details');
  };

  /**
   * Create post (reply)
   * POST /api/posts
   */
 create = async (req, res) => {
  const { content, topicId, parentId, isQuoted, quotedPostId } = req.body;

  const post = await postService.create(
    { content, topicId, parentId, isQuoted, quotedPostId },
    req.user
  );

    return createdResponse(res, post, 'Reply posted');
  };

  /**
   * Update post
   * PATCH /api/posts/:id
   */
  update = async (req, res) => {
    const { id } = req.params;
    const { content, editReason } = req.body;

    const post = await postService.update(id, { content, editReason }, req.user);

    return successResponse(res, post, 'Post updated');
  };

  /**
   * Delete post
   * DELETE /api/posts/:id
   */
  delete = async (req, res) => {
    const { id } = req.params;
    const { hard } = req.query;

    const result = await postService.delete(id, req.user, hard === 'true');

    return successResponse(res, null, result.message);
  };

  /**
   * Hide post (moderator+)
   * POST /api/posts/:id/hide
   */
  hide = async (req, res) => {
    const { id } = req.params;

    const result = await postService.hide(id, req.user);

    return successResponse(res, null, result.message);
  };

  /**
   * Unhide post (moderator+)
   * POST /api/posts/:id/unhide
   */
  unhide = async (req, res) => {
    const { id } = req.params;

    const result = await postService.unhide(id, req.user);

    return successResponse(res, null, result.message);
  };

  /**
   * Add reaction
   * POST /api/posts/:id/reactions
   */
  addReaction = async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;

    const reactions = await postService.addReaction(id, req.userId, type);

    return successResponse(res, reactions, 'Reaction added');
  };

  /**
   * Remove reaction
   * DELETE /api/posts/:id/reactions
   */
  removeReaction = async (req, res) => {
    const { id } = req.params;

    const reactions = await postService.removeReaction(id, req.userId);

    return successResponse(res, reactions, 'Reaction removed');
  };

  /**
   * Toggle like on post
   * POST /api/posts/:id/like
   */
  toggleLike = async (req, res) => {
    const { id } = req.params;

    const result = await postService.toggleLike(id, req.userId);

    return successResponse(res, result, result.userLiked ? 'Post liked' : 'Post unliked');
  };
}

export default new PostController();
