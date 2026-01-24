// ====================================================
// MENU REPOSITORY
// ====================================================
// Data access layer for menu operations.

import prisma from '../config/database.js';

class MenuRepository {
  /**
   * Find all menus with their categories
   */
  async findAll() {
    return prisma.menu.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { topics: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find menu by ID
   */
  async findById(id) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Find menu by slug
   */
  async findBySlug(slug) {
    return prisma.menu.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Create menu
   */
  async create(data) {
    return prisma.menu.create({
      data: {
        name: data.name,
        slug: data.slug,
        sortOrder: data.sortOrder || 0,
        isExpanded: data.isExpanded ?? true,
      },
    });
  }

  /**
   * Update menu
   */
  async update(id, data) {
    return prisma.menu.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete menu
   */
  async delete(id) {
    return prisma.menu.delete({
      where: { id },
    });
  }
}

export default new MenuRepository();
