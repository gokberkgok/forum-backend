// ====================================================
// AVATAR ROUTES
// ====================================================

const express = require('express');
const multer = require('multer');
const router = express.Router();
const avatarController = require('../controllers/avatarController');
const { authenticateToken } = require('../middlewares/auth');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_AVATAR_SIZE_MB || '5') * 1024 * 1024
    }
});

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/', upload.single('avatar'), avatarController.uploadAvatar);

/**
 * @route   DELETE /api/users/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete('/', avatarController.deleteAvatar);

module.exports = router;
