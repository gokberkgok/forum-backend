// ====================================================
// CATEGORY CONTROLLER
// ====================================================
// HTTP layer for category endpoints (Fastify).

import { categoryService } from '../services/index.js';
import { successResponse, createdResponse } from '../utils/response.js';

class CategoryController {
  /**
   * Get all categories
   * GET /api/categories
   */
  getAll = async (req, res) => {
    const includeHidden = req.user?.role === 'ADMIN';
    const categories = await categoryService.getAll(includeHidden);

    return successResponse(res, categories, 'Categories list');
  };

  /**
   * Get categories with stats
   * GET /api/categories/stats
   */
  getWithStats = async (req, res) => {
    const categories = await categoryService.getWithStats();

    return successResponse(res, categories, 'Categories with statistics');
  };

  /**
   * Get category by slug
   * GET /api/categories/:slug
   */
  getBySlug = async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getBySlug(slug);

    return successResponse(res, category, 'Category details');
  };

  /**
   * Create category (admin)
   * POST /api/categories
   */
  create = async (req, res) => {
    const { name, slug, description, icon, color, sortOrder, isVisible } = req.body;

    const category = await categoryService.create(
      { name, slug, description, icon, color, sortOrder, isVisible },
      req.userId
    );

    return createdResponse(res, category, 'Category created');
  };

  /**
   * Update category (admin)
   * PATCH /api/categories/:id
   */
  update = async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, icon, color, sortOrder, isVisible } = req.body;

    const category = await categoryService.update(
      id,
      { name, slug, description, icon, color, sortOrder, isVisible },
      req.userId
    );

    return successResponse(res, category, 'Category updated');
  };

  /**
   * Delete category (admin)
   * DELETE /api/categories/:id
   */
  delete = async (req, res) => {
    const { id } = req.params;

    const result = await categoryService.delete(id, req.userId);

    return successResponse(res, null, result.message);
  };

  /**
   * Reorder categories (admin)
   * PUT /api/categories/reorder
   */
  reorder = async (req, res) => {
    const { orderedIds } = req.body;

    const categories = await categoryService.reorder(orderedIds, req.userId);

    return successResponse(res, categories, 'Categories reordered');
  };
}

export default new CategoryController();
