// ====================================================
// UPLOAD CONTROLLER
// ====================================================

import { uploadService } from '../services/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

class UploadController {
  /**
   * POST /api/uploads
   * Accepts multipart file and uploads to Imgur, returns URL
   */
  create = async (req, res) => {
    try {
      // fastify-multipart: request.file()
      const data = await req.file();
      if (!data) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const url = await uploadService.uploadToImgur(data.file);

      return successResponse(res, { url }, 'Upload successful');
    } catch (err) {
      return errorResponse(res, err.message || 'Upload failed', 500);
    }
  };
}

export default new UploadController();
