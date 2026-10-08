# Audit v2 — Phân tích xóa dữ liệu test trước launch

> Chỉ phân tích, **không phải script xóa**. Không thao tác database/Storage. Nhãn bằng chứng giống `01-database-schema.md`.

## 1. Kết luận ngắn

- [ĐÃ XÁC NHẬN] Có thể xóa sạch dữ liệu giao dịch/user test, nhưng phải xử lý cả database lẫn Storage và không được bắt đầu bằng `auth.users`. FK và object không có cascade đồng nhất (`supabase/migrations/202609270001_full_stack.sql:13-67`; migrations 006/013/070003/070004).
- [ĐÃ XÁC NHẬN] Hệ thống cần giữ ba row `roles`, ít nhất một account `photographer`, ít nhất một active service, và các Storage bucket. Không có photographer thì trigger để `photographer_id=NULL`; booking có thể insert nhưng không xuất hiện trong workspace photographer do RLS `photographer_id=auth.uid()` (`202609270006:17-37,54-55`).
- [ĐÃ XÁC NHẬN] `supabase/seed.sql` hiện **không chạy được** vì hai row service legacy lệch số cột (`seed.sql:29-35`). Không dùng seed hiện tại làm kế hoạch recovery trước khi sửa ở một nhiệm vụ riêng.

## 2. Đồ thị FK và hành vi xóa

```text
auth.users
├─CASCADE→ profiles ─SET NULL← bookings.photographer_id
│                    └─CASCADE→ availability
├─CASCADE→ user_roles ─CASCADE← roles
├─SET NULL→ bookings.user_id
├─SET NULL→ reviews.user_id
├─SET NULL→ media.uploaded_by
├─CASCADE→ review_images.user_id
└─CASCADE→ review_likes.user_id

categories ─SET NULL→ services ─SET NULL→ bookings
           └SET NULL→ portfolio_albums ─CASCADE→ portfolio_images
locations  ─SET NULL→ portfolio_albums
           └SET NULL→ bookings
bookings   ─RESTRICT→ payments
           └RESTRICT→ reviews ─CASCADE→ review_images
                              └CASCADE→ review_likes
portfolio_albums ─SET NULL→ reviews.portfolio_album_id
```

Bằng chứng canonical: FK gốc `202609270001_full_stack.sql:13-67`; photographer `202609270006:10-15`; service/category final `202609270013:5-20` và `202610080001:4-8`; review media/likes `202610070003:20-30`, `202610070004:5-10`.

### Hệ quả theo object bị xóa

| Xóa | Hành vi DB | Rủi ro nghiệp vụ/Storage |
|---|---|---|
| `auth.users` user thường | profile, role membership, review_images/review_likes của user cascade; booking/review/media uploader SET NULL | Review row còn nhưng ảnh review bị mất; booking lịch sử mất liên kết account; object avatar/review Storage **không FK-cascade** |
| `auth.users` photographer | profile + membership cascade; availability của profile cascade; bookings assigned SET NULL | Booking sống nhưng không ai thấy theo photographer RLS; object avatar mồ côi |
| `roles` | user_roles của role cascade | Xóa row `user` làm trigger đăng ký không gán role; xóa admin/photographer làm mất quyền toàn hệ thống |
| `bookings` | bị RESTRICT nếu có payment hoặc review | Phải xóa review (ảnh/likes cascade) và payment trước; object ảnh review vẫn còn nếu chỉ xóa row |
| `reviews` | review_images/review_likes cascade | Object full/thumb trong `review-media` không tự xóa; `deleteReview` UI cũng chỉ xóa DB (`reviewService.ts:246-254`) |
| `services` | bookings.service_id SET NULL | Snapshot name/price giữ lịch sử. Xóa object cover không tự động; admin delete chủ động detach thừa (`AdminCrudPanel.tsx:60`) |
| `categories` | service/album category SET NULL | Không mất service/album; filter category biến mất |
| `locations` | booking/album location_id SET NULL | Booking còn `shoot_address` và fee snapshots; image Storage có thể mồ côi |
| `portfolio_albums` | portfolio_images cascade; reviews.portfolio_album_id SET NULL | Tất cả object cover + image + thumb vẫn còn nếu không xóa Storage trước |
| `profiles` trực tiếp | auth user còn; availability cascade; booking photographer SET NULL | AuthContext RPC không trả context row; login có thể thành trạng thái lỗi/role fallback |
| CMS row có URL | không cascade Storage | `image_path` giúp xác định object; legacy URL ngoài/Base64 không phải Storage object |

## 3. Phân loại dữ liệu

### (1) Dữ liệu người dùng/giao dịch có thể xóa sạch

