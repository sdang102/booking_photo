# Audit v2 — Cơ sở dữ liệu cuối cùng

> Phạm vi: mã nguồn/SQL tại working tree ngày 2026-10-08; không kết nối Supabase. `[ĐÃ XÁC NHẬN]` là thấy trực tiếp trong code/migration; `[SUY LUẬN]` là hệ quả hợp lý; `[CHƯA BIẾT]` cần đối chiếu database thật bằng `audit-queries.sql`. `R/W/P/I` lần lượt là code đọc, code ghi, policy/function/trigger, index/constraint. Vị trí dòng là trạng thái hiện tại.

## 1. Nguồn chuẩn và khả năng dựng lại

- [ĐÃ XÁC NHẬN] `supabase/CURRENT_SCHEMA.md:3` nói toàn bộ file trong `supabase/migrations`, theo tên, là nguồn chuẩn; `supabase/legacy/**` không được chạy.
- [ĐÃ XÁC NHẬN] Chuỗi hiện có 27 migration, từ `202609270001_full_stack.sql` đến migration **chưa commit** `202610080001_fin_photo_service_packages.sql`. Phase 1/2 được commit tại `1c62967`/`edf8209`; Phase 1 thêm hardening/index/RPC, Phase 2 thêm phân trang/RPC bounded. `git log` hiện ở nhánh `main`, không phải `perf-cleanup`.
- [ĐÃ XÁC NHẬN — BLOCKER] Không thể bootstrap sạch chỉ bằng migration: `202609270002_migrate_legacy_data.sql:6` chạy `COMMENT ON TABLE public.booking_photo`, nhưng không migration nào tạo bảng này. Database mới không có bảng legacy sẽ dừng ở migration 002.
- [ĐÃ XÁC NHẬN] `create table if not exists` và các `ALTER ... IF NOT EXISTS` làm kết quả phụ thuộc schema có trước; các nhánh rename `bookings -> bookings_legacy`/`reviews -> reviews_legacy` ở `202609270001_full_stack.sql:58,64` cũng chỉ kích hoạt khi gặp hình dạng legacy. Vì vậy schema dưới đây là mô hình canonical dự kiến, còn object legacy thật là `[CHƯA BIẾT]`.
- [ĐÃ XÁC NHẬN — BLOCKER SEED] `supabase/seed.sql:29-35` khai báo 17 cột cho `services`, nhưng hai row “Gói cũ” ở dòng 33-34 thiếu `location_count/outfit_count/edited_photo_count`; URL bị đặt vào cột integer đầu tiên. Seed hiện tại sẽ lỗi kiểu dữ liệu và rollback toàn transaction.

## 2. Kiểu, extension, view

- [ĐÃ XÁC NHẬN] Extension: `pgcrypto` (UUID), `btree_gist` (exclusion) — `202609270001_full_stack.sql:3-4`.
- [ĐÃ XÁC NHẬN] Enum: `app_role(user,photographer,admin)`, `booking_status(pending,confirmed,checked_in,shooting,completed,cancelled)`, `payment_status(unpaid,deposit_paid,paid,refunded)`, `availability_status(available,blocked,off)` — dòng 6-9.
- [ĐÃ XÁC NHẬN] Không có `CREATE VIEW` trong migration. Không có enum `location_type`; code luôn map booking thành `outdoor` (`bookingShared.ts:69`).

## 3. Bảng/cột cuối cùng và mức sử dụng

Quy ước trạng thái: **DÙNG** = có R/W/P/I; **W-only/R-only** chỉ xét code ứng dụng (trigger/policy được ghi riêng); **KHÔNG DÙNG** = không có code/SQL object hiện hành tham chiếu. Các cột UUID PK mặc định `gen_random_uuid()`, timestamp mặc định `now()` nếu không ghi khác.

### Identity

**`profiles`** — hồ sơ mirror của `auth.users`; profile/account, avatar, tác giả review. PK/FK `id -> auth.users ON DELETE CASCADE` (`202609270001_full_stack.sql:13`).

