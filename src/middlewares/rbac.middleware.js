// ====================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ====================================================
// Granular permission checking based on user roles (Fastify format).

import { AuthorizationError } from '../utils/errors.js';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

// Permission definitions
const PERMISSIONS = {
  // Topic permissions
  'topic:create': ['USER', 'MODERATOR', 'ADMIN'],
  'topic:edit:own': ['USER', 'MODERATOR', 'ADMIN'],
  'topic:edit:any': ['MODERATOR', 'ADMIN'],
  'topic:delete:own': ['USER', 'MODERATOR', 'ADMIN'],
  'topic:delete:any': ['MODERATOR', 'ADMIN'],
  'topic:pin': ['MODERATOR', 'ADMIN'],
  'topic:lock': ['MODERATOR', 'ADMIN'],
  'topic:move': ['MODERATOR', 'ADMIN'],

  // Post permissions
  'post:create': ['USER', 'MODERATOR', 'ADMIN'],
  'post:edit:own': ['USER', 'MODERATOR', 'ADMIN'],
  'post:edit:any': ['MODERATOR', 'ADMIN'],
  'post:delete:own': ['USER', 'MODERATOR', 'ADMIN'],
  'post:delete:any': ['MODERATOR', 'ADMIN'],
  'post:hide': ['MODERATOR', 'ADMIN'],

  // User management
  'user:view:profile': ['USER', 'MODERATOR', 'ADMIN'],
  'user:edit:own': ['USER', 'MODERATOR', 'ADMIN'],
  'user:edit:any': ['ADMIN'],
  'user:warn': ['MODERATOR', 'ADMIN'],
  'user:suspend': ['MODERATOR', 'ADMIN'],
  'user:ban': ['ADMIN'],
  'user:delete': ['ADMIN'],
  'user:change:role': ['ADMIN'],

  // Category management
  'category:create': ['ADMIN'],
  'category:edit': ['ADMIN'],
  'category:delete': ['ADMIN'],

  // Moderation
  'moderation:view:logs': ['MODERATOR', 'ADMIN'],
  'moderation:manage:reports': ['MODERATOR', 'ADMIN'],

  // Admin
  'admin:access': ['ADMIN'],
  'admin:settings': ['ADMIN'],
  'admin:analytics': ['ADMIN'],
};

/**
 * Check if user has required role (Fastify preHandler)
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const requireRole = (...allowedRoles) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userRole = request.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }
  };
};

/**
 * Check if user has minimum role level (Fastify preHandler)
 * @param {string} minimumRole - Minimum required role
 */
export const requireMinimumRole = (minimumRole) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required');
    }

    const userLevel = ROLE_HIERARCHY[request.user.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;

    if (userLevel < requiredLevel) {
      throw new AuthorizationError(`Minimum role required: ${minimumRole}`);
    }
  };
};

/**
 * Check if user has specific permission (Fastify preHandler)
 * @param {string} permission - Permission to check
 */
export const requirePermission = (permission) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required');
    }

    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles) {
      throw new AuthorizationError('Invalid permission');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AuthorizationError(`Permission denied: ${permission}`);
    }
  };
};

/**
 * Check ownership or higher role for resource modification (Fastify preHandler)
 * @param {Function} getOwnerId - Function to get owner ID from request
 */
export const requireOwnershipOrRole = (getOwnerId, minimumRole = 'MODERATOR') => {
  return async (request, reply) => {
    if (!request.user) {
      throw new AuthorizationError('Authentication required');
    }

    const ownerId = await getOwnerId(request);
    const isOwner = ownerId === request.user.id;
    const hasRole =
      ROLE_HIERARCHY[request.user.role] >= ROLE_HIERARCHY[minimumRole];

    if (!isOwner && !hasRole) {
      throw new AuthorizationError(
        'You can only modify your own content or need elevated permissions'
      );
    }

    request.isOwner = isOwner;
    request.hasElevatedRole = hasRole;
  };
};

/**
 * Helper to check permission in service layer
 */
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles?.includes(userRole) ?? false;
};

/**
 * Helper to check if role A is higher than role B
 */
export const isHigherRole = (roleA, roleB) => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

// Export role constants for use elsewhere
export const ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
};
