# Dựng mới Supabase

> Tài liệu vận hành cho local/staging và production. Không chạy `supabase/seed.sql` hoặc
> `scripts/create-test-users.mjs` trên production. Không đưa service-role key, mật khẩu,
> email vận hành hoặc số điện thoại thật vào Git, báo cáo hay log.

## 1. Chuẩn bị

1. Cài Node.js, Docker và Supabase CLI.
2. Sao chép `.env.example` thành `.env.local`, rồi điền:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` chỉ khi cần chạy script quản trị local/staging
   - `NEXT_PUBLIC_USE_DEMO_BOOKINGS=false` khi build production
3. Chạy `npm run check:env`. Lệnh chỉ báo tên biến thiếu, không in giá trị.

`SUPABASE_SERVICE_ROLE_KEY` là secret phía server. Tuyệt đối không đổi tên nó thành biến
`NEXT_PUBLIC_*` và không dùng trong component/browser.

## 2. Database local mới

Nếu repository chưa có `supabase/config.toml`, khởi tạo cấu hình local một lần:

```powershell
npx supabase init
npx supabase start
```

Kiểm tra CLI đang trỏ local, sau đó dựng lại database:

```powershell
npx supabase status
npx supabase db reset
```

`db reset` chạy toàn bộ file trong `supabase/migrations` theo thứ tự tên rồi chạy
`supabase/seed.sql`. Seed chỉ chứa ba role hệ thống và ba service được ghi rõ là dữ liệu
mẫu; seed không tạo hoặc xóa `auth.users`. Không dùng `--linked` cho thao tác reset này.

Migration `202609270002_migrate_legacy_data.sql` chỉ ghi comment khi bảng legacy
`public.booking_photo` tồn tại. Vì vậy database mới không có bảng legacy vẫn tiếp tục
bootstrap; database đã có bảng này nhận đúng comment như trước.

## 3. Project hosted mới

Tạo một project trống trong Supabase Dashboard. Với staging, có thể link CLI và đẩy
migration sau khi xác nhận đúng project ref:

```powershell
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase migration list
npx supabase db push
```

Luôn kiểm tra project ref trước khi push. Repository này không tự kết nối hay chạy
migration lên project hosted. Với production, review từng migration, backup nếu project
đã có dữ liệu, rồi áp dụng theo thứ tự tên file bằng quy trình triển khai được duyệt.

Không chạy seed mẫu trên production. Sau migration, tạo admin/photographer vận hành và
service thật bằng quy trình ở dưới.

## 4. Tạo tài khoản test trên local/staging

Script giữ riêng ba tài khoản test: admin, photographer và customer. Script không xóa
tài khoản Auth hoặc role hiện có; khi email đã tồn tại, nó cập nhật tài khoản đó và bổ
sung role còn thiếu.
Có thể khai báo các biến sau trong `.env.local` để lần chạy sau dùng lại đúng định danh:

```dotenv
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
TEST_ADMIN_FULL_NAME=
TEST_ADMIN_PHONE=
TEST_PHOTOGRAPHER_EMAIL=
TEST_PHOTOGRAPHER_PASSWORD=
TEST_PHOTOGRAPHER_FULL_NAME=
TEST_PHOTOGRAPHER_PHONE=
TEST_CUSTOMER_EMAIL=
TEST_CUSTOMER_PASSWORD=
TEST_CUSTOMER_FULL_NAME=
TEST_CUSTOMER_PHONE=
```

Biến nào bỏ trống sẽ được sinh ngẫu nhiên. Password/định danh được sinh sẽ chỉ in một
lần khi script hoàn tất; số điện thoại không được in. Chạy:

```powershell
$env:NODE_ENV = 'development'
npm run seed:test-users
```

Script chủ động từ chối nếu `NODE_ENV=production`. Sau khi kiểm thử, xóa test account
theo manifest đã review; không xóa tài khoản admin và photographer vận hành.

## 5. Tạo admin và photographer vận hành an toàn

Thực hiện riêng cho từng account; khuyến nghị dùng hai account khác nhau:

1. Trong Supabase Dashboard > Authentication > Users, tạo hoặc mời user bằng email thật,
   mật khẩu tạm mạnh và metadata `full_name`, `phone`. Phone phải là số di động Việt Nam
   hợp lệ vì trigger database kiểm tra trường này.
2. Xác nhận user đã có row tương ứng trong `public.profiles`.
3. Trong SQL Editor, thay placeholder UUID bằng ID vừa tạo và chỉ thêm role cần thiết:

```sql
-- Admin
insert into public.user_roles(user_id, role_id)
select '<ADMIN_USER_UUID>'::uuid, id
from public.roles
where name = 'admin'
on conflict do nothing;

-- Photographer
insert into public.user_roles(user_id, role_id)
select '<PHOTOGRAPHER_USER_UUID>'::uuid, id
from public.roles
where name = 'photographer'
on conflict do nothing;
```

Không xóa membership hiện có để gán role. Đăng nhập thử từng account, xác nhận admin vào
được `/admin`, photographer vào được `/photographer`, và kiểm tra
`public.first_photographer_id()` trả về photographer vận hành trước khi mở booking.

## 6. Cấu hình Supabase Auth

Trong Dashboard > Authentication > URL Configuration:

- `Site URL`: domain HTTPS chính thức, ví dụ `https://<TEN-MIEN>`.
- `Redirect URLs`: thêm chính xác URL local/staging/production cần dùng, tối thiểu
  `http://localhost:3000/login?confirmed=1` và
  `https://<TEN-MIEN>/login?confirmed=1`.
- Khi triển khai luồng đặt lại mật khẩu ở Nhóm 1, thêm URL callback reset tương ứng trước
  khi kiểm thử E2E; không dùng wildcard rộng trên production.

Trong Dashboard > Authentication > Email/SMTP:

1. Cấu hình custom SMTP bằng mailbox/domain của dự án; không phụ thuộc SMTP thử nghiệm
   khi public.
2. Thiết lập From name/address, xác minh SPF/DKIM theo nhà cung cấp SMTP.
3. Rà template Confirm signup, Invite user, Magic link, Change email và Reset password.
   Giữ nguyên biến link do Supabase cung cấp, dùng nội dung tiếng Việt và không chèn secret.
4. Gửi thử tới nhiều nhà cung cấp email, kiểm tra Inbox/Spam, link hết hạn và redirect.

Cuối cùng chạy `npm run lint`, `npx tsc --noEmit`, `npm run build`, rồi smoke-test đăng ký,
xác nhận email, đăng nhập theo role và tạo booking trên staging.