| Cột | Kiểu/ràng buộc | Dùng và bằng chứng |
|---|---|---|
| `id` | uuid PK/FK, NOT NULL | **DÙNG** W trigger `handle_new_user` dòng 25/script test:91; R AuthContext:62, avatar/review RPC; P self/admin |
| `full_name` | text NOT NULL default `''` | **DÙNG** W AuthContext:209/trigger; R AuthContext:64, `get_public_review_profiles` |
| `email` | text NOT NULL | **DÙNG** W trigger/script; R AuthContext:63. Không unique ở public; nguồn auth mới là identity chuẩn |
| `phone` | text NULL; check VN `NOT VALID` | **DÙNG** W AuthContext:209; R account/booking prefill; P trigger normalize |
| `avatar_url` | text NULL | **DÙNG** W AuthContext:228; R review/profile/UI |
| `avatar_path` | text NULL | **DÙNG** W/R AuthContext:224-234; thêm Phase 2 `202610070002:16` |
| `created_at`,`updated_at` | timestamptz NOT NULL | `created_at` **R-only/SQL** (photographer ordering gián tiếp qua role membership, không profile); `updated_at` **W-only** trigger `set_updated_at` |

**`roles`** — ba role hệ thống. `id smallserial PK`; `name app_role UNIQUE NOT NULL`; `created_at timestamptz NOT NULL`. Tất cả **DÙNG**: seed names (`full_stack.sql:16`), joins/RPC/script (`create-test-users.mjs:99-109`); `created_at` không được app đọc nhưng là metadata hệ thống.

**`user_roles`** — membership N:N. `(user_id,role_id)` PK; cả hai FK CASCADE; `created_at`. Tất cả **DÙNG**: trigger gán user, script test thay roles; role RPC/`first_photographer_id` đọc và order `created_at` (`202609270011:14-22`).

### CMS/public content

**`site_settings`** — singleton theo convention, không có constraint singleton; public header/footer/config và admin settings.

- `id` uuid PK **DÙNG** admin CRUD; `website_name`,`photographer_name` text NOT NULL **DÙNG** admin/seed nhưng **không thấy public UI đọc**; `logo_url`,`favicon_url`,`og_image_url` text NULL **DÙNG/W**, chỉ `logo_url` được seed/motion dùng, UI logo hiện hard-code asset (`BrandLogo.tsx:10`).
- `logo_path`,`favicon_path`,`og_image_path` text NULL: **W-only hiện tại** qua `AdminCrudPanel.tsx:16,97`; migration Phase 2 dòng 12-15; không public query nào select path.
- `phone`,`email`,`facebook_url`,`instagram_url`,`tiktok_url`,`threads_url` text NULL: **W-only hiện tại** (admin form thiếu `threads_url`); footer/contact hard-code link/brand (`FinPhotoSections.tsx:101-109`).
- `default_deposit numeric(12,2) NOT NULL default 0 check 0..100`: **LEGACY/P-only**, forced 0 (`202609270012:5-6`), current price trigger no longer reads it.
- `booking_notice`,`cancellation_policy`,`reschedule_policy`,`seo_title`,`seo_description` text NULL: **W-only** admin; root metadata hard-code (`app/layout.tsx:17-20`). `og_image_url` likewise chưa nối metadata.
- `display_order int NOT NULL default 0`: **R/W** admin ordering; `created_at`,`updated_at`: SQL/admin ordering + trigger. Public policy returns all rows; code `.limit(1)` without deterministic order in admin, trigger price no longer depends on row.

**`homepage_sections`** — CMS blocks. `id` PK; `section_key text UNIQUE NOT NULL`; `title/subtitle/image_url/image_path` nullable; `content jsonb NOT NULL default {}`; `is_visible bool NOT NULL default true`; `display_order int NOT NULL default 0`; timestamps. Tất cả **DÙNG**, riêng `image_path` **W-only**. Public query selects everything trừ `image_path` (`publicContentService.ts:207-223`); `HomePageClient.tsx:10-38` thực sự dùng `hero`, `craft_01..04`, `motion_settings`, còn nhiều key seed không quyết định render trực tiếp.

**`categories`** — taxonomy portfolio/service. `id` PK, `name` NOT NULL, `slug` UNIQUE NOT NULL, `description` NULL, `is_active` default true, `display_order` default 0, timestamps. Tất cả **DÙNG**: public filter/service join (`publicContentService.ts:233-250`), admin CRUD. FK từ service/album là SET NULL. `description` hiện **W-only/UI admin**, public chỉ select slug/name.

**`services`** — package catalog; booking snapshot lấy giá tại insert.

