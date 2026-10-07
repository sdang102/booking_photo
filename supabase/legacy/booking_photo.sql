-- ==========================================================
-- TẠO BẢNG booking_photo CHO SUPABASE THEO ĐÚNG ĐƯỜNG DẪN CỦA BẠN:
-- https://hcbnmvkdoelskmdikttg.supabase.co/rest/v1/booking_photo
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.booking_photo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    service_id TEXT,
    service_title TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    location_type TEXT DEFAULT 'studio', -- 'studio' hoặc 'outdoor'
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' (chờ xác nhận), 'confirmed' (đã cọc/chốt), 'completed', 'cancelled'
    addon_services JSONB DEFAULT '[]'::jsonb,
    total_price NUMERIC NOT NULL,
    deposit_amount NUMERIC DEFAULT 0,
    user_id TEXT -- ID tài khoản người dùng đặt lịch
);

-- Kích hoạt Row Level Security
ALTER TABLE public.booking_photo ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép đọc công khai hoặc theo user
CREATE POLICY "Cho phép đọc lịch chụp" ON public.booking_photo 
    FOR SELECT USING (true);

-- 2. Cho phép người dùng đã đăng nhập hoặc khách tạo lịch hẹn mới
CREATE POLICY "Cho phép tạo mới booking_photo" ON public.booking_photo 
    FOR INSERT WITH CHECK (true);

-- 3. Cho phép cập nhật trạng thái (Dành cho Tôi / Admin)
CREATE POLICY "Cho phép cập nhật booking_photo" ON public.booking_photo 
    FOR UPDATE USING (true);

-- 4. Cho phép xóa lịch nếu cần
CREATE POLICY "Cho phép xóa booking_photo" ON public.booking_photo 
    FOR DELETE USING (true);
