// ====================================================
// USER CONTROLLER
// ====================================================
// HTTP layer for user endpoints (Fastify).

import { userService } from '../services/index.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

class UserController {
  /**
   * Get user profile by username
   * GET /api/users/:username
   */
  getProfile = async (req, res) => {
    const { username } = req.params;

    const user = await userService.getProfile(username);

    return successResponse(res, user, 'User profile');
  };

  /**
   * Get user by ID (admin)
   * GET /api/users/id/:id
   */
  getById = async (req, res) => {
    const { id } = req.params;

    const user = await userService.getById(id);

    return successResponse(res, user, 'User details');
  };

  /**
   * Get latest registered users
   * GET /api/users/latest
   */
  getLatestUsers = async (req, res) => {
    const { limit } = req.query;

    const users = await userService.getLatestUsers(parseInt(limit, 10) || 10);

    return successResponse(res, users, 'Latest registered users');
  };

  /**
   * Update user profile
   * PATCH /api/users/:id
   */
  updateProfile = async (req, res) => {
    const { id } = req.params;
    const { displayName, bio, avatar } = req.body;

    const user = await userService.updateProfile(id, req.user, {
      displayName,
      bio,
      avatar,
    });

    return successResponse(res, user, 'Profile updated');
  };

  /**
   * Get users list (admin)
   * GET /api/users
   */
  getUsers = async (req, res) => {
    const { page, limit, role, status, search } = req.query;

    const result = await userService.getUsers({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      role,
      status,
      search,
    });

    return paginatedResponse(res, result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  };

  /**
   * Change user role (admin)
   * PATCH /api/users/:id/role
   */
  changeRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.changeRole(id, role, req.user);

    return successResponse(res, user, 'User role updated');
  };

  /**
   * Suspend user (moderator+)
   * POST /api/users/:id/suspend
   */
  suspendUser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await userService.suspendUser(id, req.user, reason);

    return successResponse(res, user, 'User suspended');
  };

  /**
   * Ban user (admin)
   * POST /api/users/:id/ban
   */
  banUser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await userService.banUser(id, req.user, reason);

    return successResponse(res, user, 'User banned');
  };

  /**
   * Activate user (moderator+)
   * POST /api/users/:id/activate
   */
  activateUser = async (req, res) => {
    const { id } = req.params;

    const user = await userService.activateUser(id, req.user);

    return successResponse(res, user, 'User activated');
  };

  /**
   * Delete user (admin)
   * DELETE /api/users/:id
   */
  deleteUser = async (req, res) => {
    const { id } = req.params;

    const result = await userService.deleteUser(id, req.user);

    return successResponse(res, null, result.message);
  };
}

export default new UserController();