- `id` PK, `category_id uuid NULL FK categories ON DELETE SET NULL`, `name text NOT NULL`, `slug text UNIQUE NOT NULL`: **DÙNG** public/admin/booking; migration package dòng 27-51.
- `short_description`,`description` text NULL: **DÙNG/R** mapping; admin chỉ sửa `description`. `price numeric(12,2) NOT NULL check >=0`, `duration_minutes int NOT NULL check >0`, `edited_photo_count`,`concept_count`,`location_count`,`outfit_count` int NULL: **DÙNG** public catalog; DB không check count không âm.
- `deposit_amount numeric NOT NULL default 0 check >=0 + check =0`: **LEGACY**, trigger ghi 0; UI không đọc. `cover_image` **DÙNG**; `cover_image_path` **W-only**; `features jsonb NOT NULL []` **DÙNG**; `terms` **KHÔNG DÙNG**; `is_featured`,`is_active`,`display_order` **DÙNG**; timestamps SQL/admin.
- Ghi: admin generic (`AdminCrudPanel.tsx:40-59`), seed/package migration. Đọc: public/query booking (`publicContentService.ts:240-259`, `bookingReadService.ts:22-39`). P: public active/admin all/booking trigger. I: chưa có index `category_id`, chỉ unique slug PK.

**`service_addons`** — extras chỉ hiển thị ở `/services`; không được chọn/lưu vào booking. `id,title,description,price(check >=0),price_label,is_active,display_order,created_at,updated_at`; tất cả **DÙNG** trừ timestamps chỉ SQL. R public (`publicContentService.ts:261-266`), W admin config (`AdminCrudPanel.tsx:21`), seeded migration `202610050001:29-35`.

**`locations`** — CMS địa điểm/travel fee và optional FK booking/album. `id,name,area,address,description,cover_image,cover_image_path,travel_fee check>=0,is_active,display_order,timestamps`. **DÙNG**: admin; booking trigger reads active location/travel fee. Nhưng UI booking luôn gửi **không có `location_id`**, chỉ `shoot_address` (`bookingWriteService.ts:32-45`), nên `area/address/cover/path` chủ yếu CMS/public home cũ; public service hiện không query locations. `cover_image_path` **W-only**.

**`faqs`** — `id,question,answer,is_visible,display_order,created_at,updated_at`; tất cả **DÙNG**, timestamps chỉ SQL. Public services query (`publicContentService.ts:268-283`), admin CRUD.

### Portfolio/media

**`portfolio_albums`** — album. `id` PK; `category_id` SET NULL; `title` NOT NULL; `slug` UNIQUE; `description`; `location_id -> locations SET NULL`; `location_text`; `shoot_date`; `cover_image`; `cover_image_mobile`; `cover_image_path`; `cover_image_mobile_path`; `is_featured`; `is_public`; `display_order`; timestamps. Tất cả **DÙNG** ngoại trừ `description` (admin W, public không select), `location_id` (migration/joins đọc location name nhưng admin không ghi), path columns **W-only**, `is_featured` **W-only hiện tại**. Public reads `publicContentService.ts:26,120-194`; admin config lines 23.

**`portfolio_images`** — ảnh album. `id` PK; `album_id NOT NULL FK album CASCADE`; `storage_path`; `image_url NOT NULL`; `thumb_url`,`thumb_path`; `caption`,`alt_text`; `width`,`height`; `display_order`; `created_at`. Tất cả **DÙNG**; `caption` chỉ admin R/W, public không select; `created_at` SQL-only. Upload/replace/delete `app/admin/albums/[id]/page.tsx:41-112`; public pagination `publicContentService.ts:173-204`.

**`media`** — library metadata. `id`; `uploaded_by -> auth.users SET NULL`; `bucket NOT NULL`; `storage_path UNIQUE NOT NULL`; `public_url`; `filename NOT NULL`; `mime_type`; `size_bytes check>=0`; `category default other`; `metadata jsonb {}`; timestamps. `uploaded_by` **KHÔNG AI GHI/ĐỌC** (insert omits it), `updated_at` trigger-only; các cột khác **DÙNG** trong `mediaService.ts:8-67`, nhưng UI menu đã gỡ mục media (`AdminSectionPage.tsx:69`) dù route `/admin/media` vẫn truy cập trực tiếp được.

### Scheduling/transactions/reviews

