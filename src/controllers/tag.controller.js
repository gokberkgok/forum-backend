// ====================================================
// TAG CONTROLLER
// ====================================================
// HTTP layer for tag endpoints (Fastify).

import tagService from '../services/tag.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class TagController {
  /**
   * Get all tags
   * GET /api/tags
   */
  getAll = async (req, res) => {
    const tags = await tagService.getAll();

    return successResponse(res, tags, 'Tags list');
  };

  /**
   * Get popular tags
   * GET /api/tags/popular
   */
  getPopular = async (req, res) => {
    const { limit } = req.query;

    const tags = await tagService.getPopular(parseInt(limit, 10) || 20);

    return successResponse(res, tags, 'Popular tags');
  };

  /**
   * Get tag by slug
   * GET /api/tags/:slug
   */
  getBySlug = async (req, res) => {
    const { slug } = req.params;

    const tag = await tagService.getBySlug(slug);

    return successResponse(res, tag, 'Tag details');
  };

  /**
   * Get tag by ID (admin)
   * GET /api/tags/id/:id
   */
  getById = async (req, res) => {
    const { id } = req.params;

    const tag = await tagService.getById(id);

    return successResponse(res, tag, 'Tag details');
  };

  /**
   * Get topics by tag
   * GET /api/tags/:slug/topics
   */
  getTopicsByTag = async (req, res) => {
    const { slug } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await tagService.getTopicsByTagSlug({
      tagSlug: slug,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sortBy,
      sortOrder,
    });

    return res.code(200).send({
      success: true,
      message: result.notFound ? 'Tag not found' : 'Topics by tag',
      notFound: result.notFound || false,
      tag: result.tag,
      data: result.topics,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNextPage: result.page < Math.ceil(result.total / result.limit),
        hasPrevPage: result.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Search tags
   * GET /api/tags/search
   */
  search = async (req, res) => {
    const { q, limit } = req.query;

    const tags = await tagService.search(q || '', parseInt(limit, 10) || 10);

    return successResponse(res, tags, 'Search results');
  };

  /**
   * Create tag (admin)
   * POST /api/tags
   */
  create = async (req, res) => {
    const { name, slug, color } = req.body;

    const tag = await tagService.create({ name, slug, color }, req.user);

    return createdResponse(res, tag, 'Tag created');
  };

  /**
   * Update tag (admin)
   * PATCH /api/tags/:id
   */
  update = async (req, res) => {
    const { id } = req.params;
    const { name, slug, color } = req.body;

    const tag = await tagService.update(id, { name, slug, color }, req.user);

    return successResponse(res, tag, 'Tag updated');
  };

  /**
   * Delete tag (admin)
   * DELETE /api/tags/:id
   */
  delete = async (req, res) => {
    const { id } = req.params;

    const result = await tagService.delete(id, req.user);

    return successResponse(res, null, result.message);
  };
}

export default new TagController();
