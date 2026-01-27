// ====================================================
// POST SERVICE
// ====================================================
// Business logic for post (reply) operations.

import { postRepository, topicRepository, tagRepository } from '../repositories/index.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { markdownToSafeHtml } from '../utils/sanitize.js';
import { hasPermission } from '../middlewares/rbac.middleware.js';
import { extractHashtags } from '../utils/tagParser.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class PostService {
  /**
   * Get post by ID
   */
  async getById(id) {
    const post = await postRepository.findById(id);

    if (!post) {
      throw new NotFoundError('Post');
    }

    return post;
  }

  /**
   * Get posts for topic
   */
  async getByTopic(params) {
    return postRepository.findByTopic(params);
  }

  /**
   * Get posts by user
   */
  async getByUser(params) {
    return postRepository.findByUser(params);
  }

  /**
   * Get most liked posts
   */
  async getMostLiked(limit = 10, days = null) {
    return postRepository.findMostLiked(limit, days);
  }

  /**
   * Create post (reply)
   */
  async create(data, user) {
    // Check cooldown - skip for admins/moderators
    if (user.role === 'USER') {
      const lastPost = await postRepository.findLastByAuthor(user.id);
      if (lastPost) {
        const timeSinceLastPost = (Date.now() - new Date(lastPost.createdAt).getTime()) / 1000;
        const cooldownSeconds = config.cooldown.postSeconds;
        if (timeSinceLastPost < cooldownSeconds) {
          const remainingSeconds = Math.ceil(cooldownSeconds - timeSinceLastPost);
          throw new ValidationError(`Yeni bir mesaj göndermek için ${remainingSeconds} saniye beklemeniz gerekiyor`);
        }
      }
    }

    // Validate topic exists
    const topic = await topicRepository.findById(data.topicId);
    if (!topic) {
      throw new NotFoundError('Topic');
    }

    // Check if topic is locked
    if (topic.isLocked && !hasPermission(user.role, 'topic:lock')) {
      throw new AuthorizationError('This topic is locked');
    }

    // Validate content
    if (!data.content || data.content.trim().length < 10) {
      throw new ValidationError('Post content must be at least 10 characters');
    }

    if (data.content.length > 50000) {
      throw new ValidationError('Post content is too long');
    }

    // If replying to a post, validate parent exists
    if (data.parentId) {
      const parentPost = await postRepository.findById(data.parentId);
      if (!parentPost) {
        throw new NotFoundError('Parent post');
      }
      if (parentPost.topicId !== data.topicId) {
        throw new ValidationError('Parent post belongs to different topic');
      }
    }

    // Sanitize content
    const contentHtml = markdownToSafeHtml(data.content);

    const post = await postRepository.create({
      content: data.content,
      contentHtml,
      authorId: user.id,
      topicId: data.topicId,
      parentId: data.parentId,
      isQuoted: data.isQuoted,
      quotedPostId: data.quotedPostId,
    });

    // Extract hashtags from post content and add to topic
    const hashtagNames = extractHashtags(data.content);
    if (hashtagNames.length > 0) {
      const tags = await tagRepository.findOrCreateMany(hashtagNames);
      await tagRepository.addTagsToTopic(data.topicId, tags.map(t => t.id));
      logger.info({ postId: post.id, topicId: data.topicId, tags: hashtagNames }, 'Tags added to topic from post');
    }

    // Update topic's last post time
    await topicRepository.updateLastPostAt(data.topicId);

    logger.info({ postId: post.id, topicId: data.topicId, authorId: user.id }, 'Post created');

    return post;
  }

  /**
   * Update post
   */
  async update(id, data, user) {
    const post = await postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post');
    }

    // Check authorization
    const isOwner = post.authorId === user.id;
    const canEditAny = hasPermission(user.role, 'post:edit:any');

    if (!isOwner && !canEditAny) {
      throw new AuthorizationError('You can only edit your own posts');
    }

    // Check if topic is locked
    if (post.topic.isLocked && !canEditAny) {
      throw new AuthorizationError('This topic is locked');
    }

    // Validate content
    if (!data.content || data.content.trim().length < 10) {
      throw new ValidationError('Post content must be at least 10 characters');
    }

    const contentHtml = markdownToSafeHtml(data.content);

    const updated = await postRepository.update(id, {
      content: data.content,
      contentHtml,
      editReason: data.editReason,
    });

    // Extract hashtags from updated content and add to topic
    const hashtagNames = extractHashtags(data.content);
    if (hashtagNames.length > 0) {
      const tags = await tagRepository.findOrCreateMany(hashtagNames);
      await tagRepository.addTagsToTopic(post.topicId, tags.map(t => t.id));
      logger.info({ postId: id, topicId: post.topicId, tags: hashtagNames }, 'Tags added to topic from post update');
    }

    logger.info({ postId: id, updatedBy: user.id }, 'Post updated');

    return updated;
  }

  /**
   * Delete post
   */
  async delete(id, user, hard = false) {
    const post = await postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post');
    }

    const isOwner = post.authorId === user.id;
    const canDeleteAny = hasPermission(user.role, 'post:delete:any');

    if (!isOwner && !canDeleteAny) {
      throw new AuthorizationError('You can only delete your own posts');
    }

    // Soft delete by default, hard delete for admins
    if (hard && user.role === 'ADMIN') {
      await postRepository.delete(id);
    } else {
      await postRepository.softDelete(id);
    }

    logger.info({ postId: id, deletedBy: user.id, hard }, 'Post deleted');

    return { message: 'Post deleted successfully' };
  }

  /**
   * Hide post (moderation)
   */
  async hide(id, user) {
    const post = await postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post');
    }

    await postRepository.update(id, { status: 'HIDDEN' });

    logger.info({ postId: id, hiddenBy: user.id }, 'Post hidden');

    return { message: 'Post hidden' };
  }

  /**
   * Unhide post
   */
  async unhide(id, user) {
    const post = await postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post');
    }

    await postRepository.update(id, { status: 'VISIBLE' });

    logger.info({ postId: id, unhiddenBy: user.id }, 'Post unhidden');

    return { message: 'Post restored' };
  }

  /**
   * Add reaction to post (only 'like' allowed, one per user per post)
   */
  async addReaction(postId, userId, type) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post');
    }

    // Only allow 'like' reaction
    if (type !== 'like') {
      throw new ValidationError('Only like reaction is allowed');
    }

    // Check if user already reacted to this post
    const existingReaction = await postRepository.getUserReaction(postId, userId);
    if (existingReaction) {
      throw new ValidationError('You have already liked this post');
    }

    await postRepository.addReaction(postId, userId, type);

    logger.debug({ postId, userId, type }, 'Reaction added');

    return this.getReactionCounts(postId);
  }

  /**
   * Remove reaction from post (unlike)
   */
  async removeReaction(postId, userId) {
    await postRepository.removeReaction(postId, userId);

    logger.debug({ postId, userId }, 'Reaction removed');

    return this.getReactionCounts(postId);
  }

  /**
   * Toggle like on post
   */
  async toggleLike(postId, userId) {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post');
    }

    const existingReaction = await postRepository.getUserReaction(postId, userId);
    
    if (existingReaction) {
      // Unlike
      await postRepository.removeReaction(postId, userId);
      logger.debug({ postId, userId }, 'Post unliked');
    } else {
      // Like
      await postRepository.addReaction(postId, userId, 'like');
      logger.debug({ postId, userId }, 'Post liked');
    }

    const counts = await this.getReactionCounts(postId);
    return {
      ...counts,
      userLiked: !existingReaction,
    };
  }

  /**
   * Get reaction counts for post
   */
  async getReactionCounts(postId) {
    return postRepository.getReactionCounts(postId);
  }

  /**
   * Get post author ID
   */
  async getAuthorId(id) {
    return postRepository.getAuthorId(id);
  }
}

export default new PostService();
