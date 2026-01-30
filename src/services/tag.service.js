// ====================================================
// TAG SERVICE
// ====================================================
// Business logic for tag operations.

import tagRepository from '../repositories/tag.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class TagService {
  /**
   * Get all tags
   */
  async getAll() {
    return tagRepository.findAll();
  }

  /**
   * Get popular tags
   */
  async getPopular(limit = 20) {
    return tagRepository.findPopular(limit);
  }

  /**
   * Get tag by slug
   */
  async getBySlug(slug) {
    const tag = await tagRepository.findBySlug(slug);

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    return tag;
  }

  /**
   * Get tag by ID
   */
  async getById(id) {
    const tag = await tagRepository.findById(id);

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    return tag;
  }

  /**
   * Get topics by tag slug
   */
  async getTopicsByTagSlug({ tagSlug, page = 1, limit = 20, sortBy, sortOrder }) {
    const result = await tagRepository.getTopicsByTagSlug({
      tagSlug,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // If tag not found, return empty result with a placeholder tag
    if (!result.tag) {
      return {
        tag: { id: null, name: tagSlug, slug: tagSlug, color: null },
        topics: [],
        total: 0,
        page,
        limit,
        notFound: true,
      };
    }

    // Format topics with tags
    const topics = result.topics.map(topic => ({
      ...topic,
      tags: topic.tags.map(t => t.tag),
    }));

    return {
      tag: result.tag,
      topics,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Create tag (admin only)
   */
  async create(data, user) {
    // Check if tag with same name exists
    const existing = await tagRepository.findByName(data.name);
    if (existing) {
      throw new ValidationError('Tag with this name already exists');
    }

    // Generate slug
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug exists
    const slugExists = await tagRepository.findBySlug(slug);
    if (slugExists) {
      throw new ValidationError('Tag with this slug already exists');
    }

    return tagRepository.create({
      name: data.name,
      slug,
      color: data.color,
    });
  }

  /**
   * Update tag (admin only)
   */
  async update(id, data, user) {
    const tag = await tagRepository.findById(id);

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== tag.name) {
      const existing = await tagRepository.findByName(data.name);
      if (existing) {
        throw new ValidationError('Tag with this name already exists');
      }
    }

    // If slug is being changed, check for duplicates
    if (data.slug && data.slug !== tag.slug) {
      const slugExists = await tagRepository.findBySlug(data.slug);
      if (slugExists) {
        throw new ValidationError('Tag with this slug already exists');
      }
    }

    return tagRepository.update(id, data);
  }

  /**
   * Delete tag (admin only)
   */
  async delete(id, user) {
    const tag = await tagRepository.findById(id);

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    await tagRepository.delete(id);

    return { message: 'Tag deleted successfully' };
  }

  /**
   * Search tags
   */
  async search(query, limit = 10) {
    return tagRepository.search(query, limit);
  }

  /**
   * Find or create tags by names
   */
  async findOrCreateByNames(tagNames) {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    // Validate tag names
    const validNames = tagNames
      .map(name => name.trim())
      .filter(name => name.length > 0 && name.length <= 30);

    if (validNames.length === 0) {
      return [];
    }

    return tagRepository.findOrCreateMany(validNames);
  }

  /**
   * Update topic tags
   */
  async updateTopicTags(topicId, tagNames) {
    const tags = await this.findOrCreateByNames(tagNames);
    const tagIds = tags.map(t => t.id);

    await tagRepository.updateTopicTags(topicId, tagIds);

    return tags;
  }
}

export default new TagService();
