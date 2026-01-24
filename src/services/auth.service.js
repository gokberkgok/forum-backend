// ====================================================
// AUTHENTICATION SERVICE
// ====================================================
// Business logic for authentication operations.

import bcrypt from 'bcrypt';
import { userRepository, tokenRepository } from '../repositories/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getTokenExpiration,
  generateVerificationToken,
  generateResetToken,
} from '../utils/jwt.js';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';
import {
  isValidEmail,
  isValidUsername,
  isStrongPassword,
  getPasswordStrengthFeedback,
} from '../utils/validation.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class AuthService {
  /**
   * Register new user
   */
  async register({ email, username, password, displayName }) {
    // Validate inputs
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    if (!isValidUsername(username)) {
      throw new ValidationError(
        'Username must be 3-30 characters, start with a letter, and contain only letters, numbers, underscores, or hyphens'
      );
    }
    if (!isStrongPassword(password)) {
      const feedback = getPasswordStrengthFeedback(password);
      throw new ValidationError('Password does not meet requirements', feedback);
    }

    // Check for existing users
    const [emailExists, usernameExists] = await Promise.all([
      userRepository.emailExists(email),
      userRepository.usernameExists(username),
    ]);

    if (emailExists) {
      throw new ConflictError('Email is already registered');
    }
    if (usernameExists) {
      throw new ConflictError('Username is already taken');
    }

    // Hash password with bcrypt (cost factor 12+)
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Generate verification token
    const verifyToken = generateVerificationToken();

    // Create user
    const user = await userRepository.create({
      email,
      username,
      passwordHash,
      displayName: displayName || username,
      verifyToken,
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verifyToken);

    return {
      user,
      message: 'Registration successful. Please verify your email.',
    };
  }

  /**
   * Login user
   */
  async login({ email, password, userAgent, ipAddress }) {
    // Find user
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil - new Date()) / 1000 / 60
      );
      throw new AuthenticationError(
        `Account locked. Please try again in ${minutesLeft} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await userRepository.incrementFailedLogins(user.id);
      throw new AuthenticationError('Invalid email or password');
    }

    // Check user status
    if (user.status === 'BANNED') {
      throw new AuthenticationError('Your account has been banned');
    }
    if (user.status === 'SUSPENDED') {
      throw new AuthenticationError('Your account is currently suspended');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    // Store hashed refresh token in database
    await tokenRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id,
      userAgent,
      ipAddress,
      expiresAt: getTokenExpiration(config.jwt.refreshExpiration),
    });

    // Update login info
    await userRepository.updateLoginInfo(user.id, ipAddress);

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken({ refreshToken, userAgent, ipAddress }) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token not provided');
    }

    const tokenHash = hashToken(refreshToken);

    // Find token in database
    const storedToken = await tokenRepository.findByHash(tokenHash);

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      // Possible token reuse attack - revoke all tokens for this user
      logger.warn(
        { userId: storedToken.userId },
        'Refresh token reuse detected'
      );
      await tokenRepository.revokeAllForUser(storedToken.userId);
      throw new AuthenticationError('Token has been revoked');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired');
    }

    // Check user status
    const user = storedToken.user;
    if (!user || user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new AuthenticationError('Account is not active');
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    // Revoke old token and create new one
    await tokenRepository.revoke(tokenHash, newRefreshTokenHash);
    await tokenRepository.create({
      tokenHash: newRefreshTokenHash,
      userId: user.id,
      userAgent,
      ipAddress,
      expiresAt: getTokenExpiration(config.jwt.refreshExpiration),
    });

    logger.debug({ userId: user.id }, 'Token refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return; // Already logged out
    }

    const tokenHash = hashToken(refreshToken);
    await tokenRepository.revoke(tokenHash);

    logger.debug('User logged out');
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await tokenRepository.revokeAllForUser(userId);
    logger.info({ userId }, 'User logged out from all devices');
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await userRepository.verifyEmail(token);

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    logger.info({ userId: user.id }, 'Email verified');

    return user;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);

    // Don't reveal if email exists
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = generateResetToken();
    await userRepository.setResetToken(email, resetToken);

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(email, resetToken);

    logger.info({ userId: user.id }, 'Password reset requested');

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    if (!isStrongPassword(newPassword)) {
      const feedback = getPasswordStrengthFeedback(newPassword);
      throw new ValidationError('Password does not meet requirements', feedback);
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    const user = await userRepository.resetPassword(token, passwordHash);

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Revoke all refresh tokens for security
    await tokenRepository.revokeAllForUser(user.id);

    logger.info({ userId: user.id }, 'Password reset completed');

    return { message: 'Password reset successful. Please login with your new password.' };
  }

  /**
   * Change password (when logged in)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      const feedback = getPasswordStrengthFeedback(newPassword);
      throw new ValidationError('Password does not meet requirements', feedback);
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await userRepository.update(userId, { passwordHash });

    // Revoke all other sessions
    await tokenRepository.revokeAllForUser(userId);

    logger.info({ userId }, 'Password changed');

    return { message: 'Password changed successfully' };
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId) {
    return tokenRepository.getActiveSessions(userId);
  }
}

export default new AuthService();
