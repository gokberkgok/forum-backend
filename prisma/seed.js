import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      displayName: 'Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create custom menus
  const menus = [
    { name: 'Project Zomboid Türkiye', slug: 'pzturkiye', sortOrder: 0, isExpanded: true },
    { name: 'Project Zomboid', slug: 'pz', sortOrder: 1, isExpanded: true },
    { name: 'Project Zomboid Online', slug: 'pzonline', sortOrder: 2, isExpanded: true },
    { name: 'Project Zomboid Development', slug: 'pzdev', sortOrder: 3, isExpanded: true },
    { name: 'Ticaret Merkezi', slug: 'ticaret', sortOrder: 4, isExpanded: true },
    { name: 'Topluluk Bildirim', slug: 'bildirim', sortOrder: 5, isExpanded: true },
    { name: 'Hytaleturk.net', slug: 'hytaleturk', sortOrder: 6, isExpanded: true },
  ];

  const createdMenus = {};
  for (const menu of menus) {
    const created = await prisma.menu.upsert({
      where: { slug: menu.slug },
      update: {},
      create: menu,
    });
    createdMenus[menu.slug] = created;
  }

  // Create custom categories with menu assignments
  const categories = [

    // Project Zomboid Türkiye
{ name: 'Türkiye Sunucu Listesi', slug: 'turkiye-sunucu-listesi', menuId: createdMenus['pzturkiye'].id, sortOrder: 0, icon: '🇹🇷', color: '#ef4444', description: 'Türkiye merkezli Project Zomboid sunucularının tanıtım ve listelendiği alan.' },
{ name: 'Resmi Duyurular', slug: 'resmi-duyurular', menuId: createdMenus['pzturkiye'].id, sortOrder: 1, icon: '📢', color: '#f59e0b', description: 'Forum ve topluluk ile ilgili resmi açıklamalar ve önemli duyurular.' },
{ name: 'Forum Kuralları', slug: 'forum-kurallari', menuId: createdMenus['pzturkiye'].id, sortOrder: 2, icon: '📜', color: '#6b7280', description: 'Forum kullanım kuralları, yasaklar ve topluluk ilkeleri.' },
{ name: 'İletişim', slug: 'iletisim', menuId: createdMenus['pzturkiye'].id, sortOrder: 3, icon: '📩', color: '#3b82f6', description: 'Yönetim ile iletişime geçebileceğiniz destek ve geri bildirim alanı.' },

// Project Zomboid
{ name: 'Rehber', slug: 'rehber', menuId: createdMenus['pz'].id, sortOrder: 0, icon: '📘', color: '#10b981', description: 'Yeni başlayanlar ve deneyimli oyuncular için detaylı Project Zomboid rehberleri.' },
{ name: 'Güncellemeler', slug: 'guncellemeler', menuId: createdMenus['pz'].id, sortOrder: 1, icon: '🆕', color: '#f59e0b', description: 'Project Zomboid oyun güncellemeleri, yamalar ve sürüm notları.' },
{ name: 'Modlar', slug: 'modlar', menuId: createdMenus['pz'].id, sortOrder: 2, icon: '🧩', color: '#8b5cf6', description: 'Oyunu geliştiren ve çeşitlendiren mod paylaşımları ve önerileri.' },
{ name: 'Co-op', slug: 'co-op', menuId: createdMenus['pz'].id, sortOrder: 3, icon: '🤝', color: '#22c55e', description: 'Arkadaşlarla oynama, co-op rehberleri ve eşleşme paylaşımları.' },
{ name: 'Hikayeler', slug: 'hikayeler', menuId: createdMenus['pz'].id, sortOrder: 4, icon: '📖', color: '#ec4899', description: 'Oyuncuların Project Zomboid evreninde yaşadığı hikayeler ve deneyimler.' },
{ name: 'Teknik Destek & Sorular', slug: 'teknik-destek-sorular', menuId: createdMenus['pz'].id, sortOrder: 5, icon: '🛠️', color: '#10b981', description: 'Oyunla ilgili teknik sorunlar, hatalar ve soru-cevap paylaşımları.' },
{ name: 'Genel Sohbet', slug: 'genel-sohbet', menuId: createdMenus['pz'].id, sortOrder: 6, icon: '💬', color: '#3b82f6', description: 'Project Zomboid oyuncuları için serbest sohbet alanı.' },

// Project Zomboid Online
{ name: 'Sunucu Tanıtım', slug: 'sunucu-tanitim', menuId: createdMenus['pzonline'].id, sortOrder: 0, icon: '🖥️', color: '#6366f1' },
{ name: 'Ekip Tanıtım', slug: 'ekip-tanitim', menuId: createdMenus['pzonline'].id, sortOrder: 1, icon: '👥', color: '#22c55e' },
{ name: 'Yetkili Alım & Başvuru İlanları', slug: 'yetkili-alim-basvuru', menuId: createdMenus['pzonline'].id, sortOrder: 2, icon: '📄', color: '#f97316' },
{ name: 'Topluluk Tanıtım', slug: 'topluluk-tanitim', menuId: createdMenus['pzonline'].id, sortOrder: 3, icon: '🌐', color: '#0ea5e9' },
{ name: 'Görseller & Videolar', slug: 'gorseller-videolar', menuId: createdMenus['pzonline'].id, sortOrder: 4, icon: '🎥', color: '#ec4899' },

// Project Zomboid Development
{ name: 'Sunucu Dosyaları', slug: 'sunucu-dosyalari', menuId: createdMenus['pzdev'].id, sortOrder: 0, icon: '📂', color: '#64748b', description: 'Project Zomboid sunucuları için gerekli dosya ve yapılandırmalar.' },
{ name: 'Sunucu için modlar', slug: 'sunucu-icin-modlar', menuId: createdMenus['pzdev'].id, sortOrder: 1, icon: '⚙️', color: '#8b5cf6', description: 'Sunucuya özel kullanılan modlar ve teknik paylaşımlar.' },
{ name: 'Teknik Destek', slug: 'teknik-destek', menuId: createdMenus['pzdev'].id, sortOrder: 2, icon: '🛠️', color: '#10b981', description: 'Geliştiriciler ve sunucu sahipleri için teknik destek alanı.' },
{ name: 'Development İstek', slug: 'development-istek', menuId: createdMenus['pzdev'].id, sortOrder: 3, icon: '💡', color: '#f59e0b', description: 'Geliştirme talepleri, öneriler ve fikir paylaşımları.' },
{ name: 'Developer Tanıtım', slug: 'developer-tanitim', menuId: createdMenus['pzdev'].id, sortOrder: 4, icon: '👨‍💻', color: '#3b82f6', description: 'Mod geliştiricileri ve yazılımcıların kendini tanıttığı bölüm.' },
{ name: 'Web Panel', slug: 'web-panel', menuId: createdMenus['pzdev'].id, sortOrder: 5, icon: '🧭', color: '#6366f1', description: 'Sunucu yönetimi için web panel ve araç paylaşımları.' },

// Ticaret Merkezi
{ name: 'Hosting Firmaları Hakkında', slug: 'hosting-firmalari', menuId: createdMenus['ticaret'].id, sortOrder: 0, icon: '🏢', color: '#64748b', description: 'Hosting firmaları hakkında bilgi, yorum ve karşılaştırmalar.' },
{ name: 'Ücretli Modlar & Discord Bot', slug: 'ucretli-modlar-discord-bot', menuId: createdMenus['ticaret'].id, sortOrder: 1, icon: '💰', color: '#f59e0b', description: 'Ücretli modlar, özel yazılımlar ve Discord bot hizmetleri.' },
{ name: 'Game Hosting', slug: 'game-hosting', menuId: createdMenus['ticaret'].id, sortOrder: 2, icon: '🎮', color: '#22c55e', description: 'Oyun sunucusu kiralama ve hosting hizmetleri.' },
{ name: 'Ücretli Tasarım İşleri', slug: 'ucretli-tasarim', menuId: createdMenus['ticaret'].id, sortOrder: 3, icon: '🎨', color: '#ec4899', description: 'Logo, grafik, UI ve özel tasarım hizmetleri.' },

// Topluluk Bildirim
{ name: 'Şikayetçiyim', slug: 'sikayetciyim', menuId: createdMenus['bildirim'].id, sortOrder: 0, icon: '⚠️', color: '#ef4444', description: 'Topluluk ve sunucular hakkında şikayetlerin bildirildiği alan.' },
{ name: 'Teşekkürüm var', slug: 'tesekkurum-var', menuId: createdMenus['bildirim'].id, sortOrder: 1, icon: '🙏', color: '#22c55e', description: 'Sunuculara, yöneticilere veya üyelere teşekkür paylaşımları.' },
{ name: 'Forum Dışı Şikayetler', slug: 'forum-disi-sikayetler', menuId: createdMenus['bildirim'].id, sortOrder: 2, icon: '🚫', color: '#dc2626', description: 'Forum dışındaki olaylar için yapılan şikayet bildirimleri.' },

// Hytaleturk.net
{ name: 'Hytaleturk.net', slug: 'hytaleturk', menuId: createdMenus['hytaleturk'].id, sortOrder: 0, icon: '🌍', color: '#0ea5e9', description: 'Hytaleturk.net topluluğuna özel duyuru ve paylaşımlar.' },

];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { menuId: category.menuId }, // Update menuId for existing categories
      create: category,
    });
  }

  // Also update any 'pz' slug category (old slug)
  await prisma.category.updateMany({
    where: { slug: 'pz' },
    data: { menuId: createdMenus['pz'].id },
  });

  console.log('Database seeded successfully');
  console.log('Admin user created:', admin.email);
  console.log('Menus created:', Object.keys(createdMenus).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });