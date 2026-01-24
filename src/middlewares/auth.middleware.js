// ====================================================
// AUTHENTICATION MIDDLEWARE
// ====================================================
// JWT-based authentication with cookie-only token storage.

import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import prisma from '../config/database.js';

/**
 * Authenticate user from access token in cookies
 * Attaches user object to request if valid
 */
export const authenticate = async (request, reply) => {
  // Get access token from httpOnly cookie
  const accessToken = request.cookies?.accessToken;

  if (!accessToken) {
    throw new AuthenticationError('Access token not provided');
  }

  // Verify the token
  const decoded = verifyAccessToken(accessToken);

  if (!decoded) {
    throw new AuthenticationError('Invalid or expired access token');
  }

  // Fetch user from database to ensure they still exist and are active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      emailVerified: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      birthDate: true,
      showBirthDate: true,
      discord: true,
      github: true,
      twitter: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          topics: true,
          posts: true,
        },
      },
    },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Check if user is active
  if (user.status === 'BANNED') {
    throw new AuthorizationError('Your account has been banned');
  }

  if (user.status === 'SUSPENDED') {
    throw new AuthorizationError('Your account is suspended');
  }

  // Get total likes on user's topics
  const totalLikes = await prisma.topicLike.count({
    where: {
      topic: {
        authorId: decoded.userId,
      },
    },
  });

  // Attach user with stats to request
  request.user = { ...user, totalLikes };
  request.userId = user.id;
};

/**
 * Optional authentication - doesn't throw if not authenticated
 * Useful for routes that behave differently for logged-in users
 */
export const optionalAuth = async (request, reply) => {
  try {
    const accessToken = request.cookies?.accessToken;

    if (!accessToken) {
      return;
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        emailVerified: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        showBirthDate: true,
        discord: true,
        github: true,
        twitter: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            topics: true,
            posts: true,
          },
        },
      },
    });

    if (user && user.status === 'ACTIVE') {
      // Get total likes on user's topics
      const totalLikes = await prisma.topicLike.count({
        where: {
          topic: {
            authorId: user.id,
          },
        },
      });

      request.user = { ...user, totalLikes };
      request.userId = user.id;
    }
  } catch {
    // Silently continue without authentication
  }
};

/**
 * Require email verification
 */
export const requireVerified = async (request, reply) => {
  if (!request.user?.emailVerified) {
    throw new AuthorizationError('Email verification required');
  }
};
