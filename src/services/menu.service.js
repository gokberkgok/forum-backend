// ====================================================
// MENU SERVICE
// ====================================================
// Business logic for menu operations.

import menuRepository from '../repositories/menu.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { generateSlug } from '../utils/sanitize.js';

class MenuService {
  /**
   * Get all menus with categories
   */
  async getAll() {
    return menuRepository.findAll();
  }

  /**
   * Get menu by ID
   */
  async getById(id) {
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundError('Menu');
    }
    return menu;
  }

  /**
   * Get menu by slug
   */
  async getBySlug(slug) {
    const menu = await menuRepository.findBySlug(slug);
    if (!menu) {
      throw new NotFoundError('Menu');
    }
    return menu;
  }

  /**
   * Create menu
   */
  async create(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('Menu name must be at least 2 characters');
    }

    const slug = data.slug || generateSlug(data.name);

    return menuRepository.create({
      name: data.name.trim(),
      slug,
      sortOrder: data.sortOrder || 0,
      isExpanded: data.isExpanded ?? true,
    });
  }

  /**
   * Update menu
   */
  async update(id, data) {
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return menuRepository.update(id, data);
  }

  /**
   * Delete menu
   */
  async delete(id) {
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return menuRepository.delete(id);
  }
}

export default new MenuService();
