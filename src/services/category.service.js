// ====================================================
// CATEGORY SERVICE
// ====================================================
// Business logic for category operations.

import { categoryRepository } from '../repositories/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { generateSlug, sanitizeContent } from '../utils/sanitize.js';
import logger from '../utils/logger.js';

class CategoryService {
  /**
   * Get all categories
   */
  async getAll(includeHidden = false) {
    return categoryRepository.findAll(includeHidden);
  }

  /**
   * Get categories with statistics
   */
  async getWithStats() {
    return categoryRepository.getWithStats();
  }

  /**
   * Get category by ID
   */
  async getById(id) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  /**
   * Create category
   */
  async create(data, userId) {
    const slug = data.slug || generateSlug(data.name);

    // Check for existing slug
    const slugExists = await categoryRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError('A category with this slug already exists');
    }

    const category = await categoryRepository.create({
      name: data.name,
      slug,
      description: data.description ? sanitizeContent(data.description) : null,
      icon: data.icon,
      color: data.color,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
    });

    logger.info({ categoryId: category.id, createdBy: userId }, 'Category created');

    return category;
  }

  /**
   * Update category
   */
  async update(id, data, userId) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== category.slug) {
      const slugExists = await categoryRepository.slugExists(data.slug, id);
      if (slugExists) {
        throw new ConflictError('A category with this slug already exists');
      }
    }

    const updateData = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = generateSlug(data.slug);
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizeContent(data.description) : null;
    }
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    const updated = await categoryRepository.update(id, updateData);

    logger.info({ categoryId: id, updatedBy: userId }, 'Category updated');

    return updated;
  }

  /**
   * Delete category
   */
  async delete(id, userId) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }

    // Check if category has topics
    if (category._count.topics > 0) {
      throw new ConflictError(
        'Cannot delete category with existing topics. Move or delete topics first.'
      );
    }

    await categoryRepository.delete(id);

    logger.info({ categoryId: id, deletedBy: userId }, 'Category deleted');

    return { message: 'Category deleted successfully' };
  }

  /**
   * Reorder categories
   */
  async reorder(orderedIds, userId) {
    // Update sort order for each category
    await Promise.all(
      orderedIds.map((id, index) =>
        categoryRepository.update(id, { sortOrder: index })
      )
    );

    logger.info({ orderedBy: userId }, 'Categories reordered');

    return this.getAll();
  }
}

export default new CategoryService();
