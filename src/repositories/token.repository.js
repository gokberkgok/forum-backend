// ====================================================
// TOKEN REPOSITORY
// ====================================================
// Data access layer for refresh token operations.

import prisma from '../config/database.js';

class TokenRepository {
  /**
   * Create refresh token
   */
  async create(data) {
    return prisma.refreshToken.create({
      data: {
        tokenHash: data.tokenHash,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find refresh token by hash
   */
  async findByHash(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Revoke refresh token
   */
  async revoke(tokenHash, replacedBy = null) {
    return prisma.refreshToken.update({
      where: { tokenHash },
      data: {
        revokedAt: new Date(),
        replacedBy,
      },
    });
  }

  /**
   * Revoke all tokens for user
   */
  async revokeAllForUser(userId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Delete expired tokens
   */
  async deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if token is valid (not revoked and not expired)
   */
  async isValid(tokenHash) {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!token) return false;
    if (token.revokedAt) return false;
    if (token.expiresAt < new Date()) return false;

    return true;
  }
}

export default new TokenRepository();
