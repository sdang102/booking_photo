import { Service, Photographer, AddonOption, PortfolioAlbum, ShootingLocation, ExperienceReview } from '@/types';

export const MOCK_SERVICES: Service[] = [
  {
    id: 's-wedding',
    title: 'Chụp Ảnh Cưới & Pre-Wedding Nghệ Thuật',
    slug: 'wedding-pre-wedding',
    category: 'wedding',
    description: 'Trọn gói chụp ảnh cưới cao cấp với phong cách Cinematic lãng mạn. Bao gồm 2 địa điểm ngoại cảnh, trang điểm cô dâu và album cao cấp bìa da.',
    price: 8900000,
    duration_minutes: 360,
    features: [
      '3 Váy cưới thiết kế & 2 bộ Vest nam cao cấp',
      '2 Layout Makeup & Hair chuyên nghiệp theo concept',
      'Tặng photobook 30 trang bìa da cao cấp chuẩn Hàn Quốc',
      'Tặng 01 ảnh cổng pha lê ép gỗ 60x90cm',
      'Giao toàn bộ file gốc (300+ ảnh) + 45 ảnh chỉnh màu Fine-Art',
    ],
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    is_popular: true,
  },
  {
    id: 's-portrait',
    title: 'Profile Doanh Nhân & Chân Dung Nghệ Thuật',
    slug: 'business-portrait',
    category: 'portrait',
    description: 'Định hình thương hiệu cá nhân uy tín, đẳng cấp trên LinkedIn, Báo chí, Profile công ty với ánh sáng Studio chuẩn quốc tế.',
    price: 1800000,
    duration_minutes: 90,
    features: [
      '2 Tone màu Studio hiện đại (Dark moody / Bright clean)',
      'Hỗ trợ 1 layout makeup & làm tóc chỉnh chu',
      'Được hướng dẫn tạo dáng chuyên sâu theo ngành nghề',
      'Trả 10 ảnh photoshop tỉ mỉ từng chi tiết + toàn bộ file gốc',
    ],
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    is_popular: false,
  },
  {
    id: 's-concept',
    title: 'Concept Nàng Thơ & Vintage Cinematic',
    slug: 'vintage-concept',
    category: 'concept',
    description: 'Bắt trọn vẻ đẹp thần thái và cảm xúc độc bản với concept hoa, ánh sáng nghệ thuật và gam màu phim Hong Kong / Hàn Quốc.',
    price: 2500000,
    duration_minutes: 150,
    features: [
      'Setup bối cảnh độc quyền tại Studio phong cách Châu Âu',
      'Stylist hỗ trợ trang phục và phụ kiện chụp',
      '15 ảnh chỉnh màu Cinematic độc quyền theo tone yêu cầu',
      'Tặng 01 video highlight / reels hậu trường chuẩn 4K',
    ],
    image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
    is_popular: true,
  },
  {
    id: 's-family',
    title: 'Kỷ Niệm Gia Đình & Mẹ Bầu / Bé Yêu',
    slug: 'family-memories',
    category: 'family',
    description: 'Khoảnh khắc sum vầy ấm cúng, tự nhiên không gượng ép của các thành viên gia đình trong không gian studio ấm cúng.',
    price: 3200000,
    duration_minutes: 120,
    features: [
      'Áp dụng cho gia đình tối đa 6 thành viên',
      'Không giới hạn số shoot chụp trong 2 giờ',
      'Tặng khung ảnh gỗ cao cấp để bàn kích thước 40x60cm',
      'Chỉnh sửa màu 25 ảnh gia đình + toàn bộ ảnh gốc chất lượng cao',
    ],
    image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    is_popular: false,
  },
  {
    id: 's-event',
    title: 'Sự Kiện, Sinh Nhật & Kỷ Yếu Tốt Nghiệp',
    slug: 'event-celebration',
    category: 'event',
    description: 'Ghi lại mọi diễn biến quan trọng, khoảnh khắc xúc động và niềm vui trong các sự kiện kỷ niệm đáng nhớ.',
    price: 3500000,
    duration_minutes: 180,
    features: [
      '01 Nhiếp ảnh gia chụp xuyên suốt sự kiện',
      'Trả ảnh nhanh ngay trong 24 giờ sau khi kết thúc',
      'Chỉnh sửa ánh sáng, màu sắc cho hơn 100 khoảnh khắc đẹp nhất',
      'Hỗ trợ lưu trữ link online chất lượng cao trong 1 năm',
    ],
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    is_popular: false,
  },
];

