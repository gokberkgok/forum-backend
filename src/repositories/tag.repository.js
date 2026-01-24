// ====================================================
// TAG REPOSITORY
// ====================================================
// Data access layer for tag operations.

import prisma from '../config/database.js';

class TagRepository {
  /**
   * Find tag by ID
   */
  async findById(id) {
    return prisma.tag.findUnique({
      where: { id },
    });
  }

  /**
   * Find tag by slug
   */
  async findBySlug(slug) {
    return prisma.tag.findUnique({
      where: { slug },
    });
  }

  /**
   * Find tag by name
   */
  async findByName(name) {
    return prisma.tag.findUnique({
      where: { name },
    });
  }

  /**
   * Get all tags
   */
  async findAll() {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
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
   * Get popular tags (by topic count)
   */
  async findPopular(limit = 20) {
    return prisma.tag.findMany({
      take: limit,
      orderBy: {
        topics: {
          _count: 'desc',
        },
      },
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
   * Create tag
   */
  async create(data) {
    return prisma.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
        color: data.color,
      },
    });
  }

  /**
   * Update tag
   */
  async update(id, data) {
    return prisma.tag.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete tag
   */
  async delete(id) {
    return prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Find or create tags by names
   */
  async findOrCreateMany(tagNames) {
    const tags = [];
    
    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      let tag = await prisma.tag.findUnique({ where: { slug } });
      
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name, slug },
        });
      }
      
      tags.push(tag);
    }
    
    return tags;
  }

  /**
   * Add tags to topic
   */
  async addTagsToTopic(topicId, tagIds) {
    const data = tagIds.map(tagId => ({
      topicId,
      tagId,
    }));

    await prisma.tagOnTopic.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Remove all tags from topic
   */
  async removeAllTagsFromTopic(topicId) {
    await prisma.tagOnTopic.deleteMany({
      where: { topicId },
    });
  }

  /**
   * Update topic tags (replace all)
   */
  async updateTopicTags(topicId, tagIds) {
    await this.removeAllTagsFromTopic(topicId);
    if (tagIds.length > 0) {
      await this.addTagsToTopic(topicId, tagIds);
    }
  }

  /**
   * Get topics by tag slug with pagination
   */
  async getTopicsByTagSlug({ 
    tagSlug, 
    page = 1, 
    limit = 20,
    sortBy = 'lastPostAt',
    sortOrder = 'desc',
  }) {
    const skip = (page - 1) * limit;

    const tag = await prisma.tag.findUnique({
      where: { slug: tagSlug },
    });

    if (!tag) {
      return { topics: [], total: 0, page, limit, tag: null };
    }

    const where = {
      tags: {
        some: {
          tagId: tag.id,
        },
      },
    };

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
            },
          },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return { topics, total, page, limit, tag };
  }

  /**
   * Search tags by name
   */
  async search(query, limit = 10) {
    return prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }
}

export default new TagRepository();
