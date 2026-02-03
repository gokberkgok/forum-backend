// ====================================================
// IMGUR API SERVICE
// ====================================================
// Service for uploading images to Imgur for avatar storage

const FormData = require('form-data');
const fetch = require('node-fetch');

class ImgurService {
    constructor() {
        this.clientId = process.env.IMGUR_CLIENT_ID;
        this.apiUrl = 'https://api.imgur.com/3/image';
    }

    /**
     * Upload image to Imgur
     * @param {Buffer} imageBuffer - Image buffer
     * @returns {Promise<string>} - Image URL
     */
    async uploadImage(imageBuffer) {
        if (!this.clientId) {
            throw new Error('Imgur Client ID is not configured');
        }

        try {
            const formData = new FormData();
            formData.append('image', imageBuffer.toString('base64'));
            formData.append('type', 'base64');

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${this.clientId}`,
                    ...formData.getHeaders()
                },
                body: formData
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

    /**
     * Delete image from Imgur
     * @param {string} deleteHash - Image delete hash
     */
    async deleteImage(deleteHash) {
        if (!this.clientId || !deleteHash) {
            return;
        }

        try {
            await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Client-ID ${this.clientId}`
                }
            });
        } catch (error) {
            console.error('Imgur delete error:', error);
            // Don't throw - deletion failure shouldn't break the flow
        }
    }
}

module.exports = new ImgurService();