- `review_likes`, `review_images`, `reviews`, `payments`, `bookings`: [ĐÃ XÁC NHẬN] transaction/test; xóa theo đúng thứ tự. Trước row delete, thu thập `review_images.storage_path/thumb_path` để xóa object sau khi backup.
- `availability`: [SUY LUẬN] block test có thể xóa; block lịch thật trước launch cần chủ dự án quyết định. Xóa account photographer sẽ cascade các block của họ.
- `profiles`, `user_roles`, `auth.users` của tài khoản test: có thể xóa sau transaction. Phải giữ/tạo lại admin và photographer vận hành.
- `review_likes` cũng tự cascade theo review/user, nhưng xóa rõ ràng trước giúp kiểm tra số lượng; không bắt buộc về FK.

### (2) CMS cần quyết định giữ/xóa

- `homepage_sections`, `categories`, `services`, `service_addons`, `locations`, `faqs`, `portfolio_albums`, `portfolio_images`, `media`, `site_settings` là content/config. Migration/seed chứa dữ liệu mẫu Unsplash và brand cũ; không tự coi là test hay production.
- `media` đang là library route trực tiếp; menu đã gỡ (`AdminSectionPage.tsx:69`). Row không được content FK tham chiếu, code chỉ dò URL ở 5 bảng trước khi xóa (`mediaService.ts:52-67`). Cần quyết định bỏ library hay dùng tiếp.
- `portfolio_albums/images` migration 003 là demo Unsplash; nếu launch với ảnh thật thì nên thay/xóa cùng object Storage.

### (3) Cấu hình/hệ thống không xóa trắng

- `roles`: bắt buộc ba enum values `user/photographer/admin`; trigger đăng ký tìm role `user` (`full_stack.sql:23-27`).
- Tối thiểu một `auth.users` + `profiles` + `user_roles(photographer)`; tối thiểu một admin để CMS/revalidate hoạt động. Có thể một account sở hữu cả hai role, nhưng migration ưu tiên photographer không đồng thời admin (`202609270011:10-23`).
- Ít nhất một `services.is_active=true`; nếu không `/booking` hiện trạng thái “đang tải” vĩnh viễn/không wizard (`FinBookingPage.tsx:23`). Category không bắt buộc FK vì nullable, nhưng cần cho filter/label.
- Storage buckets: `site-assets`, `portfolio`, `services`, `locations`, `avatars`, `review-media`; MIME/size do migrations `full_stack.sql:122-127`, `202610070003:47-49`.
- `site_settings` không thực sự bắt buộc để code render vì metadata/logo/footer hard-code, nhưng cần giữ một row nếu admin/config tương lai được dùng. `homepage_sections` có fallback/hard-code; các key code tra thật là `motion_settings`, `hero`, `craft_01..04` (`HomePageClient.tsx:13-30`).

## 4. Nếu không có photographer thì booking ra sao?

1. [ĐÃ XÁC NHẬN] Trigger `assign_default_photographer_before_insert` gọi `first_photographer_id`; không thấy row thì trả NULL và không raise (`202609270006:17-37`).
2. [ĐÃ XÁC NHẬN] `bookings.photographer_id` nullable, nên insert vẫn có thể qua trigger/pricing/RLS.
3. [ĐÃ XÁC NHẬN] Photographer SELECT chỉ thấy `photographer_id=auth.uid()`; booking NULL không ai vận hành (`202609270006:54-55`). Admin chỉ xem báo cáo và không có update policy/status RPC.
4. [SUY LUẬN] Đây là “booking bị kẹt pending”, không phải fail-fast. Kiểm tra sau wipe phải tạo photographer **trước** khi mở booking public và xác nhận `first_photographer_id()` khác NULL.

## 5. Storage và file mồ côi

| Bucket | Đường dẫn code tạo | Row liên kết | Khi wipe cần làm gì |
|---|---|---|---|
| `avatars` | `<uid>/<uuid>-name.webp` (`AuthContext.tsx:226-228`) | profiles.avatar_url/avatar_path | lưu path trước xóa auth/profile, xóa object; default SVG trong public không đụng |
| `review-media` | `<uid>/<uuid>-name[-thumb].webp` (`reviewService.ts:192-220`) | review_images storage/thumb path | xóa cả full+thumb trước/sau row theo manifest; DB cascade không xóa Storage |
| `portfolio` | `albums/<albumId>/...` | album cover paths, portfolio_images paths | nếu xóa album/content phải xóa cover/full/thumb; admin delete ảnh đang xóa object **trước** row, lỗi DB có thể làm mất file nhưng row còn (`albums/[id]/page.tsx:94-112`) |
| `services` | `services/...` | services.cover_image_path | xóa chỉ khi không giữ service/cover |
| `locations` | `locations/...` | locations.cover_image_path | tương tự |
| `site-assets` | section/settings/media folders | homepage/settings path, media.storage_path | dò path + URL; migration base64 có prefix `migrated/` |

