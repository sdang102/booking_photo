-- DỮ LIỆU MẪU TỐI THIỂU CHỈ DÀNH CHO LOCAL/STAGING.
-- Không chạy file này trên production. File không tạo, xóa hoặc thay đổi auth.users.

begin;

-- Ba role này là dữ liệu hệ thống bắt buộc. Tài khoản admin/photographer được tạo
-- riêng theo docs/BOOTSTRAP.md để không đưa định danh hoặc mật khẩu vào Git.
insert into public.roles(name)
values ('user'), ('photographer'), ('admin')
on conflict(name) do nothing;

-- Catalog mẫu tối thiểu để /services và /booking hoạt động trên database mới.
-- Mỗi row cung cấp đầy đủ các trường package mà ứng dụng đang sử dụng.
insert into public.services(
  id,
  category_id,
  name,
  slug,
  short_description,
  description,
  price,
  deposit_amount,
  duration_minutes,
  edited_photo_count,
  concept_count,
  location_count,
  outfit_count,
  cover_image,
  features,
  terms,
  is_featured,
  is_active,
  display_order
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    null,
    'The Essential',
    'essential',
    '[DỮ LIỆU MẪU] Một chút sang trọng trong những khoảnh khắc thường ngày.',
    '[DỮ LIỆU MẪU] Gói chụp tối thiểu để kiểm thử catalog và booking.',
    699000,
    0,
    45,
    8,
    1,
    1,
    1,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    '["45 phút chụp", "1 địa điểm", "8 ảnh chỉnh màu và retouch", "1 outfit"]'::jsonb,
    '[DỮ LIỆU MẪU] Thay nội dung này trước khi public.',
    false,
    true,
    10
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    null,
    'The Signature',
    'signature',
    '[DỮ LIỆU MẪU] Câu chuyện cá nhân qua từng khung hình.',
    '[DỮ LIỆU MẪU] Gói chụp trung cấp để kiểm thử catalog và booking.',
    1199000,
    0,
    90,
    18,
    2,
    2,
    2,
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80',
    '["90 phút chụp", "Tối đa 2 địa điểm gần nhau", "18 ảnh chỉnh màu và retouch", "2 outfits"]'::jsonb,
    '[DỮ LIỆU MẪU] Thay nội dung này trước khi public.',
    true,
    true,
    20
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    null,
    'The Editorial',
    'editorial',
    '[DỮ LIỆU MẪU] Một bộ ảnh mang dấu ấn thời trang và điện ảnh.',
    '[DỮ LIỆU MẪU] Gói chụp cao cấp để kiểm thử catalog và booking.',
    1899000,
    0,
    150,
    30,
    3,
    3,
    3,
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    '["150 phút chụp", "Tối đa 3 địa điểm gần nhau", "30 ảnh chỉnh màu và retouch", "3 outfits"]'::jsonb,
    '[DỮ LIỆU MẪU] Thay nội dung này trước khi public.',
    false,
    true,
    30
  )
on conflict(slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  deposit_amount = excluded.deposit_amount,
  duration_minutes = excluded.duration_minutes,
  edited_photo_count = excluded.edited_photo_count,
  concept_count = excluded.concept_count,
  location_count = excluded.location_count,
  outfit_count = excluded.outfit_count,
  cover_image = excluded.cover_image,
  features = excluded.features,
  terms = excluded.terms,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  display_order = excluded.display_order;

commit;
