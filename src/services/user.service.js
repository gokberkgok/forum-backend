// ====================================================
// USER SERVICE
// ====================================================
// Business logic for user operations.

import { userRepository } from '../repositories/index.js';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors.js';
import { sanitizeName } from '../utils/sanitize.js';
import { hasPermission, isHigherRole } from '../middlewares/rbac.middleware.js';
import logger from '../utils/logger.js';

class UserService {
  /**
   * Get user profile by username
   */
  async getProfile(username) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getById(id) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Get latest registered users
   */
  async getLatestUsers(limit = 10) {
    return userRepository.findLatest(limit);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, currentUser, data) {
    // Check authorization
    const isOwn = userId === currentUser.id;
    const canEditAny = hasPermission(currentUser.role, 'user:edit:any');

    if (!isOwn && !canEditAny) {
      throw new AuthorizationError('You can only edit your own profile');
    }

    // Sanitize display name if provided
    const updateData = {};
    
    if (data.displayName !== undefined) {
      updateData.displayName = sanitizeName(data.displayName);
    }
    
    if (data.bio !== undefined) {
      // Bio is stored as-is but displayed safely on frontend
      updateData.bio = data.bio?.slice(0, 2000) || null;
    }

    if (data.location !== undefined) {
      updateData.location = data.location?.slice(0, 100) || null;
    }

    if (data.website !== undefined) {
      // Validate website URL if provided
      if (data.website && !this.isValidUrl(data.website)) {
        throw new ConflictError('Invalid website URL');
      }
      updateData.website = data.website || null;
    }
    
    if (data.avatar !== undefined) {
      // Validate avatar URL
      if (data.avatar && !this.isValidAvatarUrl(data.avatar)) {
        throw new ConflictError('Invalid avatar URL');
      }
      updateData.avatar = data.avatar;
    }

    // Birth date
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }

    if (data.showBirthDate !== undefined) {
      updateData.showBirthDate = Boolean(data.showBirthDate);
    }

    // Social links
    if (data.discord !== undefined) {
      updateData.discord = data.discord?.slice(0, 100) || null;
    }

    if (data.github !== undefined) {
      updateData.github = data.github?.slice(0, 100) || null;
    }

    if (data.twitter !== undefined) {
      updateData.twitter = data.twitter?.slice(0, 100) || null;
    }

    const user = await userRepository.update(userId, updateData);

    logger.info({ userId, updatedBy: currentUser.id }, 'Profile updated');

    return user;
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Change user role (admin only)
   */
  async changeRole(userId, newRole, currentUser) {
    // Prevent self-demotion
    if (userId === currentUser.id) {
      throw new AuthorizationError('You cannot change your own role');
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Cannot change role of higher-ranked user
    if (!isHigherRole(currentUser.role, targetUser.role)) {
      throw new AuthorizationError('Cannot modify user with equal or higher role');
    }

    const user = await userRepository.update(userId, { role: newRole });

    logger.info(
      { userId, newRole, changedBy: currentUser.id },
      'User role changed'
    );

    return user;
  }

  /**
   * Suspend user
   */
  async suspendUser(userId, currentUser, reason) {
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Cannot suspend self
    if (userId === currentUser.id) {
      throw new AuthorizationError('You cannot suspend yourself');
    }

    // Cannot suspend higher-ranked user
    if (!isHigherRole(currentUser.role, targetUser.role)) {
      throw new AuthorizationError('Cannot suspend user with equal or higher role');
    }

    const user = await userRepository.update(userId, { status: 'SUSPENDED' });

    logger.info(
      { userId, suspendedBy: currentUser.id, reason },
      'User suspended'
    );

    return user;
  }

  /**
   * Ban user (admin only)
   */
  async banUser(userId, currentUser, reason) {
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    if (userId === currentUser.id) {
      throw new AuthorizationError('You cannot ban yourself');
    }

    if (targetUser.role === 'ADMIN') {
      throw new AuthorizationError('Cannot ban an admin');
    }

    const user = await userRepository.update(userId, { status: 'BANNED' });

    logger.info(
      { userId, bannedBy: currentUser.id, reason },
      'User banned'
    );

    return user;
  }

  /**
   * Unban/unsuspend user
   */
  async activateUser(userId, currentUser) {
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    const user = await userRepository.update(userId, { status: 'ACTIVE' });

    logger.info(
      { userId, activatedBy: currentUser.id },
      'User activated'
    );

    return user;
  }

  /**
   * Get users list (admin)
   */
  async getUsers(params) {
    return userRepository.findMany(params);
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId, currentUser) {
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    if (userId === currentUser.id) {
      throw new AuthorizationError('You cannot delete yourself');
    }

    if (targetUser.role === 'ADMIN') {
      throw new AuthorizationError('Cannot delete an admin');
    }

    await userRepository.delete(userId);

    logger.info(
      { userId, deletedBy: currentUser.id },
      'User deleted'
    );

    return { message: 'User deleted successfully' };
  }

  /**
   * Validate avatar URL
   */
  isValidAvatarUrl(url) {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS URLs
      if (parsed.protocol !== 'https:') return false;
      // Whitelist image hosting domains
      const allowedDomains = [
        'avatars.githubusercontent.com',
        'cdn.discordapp.com',
        'i.imgur.com',
        'res.cloudinary.com',
        // Add your CDN domain here
      ];
      return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }
}

export default new UserService();