export const MOCK_PHOTOGRAPHERS: Photographer[] = [
  {
    id: 'p-alex',
    full_name: 'Alex Hoàng',
    bio: 'Lead Photographer với 8 năm kinh nghiệm, từng cộng tác cùng nhiều tạp chí thời trang và đạt giải thưởng ảnh cưới nghệ thuật.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    specialties: ['Wedding Fine-Art', 'Pre-Wedding', 'Cinematic Tone'],
    rating: 4.9,
    review_count: 142,
    experience_years: 8,
  },
  {
    id: 'p-mailinh',
    full_name: 'Mai Linh',
    bio: 'Chuyên gia bắt trọn vẻ đẹp cảm xúc chân thực, phong cách nàng thơ nhẹ nhàng, tinh tế và gợi mở sự tự tin cho phái nữ.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    specialties: ['Nàng Thơ', 'Profile Doanh Nhân', 'Lookbook'],
    rating: 5.0,
    review_count: 98,
    experience_years: 5,
  },
  {
    id: 'p-quangduy',
    full_name: 'Trần Quang Duy',
    bio: 'Nhiệt huyết, sáng tạo ánh sáng Studio độc đáo và luôn biết cách tạo không khí tự nhiên, thoải mái cho các gia đình và cặp đôi.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    specialties: ['Gia Đình', 'Studio High-End', 'Sự Kiện'],
    rating: 4.8,
    review_count: 85,
    experience_years: 6,
  },
];

export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'addon-makeup-vip',
    title: 'Gói Makeup & Làm tóc VIP (Artist riêng)',
    price: 600000,
    description: 'Chuyên viên trang điểm đi kèm dặm phấn đổi kiểu tóc suốt buổi chụp.',
  },
  {
    id: 'addon-costume',
    title: 'Thuê thêm trang phục thiết kế cao cấp',
    price: 450000,
    description: 'Thêm 01 bộ váy dạ hội/cưới hoặc trang phục concept.',
  },
  {
    id: 'addon-express',
    title: 'Chỉnh sửa ảnh hỏa tốc (trong 24h)',
    price: 500000,
    description: 'Nhận ảnh hoàn thiện ngay sau 24h thay vì 5-7 ngày làm việc.',
  },
  {
    id: 'addon-album',
    title: 'Nâng cấp Album Photobook Mika pha lê',
    price: 800000,
    description: 'In ấn công nghệ Đức chống bay màu, bìa mika bóng sáng sang trọng.',
  },
];

