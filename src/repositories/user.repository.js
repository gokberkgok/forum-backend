// ====================================================
// USER REPOSITORY
// ====================================================
// Data access layer for user operations.

import prisma from '../config/database.js';

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id, includePassword = false) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        showBirthDate: true,
        discord: true,
        github: true,
        twitter: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        ...(includePassword && { passwordHash: true }),
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email, includePassword = false) {
    if (!email) return null;
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        showBirthDate: true,
        discord: true,
        github: true,
        twitter: true,
        role: true,
        status: true,
        emailVerified: true,
        failedLogins: true,
        lockedUntil: true,
        createdAt: true,
        ...(includePassword && { passwordHash: true }),
      },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        showBirthDate: true,
        discord: true,
        github: true,
        twitter: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            posts: true,
          },
        },
      },
    });
  }

  /**
   * Create new user
   */
  async create(data) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName || data.username,
        verifyToken: data.verifyToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update user by ID
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        showBirthDate: true,
        discord: true,
        github: true,
        twitter: true,
        role: true,
        status: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update last login info
   */
  async updateLoginInfo(id, ip) {
    return prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        failedLogins: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLogins(id) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        failedLogins: { increment: 1 },
      },
      select: { failedLogins: true },
    });

    // Lock account after 5 failed attempts
    if (user.failedLogins >= 5) {
      await prisma.user.update({
        where: { id },
        data: {
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });
    }

    return user;
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) return null;

    return prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Set password reset token
   */
  async setResetToken(email, token) {
    return prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
  }

  /**
   * Reset password
   */
  async resetPassword(token, passwordHash) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) return null;

    return prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        failedLogins: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Get users with pagination
   */
  async findMany({ page = 1, limit = 20, role, status, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              topics: true,
              posts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Delete user
   */
  async delete(id) {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Find latest registered users
   */
  async findLatest(limit = 10) {
    return prisma.user.findMany({
      where: {
        status: { not: 'BANNED' },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            posts: true,
          },
        },
      },
    });
  }
}

export default new UserRepository();
