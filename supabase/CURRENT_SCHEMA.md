# Current Supabase schema

Nguồn chuẩn duy nhất là toàn bộ file trong [`migrations/`](./migrations/), chạy theo thứ tự tên file. Các file `legacy/` chỉ để đối chiếu và không được chạy.

## Core data

- `profiles`, `roles`, `user_roles`: hồ sơ và role `user`/`admin`/`photographer`.
- `site_settings`, `homepage_sections`, `categories`, `services`, `service_addons`, `locations`, `faqs`: nội dung/CMS công khai và cấu hình website.
- `portfolio_albums`, `portfolio_images`: album công khai và ảnh; có cover responsive, metadata kích thước và đường dẫn Storage/thumbnail.
- `availability`, `bookings`, `payments`, `reviews`: lịch chặn, booking, thanh toán và đánh giá.
- `media`: thư viện media và metadata Storage.

## Booking and access rules

RLS và các function/trigger trong migrations kiểm soát quyền theo role, chỉ cho phép slot hợp lệ, chống overlap và giới hạn tối đa 2 booking/ngày cho mỗi photographer. Booking dùng đúng ba ca: `08:30–10:30`, `13:30–15:30`, `18:00–20:00`. Địa chỉ ngoại cảnh là bắt buộc; tiền cọc được giữ tương thích nhưng luôn bằng `0` theo migration hiện hành.

## Storage and performance additions

Migration `202610070002_storage_image_variants.sql` bổ sung các path cho ảnh CMS, avatar và thumbnail portfolio. Migration `202610070001_phase1_query_optimization.sql` bổ sung index cho album images, reviews, bookings và RPC summary/context.

Khi thay đổi schema, tạo migration mới trong `migrations/`; không sửa các migration đã tồn tại và không sửa/chạy SQL legacy như một migration mới.