**`availability`** — block/off của photographer. `id`; `date`; `start_time`; `end_time`; `status availability_status default blocked`; `reason`; `photographer_id -> profiles ON DELETE CASCADE`; timestamps; `end>start`. Tất cả **DÙNG**. W photographer manager/service; R public bounded RPC (lộ `reason`) và photographer direct; P conflict/default-owner triggers; I `(photographer_id,date,start_time)`.

**`bookings`** — giao dịch đặt lịch.

- Identity/contact: `id` PK; `booking_code text UNIQUE default BK-*` (**SQL-only; UI tự dựng mã từ id, BookingWizard.tsx:162**); `user_id -> auth.users SET NULL`; `photographer_id -> profiles SET NULL`; `service_id -> services SET NULL`; `location_id -> locations SET NULL`; `customer_name/phone/email NOT NULL`. Tất cả **DÙNG**, nhưng `location_id` hiện không được app ghi.
- Schedule: `shoot_address text NOT NULL check length 5..300`; `shoot_date/start_time/end_time NOT NULL`, `end>start`; **DÙNG**. Ba shift cứng + future window + max 2/ngày + GiST overlap được trigger/constraint kiểm tra.
- Notes: `customer_note`,`photographer_note` NULL **DÙNG**.
- Snapshot/money: `service_name_snapshot`,`service_price_snapshot`,`travel_fee_snapshot`,`subtotal`,`travel_fee`,`discount`,`total_price` numeric checks >=0; trigger ghi. App chỉ đọc service name/total; `service_price_snapshot`, fee/subtotal/discount là **CHỈ GHI KHÔNG ĐỌC bởi app**, nhưng bảo toàn audit. `deposit_amount default 0 + check =0` **LEGACY**; `payment_status default unpaid` **LEGACY/R-only** revenue/detail, không writer chuyển paid.
- `status default pending` **DÙNG**; timestamps **DÙNG** (`created_at` sort, `updated_at` trigger/R reviews). W insert `bookingWriteService.ts:32-49`, RPC advance/note; R booking/revenue contexts. I: unique code; GiST global overlap (không gồm photographer_id), `(photographer_id,shoot_date,start_time)`, `(user_id,status,created_at desc)`, `(photographer_id,created_at desc)`, `(status,shoot_date desc)`.

**`payments`** — payment legacy/future. `id`; `booking_id NOT NULL FK bookings ON DELETE RESTRICT`; `amount >0`; `payment_method`; `transaction_code`; `status payment_status default unpaid`; `paid_at`; timestamps. **KHÔNG CÓ CODE APP đọc/ghi bảng**; chỉ RLS/report conceptual. Xóa booking bị chặn nếu có payment. Admin/photographer chỉ SELECT; không policy INSERT/UPDATE/DELETE sau migration role separation.

**`reviews`** — một review/booking. `id`; `booking_id UNIQUE NOT NULL FK bookings RESTRICT`; `user_id -> auth.users SET NULL`; `portfolio_album_id -> albums SET NULL`; `rating 1..5`; `comment trim length 10..800`; `is_public default true`; `is_featured default false`; timestamps. Tất cả **DÙNG**. W RPC atomic/moderation/delete; R public/admin/photographer. Index partial `(is_featured desc,created_at desc) WHERE is_public` không khớp query Phase 2 hiện order `created_at,id`, nên chỉ hỗ trợ filter phần nào.

**`review_images`** — 1–5 ảnh/review. `id`; `review_id FK CASCADE`; `user_id FK auth CASCADE`; `image_url/storage_path NOT NULL`; `thumb_url/thumb_path`; `display_order check 0..4`; `created_at`; unique `(review_id,display_order)`, `storage_path`. Tất cả **DÙNG**, `created_at` SQL-only. Hai index `(review_id,display_order)` và `(review_id,display_order,id)` trùng prefix; index đầu có vẻ thừa.

**`review_likes`** — reaction N:N; PK `(review_id,user_id)`, cả FK CASCADE, `created_at`. Tất cả **DÙNG trong RPC/policy**, nhưng UI hiện không gọi `getUserReviewLikes`/`toggleReviewLike` (chỉ còn function export), nên tính năng like không hoạt động từ UI. Index `review_likes_review_id_idx` hữu ích count; `(user_id,review_id)` hữu ích own likes; PK hữu ích toggle.

