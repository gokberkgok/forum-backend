// ================================================
// ADVERTISEMENT SERVICE
// ================================================
import advertisementRepository from '../repositories/advertisement.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class AdvertisementService {
  /**
   * Tüm reklamları getir (admin için)
   */
  async getAllAds(filters = {}) {
    return advertisementRepository.findAll(filters);
  }

  /**
   * Aktif banner reklamları getir
   */
  async getActiveBannerAds() {
    return advertisementRepository.findActive('BANNER');
  }

  /**
   * Aktif popup reklamını getir
   */
  async getActivePopupAd() {
    const popups = await advertisementRepository.findActive('POPUP');
    return popups[0] || null;
  }

  /**
   * ID ile reklam getir
   */
  async getAdById(id) {
    const ad = await advertisementRepository.findById(id);
    if (!ad) {
      throw new NotFoundError('Reklam bulunamadı');
    }
    return ad;
  }

  /**
   * Yeni reklam oluştur
   */
  async createAd(data) {
    // Validasyon
    if (!data.name) {
      throw new ValidationError('Reklam adı zorunludur');
    }
    if (!data.type) {
      throw new ValidationError('Reklam tipi zorunludur');
    }
    if (!data.imageUrl) {
      throw new ValidationError('Reklam görseli zorunludur');
    }

    return advertisementRepository.create({
      name: data.name,
      type: data.type,
      status: data.status || 'INACTIVE',
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl || null,
      altText: data.altText || data.name,
      title: data.title || null,
      description: data.description || null,
      position: data.position || 0,
      backgroundColor: data.backgroundColor || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null
    });
  }

  /**
   * Reklam güncelle
   */
  async updateAd(id, data) {
    // Reklamın var olduğunu kontrol et
    await this.getAdById(id);

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.altText !== undefined) updateData.altText = data.altText;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    return advertisementRepository.update(id, updateData);
  }

  /**
   * Reklam sil
   */
  async deleteAd(id) {
    await this.getAdById(id);
    return advertisementRepository.delete(id);
  }

  /**
   * Reklam görüntüleme kaydı
   */
  async trackImpression(id) {
    return advertisementRepository.incrementImpressions(id);
  }

  /**
   * Reklam tıklama kaydı
   */
  async trackClick(id) {
    return advertisementRepository.incrementClicks(id);
  }

  /**
   * Debug: Tüm reklamları filtre olmadan getir
   */
  async debugGetAllAds() {
    return advertisementRepository.findAllWithoutFilter();
  }
}

export default new AdvertisementService();
