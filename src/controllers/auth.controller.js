// ====================================================
// AUTHENTICATION CONTROLLER
// ====================================================
// HTTP layer for authentication endpoints.

import { authService, userService } from '../services/index.js';
import { successResponse, createdResponse } from '../utils/response.js';
import config from '../config/index.js';

class AuthController {
  /**
   * Set auth cookies on response (Fastify)
   */
  setAuthCookies(res, accessToken, refreshToken) {
    // Access token cookie
    res.setCookie('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      secure: true,  //config.cookie.secure,
      sameSite: 'lax', //config.cookie.sameSite,
      domain: config.cookie.domain,
      maxAge: 15 * 60 // 15 minutes (seconds in Fastify)
    });

    // Refresh token cookie
    res.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: true, //config.cookie.secure,
      sameSite: 'lax', //config.cookie.sameSite,
      domain: config.cookie.domain,
      maxAge: 7 * 24 * 60 * 60, // 7 days (seconds in Fastify)
     
    });
  }

  /**
   * Clear auth cookies (Fastify)
   */
  clearAuthCookies(res) {
    const cookieOptions = {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      //domain: config.cookie.domain,
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  register = async (req, res) => {
    const { email, username, password, displayName } = req.body;

    const result = await authService.register({
      email,
      username,
      password,
      displayName,
    });

    return createdResponse(res, result.user, result.message);
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login({
      email,
      password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Set cookies (httpOnly, secure, sameSite strict)
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return successResponse(res, result.user, 'Login successful');
  };

  /**
   * Refresh tokens
   * POST /api/auth/refresh
   */
  refresh = async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      const result = await authService.refreshToken({
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      // Set new cookies
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      return successResponse(res, null, 'Tokens refreshed');
    } catch (error) {
      // Clear cookies on refresh failure
      this.clearAuthCookies(res);
      throw error;
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      await authService.logout(refreshToken);

      // Clear cookies
      this.clearAuthCookies(res);

      return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      // Still clear cookies even on error
      this.clearAuthCookies(res);
      throw error;
    }
  };

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  logoutAll = async (req, res) => {
    await authService.logoutAll(req.userId);

    // Clear cookies
    this.clearAuthCookies(res);

    return successResponse(res, null, 'Logged out from all devices');
  };

  /**
   * Get current user
   * GET /api/auth/me
   */
  me = async (req, res) => {
    return successResponse(res, req.user, 'Current user');
  };

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  verifyEmail = async (req, res) => {
    const { token } = req.body;

    const user = await authService.verifyEmail(token);

    return successResponse(res, user, 'Email verified successfully');
  };

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword = async (req, res) => {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    return successResponse(res, null, result.message);
  };

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  resetPassword = async (req, res) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    return successResponse(res, null, result.message);
  };

  /**
   * Change password (when logged in)
   * POST /api/auth/change-password
   */
  changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.userId,
      currentPassword,
      newPassword
    );

    // Clear tokens and require re-login
    this.clearAuthCookies(res);

    return successResponse(res, null, result.message);
  };

  /**
   * Get active sessions
   * GET /api/auth/sessions
   */
  getSessions = async (req, res) => {
    const sessions = await authService.getActiveSessions(req.userId);

    return successResponse(res, sessions, 'Active sessions');
  };

  /**
   * Update current user profile
   * PATCH /api/auth/profile
   */
  updateProfile = async (req, res) => {
    const {
      displayName,
      bio,
      location,
      website,
      avatar,
      birthDate,
      showBirthDate,
      discord,
      github,
      twitter
    } = req.body;

    const user = await userService.updateProfile(req.userId, req.user, {
      displayName,
      bio,
      location,
      website,
      avatar,
      birthDate,
      showBirthDate,
      discord,
      github,
      twitter,
    });

    return successResponse(res, user, 'Profile updated successfully');
  };
}

export default new AuthController();