### Legacy/conditional

- `booking_photo`: [ĐÃ XÁC NHẬN] code không tham chiếu; migration chỉ comment/xóa dữ liệu test (`202609270002:3-7`, `202609270009:120-122`). `[CHƯA BIẾT]` có tồn tại production không. Không an toàn drop trước khi chạy catalog/count.
- `bookings_legacy`,`reviews_legacy`: chỉ có thể sinh từ rename có điều kiện; code không đọc; reset migration từng xóa rows. `[CHƯA BIẾT]` schema/FK/data thật, do đó chưa kết luận drop.
- Payment/deposit: `payments`, enum `deposit_paid`, `services.deposit_amount`, `bookings.deposit_amount/payment_status`, `site_settings.default_deposit` là legacy/future. [ĐÃ XÁC NHẬN] business hiện “trả tại nơi chụp”, deposit bị check = 0 (`202609270012:3-17`); xóa cần migration phối hợp type/code/report, không chỉ drop cột.

## 4. Trigger và function/RPC cuối cùng

Trigger: `on_auth_user_created` tạo profile+user role; auth phone validation; profile/booking phone normalize; `assign_default_photographer` cho booking/availability; booking insert pricing/availability; schedule window; exact shift+2 bookings/day; availability-vs-confirmed-booking guard; `set_*_updated_at` cho 14 bảng. Bằng chứng: `full_stack.sql:23-30,69-80,133`; migrations 006/009/010/011/040001.

RPC/security:

- Role/context: `has_role`, `is_admin`, `is_photographer`, `get_current_user_context`; SECURITY DEFINER, context chỉ `auth.uid()`. Gọi bởi proxy/AuthContext/revalidate.
- Booking: `first_photographer_id` (DEFINER; không grant explicit), `get_public_booking_schedule` anon 90 ngày, `get_public_availability` anon 90 ngày, `check_booking_slot` anon, `photographer_advance_booking`/`update_photographer_note` authenticated và tự kiểm tra role+assignment.
- Reviews: `review_completed_booking` còn tồn tại nhưng không caller; `create_review_with_images` là đường ghi hiện hành và kiểm tra booking completed/owner; `get_public_review_profiles`, `get_public_review_authors`, `get_public_review_summary`, `get_review_like_counts` public; `get_my_review_likes`, `toggle_review_like` authenticated.
- Revenue: `get_admin_booking_revenue_summary` có check admin nhưng **không caller hiện tại**; UI đang select toàn bộ totals rồi reduce client (`bookingRevenueService.ts:49-69`).
- `[ĐÃ XÁC NHẬN]` Function không caller: `review_completed_booking`, `get_admin_booking_revenue_summary`; UI-unused RPC chain: `get_my_review_likes`, `toggle_review_like`; export app-unused: `getServices`, `getActiveUserBookingCount`, `getPublicReviews`.

## 5. RLS matrix cuối cùng

Ký hiệu `S/I/U/D`; `—` không policy. Policies permissive OR.

| Bảng | anon | user | photographer | admin | Điều kiện chính |
|---|---|---|---|---|---|
| profiles | — | S,U self | S,U self | CRUD all | id=uid / is_admin |
| roles | — | S all | S all | CRUD all | authenticated read all role names |
| user_roles | — | S self | S self | CRUD all | user_id=uid |
| settings/homepage/categories/services/albums/images/locations/faqs | S visible/active/public | cùng anon | cùng anon | CRUD all | cờ hiển thị; album image theo parent |
| service_addons | S active | S active | S active | CRUD all | is_active |
| media | — | — | — | CRUD all | is_admin |
| bookings | — | S own; I own | S assigned; I own nếu cũng user | S report; I own nếu payload uid | admin_all đã drop; không U/D trực tiếp |
| payments | — | — | S assigned | S report | không policy write |
| availability | qua RPC | — | CRUD own | — | admin không kế thừa photographer |
| reviews | S public | S public/own thông qua cùng policy | S public + assigned | CRUD all | user insert qua SECURITY DEFINER RPC |
| review_images | S nếu review public | S public; I own-review; D own | tương tự user | S public; D mọi row | không U policy/admin-all |
| review_likes | — | S own; I/D own | như user | như user | public count qua RPC |

