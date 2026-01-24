// ====================================================
// POST REPOSITORY
// ====================================================
// Data access layer for post (reply) operations.

import prisma from '../config/database.js';

class PostRepository {
  /**
   * Find post by ID
   */
  async findById(id) {
    return prisma.post.findUnique({
      where: { id },
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
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
            isLocked: true,
            categoryId: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });
  }

  /**
   * Create post
   */
  async create(data) {
    return prisma.post.create({
      data: {
        content: data.content,
        contentHtml: data.contentHtml,
        authorId: data.authorId,
        topicId: data.topicId,
        parentId: data.parentId || null,
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
      },
    });
  }

  /**
   * Update post
   */
  async update(id, data) {
    return prisma.post.update({
      where: { id },
      data: {
        ...data,
        isEdited: true,
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
      },
    });
  }

  /**
   * Soft delete post (hide)
   */
  async softDelete(id) {
    return prisma.post.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }

  /**
   * Hard delete post
   */
  async delete(id) {
    return prisma.post.delete({
      where: { id },
    });
  }

  /**
   * Find last post by author (for cooldown check)
   */
  async findLastByAuthor(authorId) {
    return prisma.post.findFirst({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
  }

  /**
   * Find posts for topic with pagination
   */
  async findByTopic({
    topicId,
    page = 1,
    limit = 20,
    sortOrder = 'asc',
  }) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          topicId,
          status: 'VISIBLE',
          parentId: null, // Only top-level posts
        },
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
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
          reactions: {
            select: {
              type: true,
              userId: true,
            },
          },
          replies: {
            where: { status: 'VISIBLE' },
            orderBy: { createdAt: 'asc' },
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
              reactions: {
                select: {
                  type: true,
                  userId: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: {
          topicId,
          status: 'VISIBLE',
          parentId: null,
        },
      }),
    ]);

    return { posts, total, page, limit };
  }

  /**
   * Find posts by user
   */
  async findByUser({ userId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: userId,
          status: 'VISIBLE',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.post.count({
        where: {
          authorId: userId,
          status: 'VISIBLE',
        },
      }),
    ]);

    return { posts, total, page, limit };
  }

  /**
   * Get author ID for a post
   */
  async getAuthorId(id) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    return post?.authorId;
  }

  /**
   * Add reaction to post
   */
  async addReaction(postId, userId, type) {
    return prisma.reaction.upsert({
      where: {
        userId_postId_type: { userId, postId, type },
      },
      create: {
        type,
        userId,
        postId,
      },
      update: {},
    });
  }

  /**
   * Remove reaction from post
   */
  async removeReaction(postId, userId) {
    return prisma.reaction.deleteMany({
      where: { postId, userId },
    });
  }

  /**
   * Get user's reaction for a post
   */
  async getUserReaction(postId, userId) {
    return prisma.reaction.findFirst({
      where: { postId, userId },
    });
  }

  /**
   * Get reaction counts for post
   */
  async getReactionCounts(postId) {
    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { type: true },
    });

    return reactions.reduce((acc, r) => {
      acc[r.type] = r._count.type;
      return acc;
    }, {});
  }

  /**
   * Get user reactions for multiple posts
   */
  async getUserReactionsForPosts(postIds, userId) {
    return prisma.reaction.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
      select: {
        postId: true,
        type: true,
      },
    });
  }

  /**
   * Find most liked posts
   */
  async findMostLiked(limit = 10, days = null) {
    const where = { status: 'VISIBLE' };
    
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.createdAt = { gte: since };
    }

    // Get posts with their like counts
    const posts = await prisma.post.findMany({
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
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        reactions: {
          where: { type: 'like' },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    // Sort by like count and take top N
    return posts
      .map(post => ({
        ...post,
        likeCount: post.reactions.length,
        reactions: undefined, // Remove reactions array from response
      }))
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  }
}

export default new PostRepository();
