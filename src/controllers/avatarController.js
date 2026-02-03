// ====================================================
// AVATAR CONTROLLER
// ====================================================
// Handles avatar upload, validation, and deletion

const prisma = require('../config/database');
const imgurService = require('../services/imgurService');

// Maximum file size (5MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_AVATAR_SIZE_MB || '5') * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = (process.env.ALLOWED_AVATAR_TYPES || 'image/jpeg,image/png,image/gif').split(',');

/**
 * Check if image is an animated GIF
 * @param {Buffer} buffer - Image buffer
 * @returns {boolean}
 */
function isAnimatedGif(buffer) {
    try {
        // Check for GIF header
        const header = buffer.slice(0, 6).toString('ascii');
        if (header !== 'GIF89a' && header !== 'GIF87a') {
            return false;
        }

        // For GIF89a, check for multiple frames
        if (header === 'GIF89a') {
            // Simple heuristic: count image descriptor blocks (0x2C)
            let count = 0;
            for (let i = 0; i < buffer.length - 1; i++) {
                if (buffer[i] === 0x2C) {
                    count++;
                    if (count > 1) return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking GIF animation:', error);
        return false;
    }
}

/**
 * Upload avatar
 */
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }

        const file = req.file;

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
                }
            });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
                }
            });
        }

        // Check if it's an animated GIF
        const isGif = file.mimetype === 'image/gif';
        const isAnimated = isGif && isAnimatedGif(file.buffer);

        // If animated GIF, check if user is VIP
        if (isAnimated) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            if (user.role !== 'VIP' && user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Animated GIF avatars are only available for VIP members',
                        code: 'VIP_REQUIRED'
                    }
                });
            }
        }

        // Upload to Imgur
        const imageUrl = await imgurService.uploadImage(file.buffer);

        // Update user avatar in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: imageUrl },
            select: {
                id: true,
                username: true,
                avatar: true,
                role: true
            }
        });

        res.json({
            success: true,
            data: {
                user: updatedUser,
                message: 'Avatar updated successfully'
            }
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to upload avatar'
            }
        });
    }
};

/**
 * Delete avatar
 */
exports.deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        // Remove avatar from database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: null },
            select: {
                id: true,
                username: true,
                avatar: true
            }
        });

        res.json({
            success: true,
            data: {
                user: updatedUser,
                message: 'Avatar removed successfully'
            }
        });
    } catch (error) {
        console.error('Avatar delete error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to remove avatar'
            }
        });
    }
};