export const PORTFOLIO_ALBUMS: PortfolioAlbum[] = [
  {
    id: 'album-01', slug: 'loi-hen-ben-bien', title: 'Lời Hẹn Bên Biển', category: 'pre-wedding', location: 'Vũng Tàu',
    cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82',
    images: [
      { id: '01-1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=84', alt: 'Cặp đôi trong bộ ảnh cưới bên biển', width: 1400, height: 933 },
      { id: '01-2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=84', alt: 'Khoảnh khắc lễ cưới tự nhiên', width: 1200, height: 800 },
      { id: '01-3', url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=84', alt: 'Chân dung cô dâu chú rể', width: 1000, height: 1250 },
    ],
  },
  {
    id: 'album-02', slug: 'nang-tho-mua-ha', title: 'Nàng Thơ Mùa Hạ', category: 'concept', location: 'Studio S. Đặng',
    cover_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=82',
    images: [
      { id: '02-1', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=84', alt: 'Chân dung nàng thơ', width: 1000, height: 1250 },
      { id: '02-2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=84', alt: 'Chân dung nghệ thuật ngoài trời', width: 1000, height: 1250 },
    ],
  },
  {
    id: 'album-03', slug: 'ban-linh-doanh-nhan', title: 'Bản Lĩnh Doanh Nhân', category: 'portrait', location: 'TP.HCM',
    cover_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=82',
    images: [
      { id: '03-1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=84', alt: 'Chân dung doanh nhân nam', width: 1000, height: 1250 },
      { id: '03-2', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=84', alt: 'Ảnh profile doanh nhân', width: 1000, height: 1250 },
    ],
  },
  {
    id: 'album-04', slug: 'nha-la-noi-de-ve', title: 'Nhà Là Nơi Để Về', category: 'family', location: 'Thảo Điền',
    cover_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=82',
    images: [
      { id: '04-1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=84', alt: 'Gia đình bên nhau', width: 1200, height: 800 },
      { id: '04-2', url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1200&q=84', alt: 'Khoảnh khắc gia đình tự nhiên', width: 1200, height: 800 },
    ],
  },
  {
    id: 'album-05', slug: 'ngay-chung-doi', title: 'Ngày Chung Đôi', category: 'couple', location: 'Sài Gòn',
    cover_url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=82',
    images: [{ id: '05-1', url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=84', alt: 'Cặp đôi giữa thành phố', width: 1200, height: 800 }],
  },
  {
    id: 'album-06', slug: 'dem-dang-nho', title: 'Đêm Đáng Nhớ', category: 'event', location: 'Quận 1, TP.HCM',
    cover_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=82',
    images: [{ id: '06-1', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=84', alt: 'Không gian sự kiện', width: 1200, height: 800 }],
  },
];

export const SHOOTING_LOCATIONS: ShootingLocation[] = [
  { id: 'loc-studio', name: 'Studio', area: 'TP.HCM', description: 'Không gian riêng, ánh sáng chủ động và đầy đủ phông nền.', travel_fee: 0, image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80' },
  { id: 'loc-hcm', name: 'Ngoại Cảnh Sài Gòn', area: 'TP.HCM', description: 'Phố cổ, kiến trúc hiện đại hoặc không gian xanh theo concept.', travel_fee: 0, image_url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80' },
  { id: 'loc-vungtau', name: 'Vũng Tàu', area: 'Biển & ngoại cảnh', description: 'Ánh hoàng hôn, bờ biển và những cung đường điện ảnh.', travel_fee: 500000, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80' },
  { id: 'loc-nearby', name: 'Các Tỉnh Lân Cận', area: 'Theo yêu cầu', description: 'Linh hoạt di chuyển để thực hiện concept riêng của bạn.', travel_fee: 800000, image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
];

export const MOCK_REVIEWS: ExperienceReview[] = [
  { id: 'rv-001', booking_id: 'bk-completed-anh-thao', customer_name: 'Minh Anh', rating: 5, comment: 'Buổi chụp rất thoải mái. Mình không biết tạo dáng nhưng được hướng dẫn rất kỹ, ảnh nhận về đúng style mình mong muốn.', service_title: 'Couple / Pre-Wedding', portfolio_slug: 'loi-hen-ben-bien', is_public: true, is_featured: true, created_at: '2026-09-12T09:00:00.000Z', updated_at: '2026-09-12T09:00:00.000Z' },
  { id: 'rv-002', booking_id: 'bk_seed_003', customer_name: 'Phạm Quỳnh Anh', rating: 5, comment: 'Màu ảnh rất có chiều sâu và cách hướng dẫn biểu cảm cực kỳ dễ hiểu. Mình cảm thấy tự tin hơn rất nhiều trong suốt buổi chụp.', service_title: 'Concept Nghệ Thuật', portfolio_slug: 'nang-tho-mua-ha', is_public: true, is_featured: true, created_at: '2026-09-08T10:30:00.000Z', updated_at: '2026-09-08T10:30:00.000Z' },
  { id: 'rv-003', booking_id: 'bk-completed-business', customer_name: 'Trần Minh Hoàng', rating: 5, comment: 'Tác phong chuyên nghiệp, chuẩn bị kỹ và nắm bắt đúng hình ảnh thương hiệu cá nhân mà tôi cần.', service_title: 'Chân Dung Doanh Nhân', portfolio_slug: 'ban-linh-doanh-nhan', is_public: true, is_featured: true, created_at: '2026-08-29T08:00:00.000Z', updated_at: '2026-08-29T08:00:00.000Z' },
  { id: 'rv-004', booking_id: 'bk-completed-family', customer_name: 'Gia đình chị Hương', rating: 5, comment: 'Hai bé nhà mình khá hiếu động nhưng buổi chụp vẫn diễn ra tự nhiên và vui vẻ. Cả nhà rất thích bộ ảnh.', service_title: 'Gia Đình & Bé', portfolio_slug: 'nha-la-noi-de-ve', is_public: true, is_featured: false, created_at: '2026-08-20T14:00:00.000Z', updated_at: '2026-08-20T14:00:00.000Z' },
  { id: 'rv-005', booking_id: 'bk-completed-event', customer_name: 'Lê Ngọc Mai', rating: 4, comment: 'Ảnh sự kiện được giao nhanh, đầy đủ khoảnh khắc và màu sắc rất đồng nhất. Trải nghiệm làm việc nhẹ nhàng.', service_title: 'Sự Kiện', portfolio_slug: 'dem-dang-nho', is_public: true, is_featured: false, created_at: '2026-08-11T11:00:00.000Z', updated_at: '2026-08-11T11:00:00.000Z' },
  { id: 'rv-006', booking_id: 'bk-completed-couple', customer_name: 'Minh & Thảo', rating: 5, comment: 'Bọn mình rất thích màu ảnh và cách hướng dẫn pose trong suốt buổi chụp. Mọi thứ chân thật và đúng với câu chuyện của hai đứa.', service_title: 'Couple', portfolio_slug: 'ngay-chung-doi', is_public: true, is_featured: false, created_at: '2026-07-30T16:00:00.000Z', updated_at: '2026-07-30T16:00:00.000Z' },
];
