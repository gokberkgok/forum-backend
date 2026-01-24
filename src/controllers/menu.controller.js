// ====================================================
// MENU CONTROLLER
// ====================================================
// HTTP layer for menu endpoints (Fastify).

import menuService from '../services/menu.service.js';
import { successResponse, createdResponse } from '../utils/response.js';

class MenuController {
  /**
   * Get all menus with categories
   * GET /api/menus
   */
  getAll = async (req, res) => {
    const menus = await menuService.getAll();
    return successResponse(res, menus, 'Menus with categories');
  };

  /**
   * Get menu by ID
   * GET /api/menus/:id
   */
  getById = async (req, res) => {
    const { id } = req.params;
    const menu = await menuService.getById(id);
    return successResponse(res, menu, 'Menu details');
  };

  /**
   * Create menu
   * POST /api/menus
   */
  create = async (req, res) => {
    const { name, slug, sortOrder, isExpanded } = req.body;
    const menu = await menuService.create({ name, slug, sortOrder, isExpanded });
    return createdResponse(res, menu, 'Menu created');
  };

  /**
   * Update menu
   * PATCH /api/menus/:id
   */
  update = async (req, res) => {
    const { id } = req.params;
    const { name, slug, sortOrder, isExpanded } = req.body;
    const menu = await menuService.update(id, { name, slug, sortOrder, isExpanded });
    return successResponse(res, menu, 'Menu updated');
  };

  /**
   * Delete menu
   * DELETE /api/menus/:id
   */
  delete = async (req, res) => {
    const { id } = req.params;
    await menuService.delete(id);
    return successResponse(res, null, 'Menu deleted');
  };
}

export default new MenuController();
