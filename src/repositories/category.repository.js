// ====================================================
// CATEGORY REPOSITORY
// ====================================================
// Data access layer for category operations.

import prisma from '../config/database.js';

class CategoryRepository {
  /**
   * Find all categories
   */
  async findAll(includeHidden = false) {
    const where = includeHidden ? {} : { isVisible: true };

    return prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Find category by ID
   */
  async findById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Create category
   */
  async create(data) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        sortOrder: data.sortOrder || 0,
        isVisible: data.isVisible ?? true,
      },
    });
  }

  /**
   * Update category
   */
  async update(id, data) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete category
   */
  async delete(id) {
    return prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const category = await prisma.category.findFirst({ where });
    return !!category;
  }

  /**
   * Get categories with topic stats
   */
  async getWithStats() {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
        topics: {
          take: 1,
          orderBy: { lastPostAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            lastPostAt: true,
            author: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      topicCount: cat._count.topics,
      lastTopic: cat.topics[0] || null,
    }));
  }
}

export default new CategoryRepository();
