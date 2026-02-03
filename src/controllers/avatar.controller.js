// ====================================================
// AVATAR CONTROLLER (Fastify)
// ====================================================
// Handles avatar upload, validation, and deletion

import prisma from '../config/database.js';
import fetch from 'node-fetch';

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
 * Upload image to Imgur
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string>} - Image URL
 */
async function uploadToImgur(imageBuffer) {
    const clientId = process.env.IMGUR_CLIENT_ID;

    if (!clientId) {
        throw new Error('Imgur Client ID is not configured');
    }

    try {
        const base64Image = imageBuffer.toString('base64');

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${clientId}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Image,
                type: 'base64'
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.data?.error || 'Failed to upload image to Imgur');
        }

        return data.data.link;
    } catch (error) {
        console.error('Imgur upload error:', error);
        throw new Error('Failed to upload image: ' + error.message);
    }
}

export const avatarController = {
    /**
     * Upload avatar
     */
    uploadAvatar: async (request, reply) => {
        try {
            const userId = request.user.id;

            // Get uploaded file from multipart
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({
                    success: false,
                    error: { message: 'No file uploaded' }
                });
            }

            // Convert stream to buffer
            const buffer = await data.toBuffer();

            // Validate file size
            if (buffer.length > MAX_FILE_SIZE) {
                return reply.code(400).send({
                    success: false,
                    error: {
                        message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
                    }
                });
            }

            // Validate file type
            if (!ALLOWED_TYPES.includes(data.mimetype)) {
                return reply.code(400).send({
                    success: false,
                    error: {
                        message: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
                    }
                });
            }

            // Check if it's an animated GIF
            const isGif = data.mimetype === 'image/gif';
            const isAnimated = isGif && isAnimatedGif(buffer);

            // If animated GIF, check if user is VIP
            if (isAnimated) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true }
                });

                if (user.role !== 'VIP' && user.role !== 'ADMIN') {
                    return reply.code(403).send({
                        success: false,
                        error: {
                            message: 'Animated GIF avatars are only available for VIP members',
                            code: 'VIP_REQUIRED'
                        }
                    });
                }
            }

            // Upload to Imgur
            const imageUrl = await uploadToImgur(buffer);

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

            return reply.send({
                success: true,
                data: {
                    user: updatedUser,
                    message: 'Avatar updated successfully'
                }
            });
        } catch (error) {
            console.error('Avatar upload error:', error);
            return reply.code(500).send({
                success: false,
                error: {
                    message: error.message || 'Failed to upload avatar'
                }
            });
        }
    },

    /**
     * Delete avatar
     */
    deleteAvatar: async (request, reply) => {
        try {
            const userId = request.user.id;

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

            return reply.send({
                success: true,
                data: {
                    user: updatedUser,
                    message: 'Avatar removed successfully'
                }
            });
        } catch (error) {
            console.error('Avatar delete error:', error);
            return reply.code(500).send({
                success: false,
                error: {
                    message: 'Failed to remove avatar'
                }
            });
        }
    }
};
