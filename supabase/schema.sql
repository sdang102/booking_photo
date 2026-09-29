-- ========================================================
-- SCHEMA CƠ SỞ DỮ LIỆU CHO DỰ ÁN PHOTO BOOKING (SUPABASE)
-- ========================================================

-- 1. Bảng Dịch vụ & Gói chụp (services)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'wedding', 'portrait', 'concept', 'family', 'event'
    description TEXT,
    price NUMERIC NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 120,
    features JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    is_popular BOOLEAN DEFAULT false
);

-- 2. Bảng Nhiếp ảnh gia (photographers)
CREATE TABLE IF NOT EXISTS public.photographers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    specialties TEXT[] DEFAULT '{}',
    rating NUMERIC(2, 1) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    experience_years INT DEFAULT 3
);

-- 3. Bảng Đặt lịch hẹn (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    photographer_id UUID REFERENCES public.photographers(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL, -- e.g. "09:00 - 11:30"
    location_type TEXT DEFAULT 'studio', -- 'studio' | 'outdoor'
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    addon_services JSONB DEFAULT '[]'::jsonb, -- ['makeup', 'costume_rental', 'express_edit']
    total_price NUMERIC NOT NULL,
    deposit_amount NUMERIC DEFAULT 0
);

-- 4. Bảng Đánh giá & Phản hồi (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    avatar_url TEXT
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Chính sách đọc công khai (Public Read) cho Dịch vụ, Nhiếp ảnh gia & Đánh giá
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public Read Photographers" ON public.photographers FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);

-- Chính sách cho phép khách hàng tạo mới booking
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Bookings" ON public.bookings FOR SELECT USING (true);

-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
INSERT INTO public.services (title, slug, category, description, price, duration_minutes, features, image_url, is_popular)
VALUES 
(
  'Chụp Ảnh Cưới & Pre-Wedding Nghệ Thuật',
  'wedding-pre-wedding',
  'wedding',
  'Gói chụp cao cấp gồm 2 địa điểm ngoại cảnh hoặc phim trường, 2 layout trang điểm và 3 bộ trang phục lộng lẫy.',
  8900000,
  360,
  '["3 Váy cưới & Vest cao cấp", "Makeup & Làm tóc theo concept", "Tặng Album photobook 30 trang bìa da", "Trả toàn bộ file gốc + 40 file chỉnh sửa chuyên sâu"]'::jsonb,
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  true
),
(
  'Chân Dung Doanh Nhân & Profile Cá Nhân',
  'business-portrait',
  'portrait',
  'Xây dựng hình tượng chuyên nghiệp cho Profile, LinkedIn, CV, Báo chí và Thương hiệu cá nhân.',
  1800000,
  90,
  '["2 Concept phông nền Studio chuẩn quốc tế", "Hỗ trợ 1 layout makeup nhẹ nhàng", "Hướng dẫn tạo dáng theo ngành nghề", "Trả 10 ảnh photoshop chi tiết + toàn bộ file gốc"]'::jsonb,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  false
),
(
  'Concept Nghệ Thuật & Nàng Thơ / Vintage',
  'vintage-concept',
  'concept',
  'Khám phá vẻ đẹp thần thái riêng với ánh sáng cinematic, tone màu phim hoài niệm đầy cảm xúc.',
  2500000,
  150,
  '["Setup ánh sáng độc quyền tại Studio", "Stylist tư vấn phối phụ kiện", "15 ảnh chỉnh sửa màu Cinematic độc quyền", "Tặng kèm video reel ngắn hậu trường"]'::jsonb,
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
  true
),
(
  'Gia Đình Ấm Áp & Kỷ Niệm Ngày Cưới',
  'family-memories',
  'family',
  'Lưu giữ những khoảnh khắc hạnh phúc tự nhiên, gắn kết tình cảm giữa các thế hệ trong gia đình.',
  3200000,
  120,
  '["Dành cho gia đình tối đa 6 thành viên", "Không giới hạn số lượng ảnh chụp", "Tặng khung ảnh gỗ cao cấp 40x60cm", "Chỉnh sửa 25 ảnh gia đình hoàn hảo"]'::jsonb,
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
  false
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.photographers (full_name, bio, avatar_url, specialties, rating, review_count, experience_years)
VALUES
(
  'Alex Hoàng',
  'Nhiếp ảnh gia trưởng với 8 năm kinh nghiệm chuyên chụp ảnh cưới nghệ thuật và tone màu Cinematic châu Âu.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  ARRAY['Wedding', 'Pre-Wedding', 'Cinematic Color'],
  4.9,
  128,
  8
),
(
  'Mai Linh',
  'Chuyên gia concept nàng thơ, phong cách tối giản, chân dung thần thái và bắt trọn cảm xúc tự nhiên.',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  ARRAY['Concept', 'Nàng thơ', 'Profile Doanh Nhân'],
  5.0,
  94,
  5
),
(
  'Trần Quang Duy',
  'Bậc thầy ánh sáng Studio, chuyên gia nhiếp ảnh quảng cáo, gia đình và sự kiện với tính cách vui vẻ, tận tình.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ARRAY['Gia đình', 'Studio High-End', 'Sự kiện'],
  4.8,
  76,
  6
);