- [ĐÃ XÁC NHẬN] `mediaService.deleteMedia` kiểm tra URL ở homepage/services/albums/images/locations nhưng không kiểm tra `site_settings`, mobile cover, avatar, review; không dùng làm công cụ wipe tổng quát (`mediaService.ts:55-66`).
- [ĐÃ XÁC NHẬN] Tất cả bucket được khai báo public. Policy SELECT theo parent review không đủ làm object bí mật khi URL đã biết; đây là quyết định security cần tách khỏi wipe.
- [CHƯA BIẾT] Số object mồ côi/thật và dung lượng: chạy phần Storage trong `audit-queries.sql` rồi đối chiếu path DB.

## 6. Tài khoản test và hard-code

- [ĐÃ XÁC NHẬN] `scripts/create-test-users.mjs:31-53` tạo 3 account: một admin+photographer, một photographer, một user; script confirm email, upsert profile, xóa rồi tạo lại memberships (`:69-111`). Báo cáo không lặp lại email/password/phone cụ thể để tránh phát tán credential hard-code.
- [ĐÃ XÁC NHẬN — HIGH] Script chứa plaintext test passwords và identifiers cụ thể (`:31-53`). Không có code runtime phụ thuộc các email đó; tìm kiếm chỉ thấy chúng trong script. Xóa account test không làm app hỏng nếu tạo operational roles khác trước.
- [ĐÃ XÁC NHẬN] `first_photographer_id` phụ thuộc role+thời điểm membership, không email/id; package/seed UUID hard-code là content ID, không account ID.
- [CHƯA BIẾT] Ba account đã từng được tạo trên production hay chưa; query anonymized chỉ giúp nhận diện theo domain/hash rút gọn, chủ dự án phải đối chiếu an toàn.

## 7. Quy trình wipe an toàn ở mức ý tưởng

1. **Đóng ghi:** maintenance/disable booking & signup; xác nhận không upload đang chạy.
2. **Backup:** snapshot DB + export auth + inventory Storage; ghi checksum/count mỗi bảng/bucket. Kiểm thử restore ở project staging.
3. **Chốt allowlist:** ID account admin/photographer thật; content CMS/album/service nào giữ; không dùng email plaintext trong tài liệu chia sẻ.
4. **Tạo/kiểm tra operator trước:** tạo admin và photographer bằng dashboard/script bảo mật; kiểm tra profile/membership, `first_photographer_id`, login proxy, RLS. Không dùng seed đang lỗi.
5. **Lập manifest object:** thu `avatar_path`, review full/thumb paths và path của content sẽ xóa. Tách external URL/Base64 (không gọi Storage remove).
6. **Xóa transaction graph:** likes (tùy chọn) → review_images → reviews → payments → bookings → availability test. Sau đó xóa user_roles/profiles thông qua xóa `auth.users` test; tuyệt đối exclude allowlist.
7. **CMS theo quyết định:** images trước albums; service/category/location dùng SET NULL nhưng kiểm tra content/page; không xóa roles/buckets.
8. **Storage:** xóa đúng manifest, batch nhỏ, log từng path; không xóa prefix/bucket rộng. Sau DB delete, dò object mồ côi và row trỏ object thiếu.
9. **Recreate/minimum content:** ít nhất active services, operational role accounts; settings/sections/categories theo quyết định; không chạy seed lỗi.
10. **Verification:** count/FK/orphan; smoke signup-email-login, booking → photographer confirm → completed → review+image, admin CMS/revenue, avatar; kiểm tra public không thấy PII/private review; mở ghi sau cùng.
11. **Rollback gate:** nếu count/role/service/bucket/smoke sai, restore snapshot thay vì sửa nóng tiếp.

Không cung cấp câu lệnh DELETE/TRUNCATE theo yêu cầu. `audit-queries.sql` chỉ có SELECT.

## 8. Kiểm tra sau wipe bắt buộc

- `roles=3`; admin/photographer allowlist còn membership; không account test ngoài allowlist.
- `first_photographer_id()` trả đúng operator; booking test mới có `photographer_id` không NULL và xuất hiện trong workspace.
- Transaction tables bằng 0 (nếu mục tiêu wipe sạch); không payment/review chặn booking.
- Active service >=1; `/services`, `/booking` không rỗng; section/key và bucket đủ.
- Mọi DB storage path tồn tại; mọi object trong prefix wiped không còn; không object user test mồ côi.
- RLS/policy/function/migration thực tế khớp files; do migration chain bootstrap không sạch, đặc biệt kiểm tra drift.

## Câu hỏi cần chủ dự án trả lời

1. Account nào là admin/photographer thật phải giữ, và có chấp nhận một account sở hữu cả hai role không?
2. Xóa toàn bộ booking/review/payment lịch sử hay giữ giao dịch thật? Có yêu cầu retention pháp lý không?
3. Giữ CMS nào: settings, homepage, 3 package, addons, locations, FAQ, album/ảnh?
4. Những availability block hiện có là test hay lịch nghỉ thật?
5. Có muốn xóa hẳn Media Library và dữ liệu của nó vì menu đã gỡ?
6. Ai chịu trách nhiệm backup/restore và maintenance window; staging project nào dùng để dry-run?
