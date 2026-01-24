// ================================================
// ADVERTISEMENT REPOSITORY
// ================================================
import prisma from '../config/database.js';

class AdvertisementRepository {
  /**
   * Tüm reklamları getir
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    return prisma.advertisement.findMany({
      where,
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Aktif reklamları getir (tip ve pozisyona göre)
   * NOT: startDate/endDate null ise süresiz aktif kabul edilir
   */
  async findActive(type, position = null) {
    const where = {
      type,
      status: 'ACTIVE',
    };
    
    if (position) {
      where.position = position;
    }
    
    // Tüm aktif reklamları getir (tarih kontrolü opsiyonel)
    return prisma.advertisement.findMany({
      where,
      orderBy: { position: 'asc' }
    });
  }

  /**
   * ID ile reklam getir
   */
  async findById(id) {
    return prisma.advertisement.findUnique({
      where: { id }
    });
  }

  /**
   * Yeni reklam oluştur
   */
  async create(data) {
    return prisma.advertisement.create({
      data
    });
  }

  /**
   * Reklam güncelle
   */
  async update(id, data) {
    return prisma.advertisement.update({
      where: { id },
      data
    });
  }

  /**
   * Reklam sil
   */
  async delete(id) {
    return prisma.advertisement.delete({
      where: { id }
    });
  }

  /**
   * İmpression sayısını artır
   */
  async incrementImpressions(id) {
    return prisma.advertisement.update({
      where: { id },
      data: {
        impressions: { increment: 1 }
      }
    });
  }

  /**
   * Click sayısını artır
   */
  async incrementClicks(id) {
    return prisma.advertisement.update({
      where: { id },
      data: {
        clicks: { increment: 1 }
      }
    });
  }

  /**
   * Debug: Tüm reklamları filtre olmadan getir
   */
  async findAllWithoutFilter() {
    return prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default new AdvertisementRepository();
