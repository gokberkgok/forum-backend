// ====================================================
// TOPIC SERVICE
// ====================================================
// Business logic for topic operations.

import { topicRepository, categoryRepository, postRepository, tagRepository } from '../repositories/index.js';
import { NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../utils/errors.js';
import { generateSlug, markdownToSafeHtml, stripHtml } from '../utils/sanitize.js';
import { hasPermission } from '../middlewares/rbac.middleware.js';
import { extractHashtags } from '../utils/tagParser.js';
import { shouldCountView } from '../utils/viewTracker.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class TopicService {
  /**
   * Get topic by ID
   * @param {string} id - Topic ID
   * @param {string|null} visitorKey - User ID or IP address for view tracking
   */
  async getById(id, visitorKey = null) {
    const topic = await topicRepository.findById(id);

    if (!topic) {
      throw new NotFoundError('Topic');
    }

    // Only increment view if visitor key provided and cooldown passed
    if (visitorKey && shouldCountView(id, visitorKey)) {
      await topicRepository.incrementViewCount(id);
      logger.debug({ topicId: id, visitorKey }, 'View count incremented');
    }

    // Flatten tags structure (TagOnTopic -> Tag)
    return {
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    };
  }

  /**
   * Get topic by slug
   * @param {string} categorySlug - Category slug
   * @param {string} topicSlug - Topic slug
   * @param {string|null} visitorKey - User ID or IP address for view tracking
   */
  async getBySlug(categorySlug, topicSlug, visitorKey = null) {
    // First get category
    const category = await categoryRepository.findBySlug(categorySlug);
    if (!category) {
      throw new NotFoundError('Category');
    }

    const topic = await topicRepository.findBySlug(category.id, topicSlug);

    if (!topic) {
      throw new NotFoundError('Topic');
    }

    // Only increment view if visitor key provided and cooldown passed
    if (visitorKey && shouldCountView(topic.id, visitorKey)) {
      await topicRepository.incrementViewCount(topic.id);
      logger.debug({ topicId: topic.id, visitorKey }, 'View count incremented');
    }

    // Flatten tags structure (TagOnTopic -> Tag)
    return {
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    };
  }

  /**
   * Get topics list
   */
  async getList(params) {
    // If category slug provided, convert to ID
    if (params.categorySlug) {
      const category = await categoryRepository.findBySlug(params.categorySlug);
      if (!category) {
        throw new NotFoundError('Category');
      }
      params.categoryId = category.id;
    }

    const result = await topicRepository.findMany(params);
    
    // Flatten tags structure
    result.topics = result.topics.map(topic => ({
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    }));

    return result;
  }

  /**
   * Get latest topics
   */
  async getLatest(limit = 10) {
    const topics = await topicRepository.findLatest(limit);
    
    // Flatten tags structure
    return topics.map(topic => ({
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    }));
  }

  /**
   * Get popular topics
   */
  async getPopular(limit = 10, days = 7) {
    return topicRepository.findPopular(limit, days);
  }

  /**
   * Get most viewed topics
   */
  async getMostViewed(limit = 10, days = null) {
    const topics = await topicRepository.findMostViewed(limit, days);
    
    // Flatten tags structure
    return topics.map(topic => ({
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    }));
  }

  /**
   * Get most commented topics
   */
  async getMostCommented(limit = 10, days = null) {
    const topics = await topicRepository.findMostCommented(limit, days);
    
    // Flatten tags structure
    return topics.map(topic => ({
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    }));
  }

  /**
   * Get most liked topics
   */
  async getMostLiked(limit = 10, days = null) {
    const topics = await topicRepository.findMostLiked(limit, days);
    
    // Flatten tags structure
    return topics.map(topic => ({
      ...topic,
      tags: topic.tags?.map(t => t.tag) || [],
    }));
  }

  /**
   * Toggle like on topic
   * @param {string} topicId - Topic ID
   * @param {string} userId - User ID
   */
  async toggleLike(topicId, userId) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    const existingLike = await topicRepository.getUserLike(topicId, userId);

    if (existingLike) {
      // Remove like
      await topicRepository.removeLike(topicId, userId);
      const likeCount = await topicRepository.getLikeCount(topicId);
      logger.info({ topicId, userId }, 'Topic like removed');
      return { likes: likeCount, userLiked: false };
    } else {
      // Add like
      await topicRepository.addLike(topicId, userId);
      const likeCount = await topicRepository.getLikeCount(topicId);
      logger.info({ topicId, userId }, 'Topic like added');
      return { likes: likeCount, userLiked: true };
    }
  }

  /**
   * Check if user has liked a topic
   * @param {string} topicId - Topic ID
   * @param {string} userId - User ID
   */
  async hasUserLiked(topicId, userId) {
    const like = await topicRepository.getUserLike(topicId, userId);
    return !!like;
  }

  /**
   * Create topic
   */
  async create(data, user) {
    // Check cooldown - skip for admins/moderators
    if (user.role === 'USER') {
      const lastTopic = await topicRepository.findLastByAuthor(user.id);
      if (lastTopic) {
        const timeSinceLastTopic = (Date.now() - new Date(lastTopic.createdAt).getTime()) / 1000;
        const cooldownSeconds = config.cooldown.topicSeconds;
        if (timeSinceLastTopic < cooldownSeconds) {
          const remainingSeconds = Math.ceil(cooldownSeconds - timeSinceLastTopic);
          throw new ValidationError(`Yeni bir konu açmak için ${remainingSeconds} saniye beklemeniz gerekiyor`);
        }
      }
    }

    // Validate category exists
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError('Category');
    }

    if (!category.isVisible && user.role === 'USER') {
      throw new AuthorizationError('Cannot post in this category');
    }

    // Validate content
    if (!data.title || data.title.trim().length < 5) {
      throw new ValidationError('Title must be at least 5 characters');
    }
    if (!data.content || data.content.trim().length < 10) {
      throw new ValidationError('Content must be at least 10 characters');
    }

    // Generate slug
    let slug = generateSlug(data.title);
    
    // Ensure unique slug within category
    let slugExists = await this.slugExistsInCategory(data.categoryId, slug);
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(data.title)}-${counter}`;
      slugExists = await this.slugExistsInCategory(data.categoryId, slug);
      counter++;
    }

    // Sanitize content
    const contentHtml = markdownToSafeHtml(data.content);

    const topic = await topicRepository.create({
      title: stripHtml(data.title).slice(0, 200),
      slug,
      content: data.content,
      contentHtml,
      authorId: user.id,
      categoryId: data.categoryId,
    });

    // Collect tags from both form input and content hashtags
    const allTagNames = new Set();

    // Add tags from form input (comma-separated)
    if (data.tags && typeof data.tags === 'string') {
      const formTags = data.tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length >= 2 && t.length <= 30);
      formTags.forEach(t => allTagNames.add(t));
    }

    // Add hashtags extracted from content
    const hashtagNames = extractHashtags(data.content);
    hashtagNames.forEach(t => allTagNames.add(t));

    // Create/find tags and add to topic
    if (allTagNames.size > 0) {
      const tags = await tagRepository.findOrCreateMany([...allTagNames]);
      await tagRepository.addTagsToTopic(topic.id, tags.map(t => t.id));
      logger.info({ topicId: topic.id, tags: [...allTagNames] }, 'Tags added to topic');
    }

    logger.info({ topicId: topic.id, authorId: user.id }, 'Topic created');

    return topic;
  }

  /**
   * Update topic
   */
  async update(id, data, user) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    // Check authorization
    const isOwner = topic.authorId === user.id;
    const canEditAny = hasPermission(user.role, 'topic:edit:any');

    if (!isOwner && !canEditAny) {
      throw new AuthorizationError('You can only edit your own topics');
    }

    // Check if locked
    if (topic.isLocked && !canEditAny) {
      throw new AuthorizationError('This topic is locked');
    }

    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = stripHtml(data.title).slice(0, 200);
      // Update slug if title changed
      const newSlug = generateSlug(data.title);
      if (newSlug !== topic.slug) {
        let slugExists = await this.slugExistsInCategory(topic.categoryId, newSlug, id);
        updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.contentHtml = markdownToSafeHtml(data.content);

      // Extract and update hashtags from new content
      const hashtagNames = extractHashtags(data.content);
      const tags = await tagRepository.findOrCreateMany(hashtagNames);
      await tagRepository.updateTopicTags(id, tags.map(t => t.id));
      logger.info({ topicId: id, tags: hashtagNames }, 'Topic tags updated');
    }

    const updated = await topicRepository.update(id, updateData);

    logger.info({ topicId: id, updatedBy: user.id }, 'Topic updated');

    return updated;
  }

  /**
   * Delete topic
   */
  async delete(id, user) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    const isOwner = topic.authorId === user.id;
    const canDeleteAny = hasPermission(user.role, 'topic:delete:any');

    if (!isOwner && !canDeleteAny) {
      throw new AuthorizationError('You can only delete your own topics');
    }

    await topicRepository.delete(id);

    logger.info({ topicId: id, deletedBy: user.id }, 'Topic deleted');

    return { message: 'Topic deleted successfully' };
  }

  /**
   * Pin/unpin topic
   */
  async togglePin(id, user, pinnedColor = null) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    const updateData = {
      isPinned: !topic.isPinned,
    };

    // pinnedColor sadece pin ediliyorsa ayarlanır
    if (!topic.isPinned && pinnedColor) {
      updateData.pinnedColor = pinnedColor;
    }

    // Eğer unpin ediliyorsa pinnedColor'ı temizle
    if (topic.isPinned) {
      updateData.pinnedColor = null;
    }

    const updated = await topicRepository.update(id, updateData);

    logger.info(
      { topicId: id, pinned: updated.isPinned, pinnedColor: updated.pinnedColor, by: user.id },
      'Topic pin toggled'
    );

    return updated;
  }

  /**
   * Update pinned topic color
   */
  async updatePinnedColor(id, user, pinnedColor) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    if (!topic.isPinned) {
      throw new ValidationError('Topic must be pinned to set a color');
    }

    const updated = await topicRepository.update(id, { pinnedColor });

    logger.info(
      { topicId: id, pinnedColor, by: user.id },
      'Topic pinned color updated'
    );

    return updated;
  }

  /**
   * Lock/unlock topic
   */
  async toggleLock(id, user) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    const updated = await topicRepository.update(id, {
      isLocked: !topic.isLocked,
    });

    logger.info(
      { topicId: id, locked: updated.isLocked, by: user.id },
      'Topic lock toggled'
    );

    return updated;
  }

  /**
   * Move topic to different category
   */
  async move(id, categoryId, user) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category');
    }

    // Check if slug exists in new category
    let slug = topic.slug;
    const slugExists = await this.slugExistsInCategory(categoryId, slug, id);
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    const updated = await topicRepository.update(id, {
      categoryId,
      slug,
    });

    logger.info(
      { topicId: id, newCategoryId: categoryId, by: user.id },
      'Topic moved'
    );

    return updated;
  }

  /**
   * Check if slug exists in category
   */
  async slugExistsInCategory(categoryId, slug, excludeId = null) {
    try {
      const topic = await topicRepository.findBySlug(categoryId, slug);
      return topic && (!excludeId || topic.id !== excludeId);
    } catch {
      return false;
    }
  }

  /**
   * Get topic author ID
   */
  async getAuthorId(id) {
    return topicRepository.getAuthorId(id);
  }
}

export default new TopicService();
