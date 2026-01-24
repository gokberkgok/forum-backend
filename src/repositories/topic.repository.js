// ====================================================
// TOPIC REPOSITORY
// ====================================================
// Data access layer for topic operations.

import prisma from '../config/database.js';

class TopicRepository {
  /**
   * Find topic by ID
   */
  async findById(id) {
    return prisma.topic.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                posts: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Find topic by slug within category
   */
  async findBySlug(categoryId, slug) {
    return prisma.topic.findUnique({
      where: {
        categoryId_slug: { categoryId, slug },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                posts: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Create topic
   */
  async create(data) {
    return prisma.topic.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        contentHtml: data.contentHtml,
        authorId: data.authorId,
        categoryId: data.categoryId,
        lastPostAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Update topic
   */
  async update(id, data) {
    return prisma.topic.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Delete topic
   */
  async delete(id) {
    return prisma.topic.delete({
      where: { id },
    });
  }

  /**
   * Find last topic by author (for cooldown check)
   */
  async findLastByAuthor(authorId) {
    return prisma.topic.findFirst({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    return prisma.topic.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Update last post time
   */
  async updateLastPostAt(id) {
    return prisma.topic.update({
      where: { id },
      data: {
        lastPostAt: new Date(),
      },
    });
  }

  /**
   * Find topics with pagination
   */
  async findMany({ 
    page = 1, 
    limit = 20, 
    categoryId, 
    authorId, 
    status,
    search,
    sortBy = 'lastPostAt',
    sortOrder = 'desc',
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (authorId) where.authorId = authorId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    
    // Pinned topics first, then sort by specified field
    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { [sortBy]: sortOrder },
        ],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              role: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              posts: true,
              likes: true,
            },
          },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return { topics, total, page, limit };
  }

  /**
   * Find latest topics
   */
  async findLatest(limit = 10) {
    return prisma.topic.findMany({
      where: { status: 'OPEN' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Find popular topics
   */
  async findPopular(limit = 10, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.topic.findMany({
      where: {
        status: 'OPEN',
        createdAt: { gte: since },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Find most viewed topics (all time or with date filter)
   */
  async findMostViewed(limit = 10, days = null) {
    const where = { status: 'OPEN' };
    
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.createdAt = { gte: since };
    }

    return prisma.topic.findMany({
      where,
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * Find most commented topics
   */
  async findMostCommented(limit = 10, days = null) {
    const where = { status: 'OPEN' };
    
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.createdAt = { gte: since };
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return topics;
  }

  /**
   * Get author ID for a topic
   */
  async getAuthorId(id) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      select: { authorId: true },
    });
    return topic?.authorId;
  }

  // ====================================================
  // TOPIC LIKE METHODS
  // ====================================================

  /**
   * Check if user has liked a topic
   */
  async getUserLike(topicId, userId) {
    return prisma.topicLike.findUnique({
      where: {
        userId_topicId: { userId, topicId },
      },
    });
  }

  /**
   * Get like count for a topic
   */
  async getLikeCount(topicId) {
    return prisma.topicLike.count({
      where: { topicId },
    });
  }

  /**
   * Add like to topic
   */
  async addLike(topicId, userId) {
    return prisma.topicLike.create({
      data: { topicId, userId },
    });
  }

  /**
   * Remove like from topic
   */
  async removeLike(topicId, userId) {
    return prisma.topicLike.delete({
      where: {
        userId_topicId: { userId, topicId },
      },
    });
  }

  /**
   * Find most liked topics
   */
  async findMostLiked(limit = 10, days = null) {
    const where = { status: 'OPEN' };
    
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.createdAt = { gte: since };
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
            likes: true,
          },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return topics;
  }
}

export default new TopicRepository();