Storage `objects`: public read cho 5 bucket gốc; review read theo parent; user CRUD trong prefix uid của `avatars/review-media`; admin insert chỉ 5 bucket nhưng update/delete policy `is_admin()` **không giới hạn bucket** (`full_stack.sql:129-131`). [SUY LUẬN] Nếu project có bucket ngoài scope, admin app có quyền update/delete object của bucket đó qua API. Tất cả 6 bucket được khai báo `public=true`; [SUY LUẬN] URL public có thể tải khi biết URL dù SELECT policy muốn ẩn review, nên policy parent không biến bucket thành private.

## 6. Index/exclusion

- Hữu ích trực tiếp: portfolio image `(album_id,display_order,id)`; booking user/status/created; photographer/date/start and photographer/created; status/date; review likes user/review + review/count; unique slugs/booking code/storage paths.
- Có vẻ trùng: `portfolio_images_album_order_idx(album_id,display_order)` và `portfolio_images_album_thumb_idx(album_id,display_order,id)`; tương tự hai review-image index. `[CHƯA BIẾT]` cần `pg_stat_user_indexes` trước khi drop.
- Partial review index bắt đầu `is_featured`; query public Phase 2 không order featured (`publicContentService.ts:351-360`), nên planner có thể chỉ tận dụng predicate, không order. Cần `EXPLAIN` thật.
- Exclusion `bookings_no_overlap` là **toàn hệ thống**, không có `photographer_id`; dù daily limit viết per-photographer, hai photographer vẫn không thể nhận cùng giờ (`full_stack.sql:61`). Đây là mismatch mô hình nếu studio dự kiến nhiều photographer.

## 7. Seed: bắt buộc và mẫu

- Bắt buộc: ba `roles`; ít nhất một account photographer trong `user_roles` (không thì default photographer NULL; insert vẫn có thể thành công nhưng photographer không thấy/không xử lý booking); một active service; các bucket tương ứng upload; homepage keys chỉ bắt buộc nếu muốn nội dung tùy biến, code có fallback cho nhiều block.
- Dữ liệu CMS có thể thay: `site_settings`, 11 homepage sections, categories, 3 active + 2 legacy services, 4 locations, 5 FAQs trong `seed.sql`; 6 album/7 ảnh Unsplash ở migration 003; motion/photo_break/marquee và 4 craft blocks; 3 addons. Đây là content mẫu/branding, không phải invariant DB.
- Section code thật đọc: `motion_settings`, `hero`, `craft_01..04` (`HomePageClient.tsx:13-30`). Các key `services/portfolio/calendar/locations/about/reviews/booking_process/faq/final_cta/footer/photo_break/marquee` được seed/migration nhưng phần lớn component hiện render nội dung hard-code; cân nhắc giữ vì admin/data tương lai, không gọi là bắt buộc runtime.

## 8. Điểm cũ trong `PROJECT_AUDIT_REPORT.md`

- [ĐÃ XÁC NHẬN] Các nhận định Base64 là đường upload chính, media `select('*')`, polling 15 giây, booking guest đi thẳng tới lỗi RLS, services/unbounded booking đều đã lỗi thời. Code hiện upload Storage WebP (`imageUploadService.ts`), select cột cụ thể/pagination/cache, stale refresh 120 giây, và wizard buộc auth trước insert.
- [ĐÃ XÁC NHẬN] Báo cáo cũ vẫn đúng về payment/deposit legacy và thiếu password reset; nhưng schema/object mới Phase 3/4, review images/likes, paths/thumbs và migration package 20261008 chưa được phản ánh đầy đủ.

## Câu hỏi cần chủ dự án trả lời

1. Production có `booking_photo`, `bookings_legacy`, `reviews_legacy` không, và có yêu cầu lưu audit bao lâu?
2. Có dự kiến nhiều photographer chạy song song? Nếu có, exclusion global hiện sai nghiệp vụ.
3. Payment online/đối soát có còn roadmap không? Nếu không, có cho phép lập migration bỏ toàn bộ payment/deposit legacy?
4. Giữ hay thay toàn bộ CMS/album/FAQ/locations mẫu trước launch? `site_settings` có phải singleton thật không?
5. Review ảnh ẩn có cần private thực sự không? Nếu có phải chuyển `review-media` khỏi public bucket.
6. Có chấp nhận bỏ các RPC/export không caller và index prefix trùng sau khi xem thống kê database thật không?
