// ================================================
// ADVERTISEMENT CONTROLLER
// ================================================
import advertisementService from '../services/advertisement.service.js';
import { successResponse, createdResponse } from '../utils/response.js';

class AdvertisementController {
  /**
   * GET /api/ads - Tüm reklamları getir (admin)
   */
  async getAll(request, reply) {
    const { type, status } = request.query;
    const ads = await advertisementService.getAllAds({ type, status });
    return successResponse(reply, ads);
  }

  /**
   * GET /api/ads/banners - Aktif banner reklamları getir
   */
  async getBanners(request, reply) {
    const banners = await advertisementService.getActiveBannerAds();
    return successResponse(reply, banners);
  }

  /**
   * GET /api/ads/popup - Aktif popup reklamını getir
   */
  async getPopup(request, reply) {
    const popup = await advertisementService.getActivePopupAd();
    return successResponse(reply, popup);
  }

  /**
   * GET /api/ads/:id - ID ile reklam getir
   */
  async getById(request, reply) {
    const { id } = request.params;
    const ad = await advertisementService.getAdById(id);
    return successResponse(reply, ad);
  }

  /**
   * POST /api/ads - Yeni reklam oluştur (admin)
   */
  async create(request, reply) {
    const ad = await advertisementService.createAd(request.body);
    return createdResponse(reply, ad);
  }

  /**
   * PUT /api/ads/:id - Reklam güncelle (admin)
   */
  async update(request, reply) {
    const { id } = request.params;
    const ad = await advertisementService.updateAd(id, request.body);
    return successResponse(reply, ad);
  }

  /**
   * DELETE /api/ads/:id - Reklam sil (admin)
   */
  async delete(request, reply) {
    const { id } = request.params;
    await advertisementService.deleteAd(id);
    return successResponse(reply, { message: 'Reklam başarıyla silindi' });
  }

  /**
   * POST /api/ads/:id/impression - Görüntüleme kaydı
   */
  async trackImpression(request, reply) {
    const { id } = request.params;
    await advertisementService.trackImpression(id);
    return successResponse(reply, { message: 'Görüntüleme kaydedildi' });
  }

  /**
   * POST /api/ads/:id/click - Tıklama kaydı
   */
  async trackClick(request, reply) {
    const { id } = request.params;
    await advertisementService.trackClick(id);
    return successResponse(reply, { message: 'Tıklama kaydedildi' });
  }

  /**
   * GET /api/ads/debug/all - Debug: Tüm reklamları filtre olmadan getir
   */
  async debugGetAll(request, reply) {
    const ads = await advertisementService.debugGetAllAds();
    return successResponse(reply, ads);
  }
}

export default new AdvertisementController();
