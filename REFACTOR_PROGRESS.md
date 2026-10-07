# FIN PHOTO refactor progress

Branch: `perf-refactor`

## Baseline

- Source-only audit completed before this run; existing untracked `PROJECT_AUDIT_REPORT.md` is preserved and is not part of this refactor.
- Repository was on `main`; created local branch `perf-refactor` before committing.
- No migration has been applied to a real database, no deployment, and no push.

## Giai đoạn 1 — Bảo mật

Status: **hoàn tất**.

Implemented:

- Added `supabase/migrations/202610070005_phase1_security_consistency.sql`.
- Restricted direct `review_likes` reads to a signed-in user's own rows.
- Added `get_review_like_counts(uuid[])` as a `SECURITY DEFINER` aggregate RPC with safe search path and anon/authenticated execute grants.
- Added `review_likes(user_id, review_id)` index.
- Restricted the evaluated `review-media` storage policy to images belonging to public reviews; the bucket remains public for URL compatibility.
- Updated `validate_booking_write()` so `photographer_id IS NULL` blocks globally and assigned blocks only match the assigned photographer.
- Updated `src/lib/services/reviewService.ts` and `src/lib/services/publicContentService.ts` to use the aggregate RPC.
- Kept `get_my_review_likes()` callable only by authenticated users and preserved its auth.uid filter.

Verification: `npm run lint` pass (9 pre-existing `no-img-element` warnings), `npx tsc --noEmit` pass, `npm run build` pass. Committed locally as `perf: giai đoạn 1 - bảo mật`.

## Phát hiện thêm (chưa sửa)

- A public Supabase Storage bucket can still serve a known direct public URL even when a storage policy would deny the object. Hard blocking requires a private bucket and signed URLs.
- Other audit findings remain intentionally deferred to their listed phase.

## Giai đoạn 2 — Hết over-fetch, thêm phân trang

Status: **hoàn tất**.

Implemented:

- Album detail now fetches metadata separately from a bounded image page (18 rows, ordered by `display_order,id`), server-renders the first page, and loads subsequent pages through `/api/public/albums/[slug]/images`.
- Portfolio archive now starts with 24 album covers and loads further pages through `/api/public/albums`; the total count remains visible.
- Public reviews now start with 12 rows, use a `created_at,id` cursor through `/api/public/reviews`, and only enrich media, author, and like counts for the current page.
- Added `get_public_review_summary()` so average/count/distribution are aggregated in Postgres rather than calculated from the loaded page.
- Admin reviews now load 25 rows at a time and offer `Tải thêm`.
- `MyBookingsModal` now requests reviews only for the current user's booking IDs instead of loading every review.
- Public booking schedule and availability RPCs are bounded to today through +90 days. Added `check_booking_slot(date,start_time,photographer_id)` for client preflight; booking triggers remain authoritative.
- Revenue summary no longer downloads batches and aggregates in JavaScript when the aggregate RPC fails; it now raises a clear error.
- Removed the `AdminCrudPanel` refresh-on-every-rows-change effect; successful save already performs explicit revalidation.

Estimated request/payload change:

- Album detail: all image rows → 18 rows initially, then 18 per explicit click.
- Portfolio archive: all album rows → 24 rows initially, then 24 per explicit click.
- Public reviews: all review/media/like rows → 12 reviews plus only their related rows per page.
- My bookings review lookup: all reviews → only the user's booking IDs.

Verification: `npm run lint` pass (9 pre-existing raw-image warnings), `npx tsc --noEmit` pass, `npm run build` pass. Committed locally as `perf: giai đoạn 2 - phân trang và giảm over-fetch`.

## Giai đoạn 3 — Tối ưu ảnh

Status: **hoàn tất**.

Implemented:

- Replaced paired mobile/desktop `<Image>` elements for album covers and album heroes with `getImageProps()` plus `<picture>`, so the browser selects one art-directed source instead of downloading both.
- Kept the album hero eager with high fetch priority; gallery and archive images remain lazy.
- Added `thumb_url` and `thumb_path` to review media in `202610070007_phase3_review_thumbnails.sql`, with an idempotent index and a storage visibility policy that covers both full and thumbnail paths.
- Review uploads now generate a 640px WebP thumbnail while preserving the full image URL for the detail view. Reads fall back to the legacy `image_url` when the migration is not applied yet.
- Added `avatar_path` tracking and best-effort cleanup of the previous avatar after a successful profile update; cleanup failure does not roll back the profile change.
- Added fixed dimensions, lazy loading, async decoding, and rationale comments to intentionally retained small/user-generated raw images.
- Added `sharp` as a dev dependency. The existing Base64 tool now reports counts and approximate bytes by table/column in dry-run mode; no data migration was executed.

Estimated image/payload change:

- Archive/section art-direction: one selected source per viewport instead of two DOM image requests.
- Review cards: approximately 640px WebP thumbnails; full-size URLs are fetched only in the detail view.
- Avatar replacement: old storage object is removed after the new DB pointer is committed.

Verification: `npm run lint` pass, `npx tsc --noEmit` pass, `npm run build` pass. No real migration, deploy, or push was performed. Committed locally as `perf: giai đoạn 3 - tối ưu ảnh`.

## Giai đoạn 4 — Upload không để rác

Status: **hoàn tất**.

Implemented:

- Review images are prepared/uploaded with a maximum concurrency of 3.
- Added `create_review_with_images(...)` in `202610070008_phase4_atomic_review_uploads.sql`; after Storage upload, the review row and all `review_images` rows are committed in one database transaction.
- Any failed upload or RPC/row transaction removes every object successfully uploaded for that review and returns the failure to the user; the old behavior of silently swallowing media errors is removed.
- Admin album preview processing now also uses concurrency 3 while preserving the selected-file order.

Verification: `npm run lint` pass, `npx tsc --noEmit` pass, `npm run build` pass. No real migration, deploy, or push was performed. Committed locally as `perf: giai đoạn 4 - upload không để rác`.

## Giai đoạn 5 — Giảm tải frontend

Status: **hoàn tất**.

Implemented:

- Photographer bookings now load 50 records per page from 30 days before today onward. The fixed 60-second interval and hard `limit: 200` fetch were removed; visible-tab/focus refresh runs only when the last fetch is older than about two minutes, and the existing booking-status event refreshes immediately after a local status change. Added `Tải thêm booking`.
- `AuthModal` and `MyBookingsModal` are dynamically imported and rendered only after the corresponding user action. Public booking polling runs only while an authenticated user has the bookings modal open.
- Kept AuthContext cache/request deduplication and removed an unnecessary profile query from the fast context path; the fallback still uses the existing role checks and profile fallback.
- Added route-level `loading.tsx` and `error.tsx` for `/admin`, `/photographer`, `/profile`, and `/my-bookings`.
- Removed reveal blur/filter transitions. On viewports up to 767px, the scroll-progress listener and progress layer are disabled; the existing mobile grain layer remains disabled.
- Booking guest state is restored from `sessionStorage` after authentication as well as on initial open, preserving service/date/shift and entered details.

Verification: `npm run lint` pass, `npx tsc --noEmit` pass, `npm run build` pass. No real migration, deploy, or push was performed. Committed locally as `perf: giai đoạn 5 - giảm tải frontend`.

## Giai đoạn 6 — Dọn code thừa

Status: **hoàn tất**.

Evidence before deletion/refactor:

- Repo-wide `rg` (excluding `node_modules`, `.git`, and the user-owned untracked audit report) found no executable, test, script, dynamic-import, or string reference to `src/lib/services/contentService.ts`; the service was deleted.
- `updateBookingStatus` had one caller only, `src/app/photographer/bookings/[id]/page.tsx`, and it always passed `photographer`; there was no admin caller in `src`, `scripts`, or tests. The unused admin update branch and actor parameter were removed while keeping the `photographer_advance_booking` RPC path unchanged.
- `mapReview` was already typed with `ReviewRow` and contained no `any`/`as any`; no behavior change was needed there.
- The only remaining `console` usage in application source is the intentional development-only logger (`src/lib/devLogger.ts`), which is still used for recoverable Supabase diagnostics. CLI `console` output in migration/test scripts is intentional user-facing script output and was retained.

Implemented:

- Deleted `src/lib/services/contentService.ts` after the grep evidence above.
- Simplified `updateBookingStatus` and its sole photographer caller.
- Added documented `NEXT_PUBLIC_USE_DEMO_BOOKINGS=false` to `.env.example`.
- Kept intentionally shared/legacy or risky candidates listed in the final report only: `can()`, motion config/data attributes, LocalStorage mock fallback, `supabase/legacy/*`, `payments`, old migrations, and the duplicate admin portfolio/albums surfaces.

Verification: `npm run lint` pass, `npx tsc --noEmit` pass, `npm run build` pass. No real migration, deploy, or push was performed.

## Giai đoạn 7 — Tách file lớn, không đổi hành vi

Status: **hoàn tất**.

Implemented in small groups (lint, TypeScript and build were rerun after each group):

- `bookingService.ts` is now a backwards-compatible barrel. Booking reads moved to `bookingReadService.ts`, writes to `bookingWriteService.ts`, revenue queries to `bookingRevenueService.ts`, availability to `availabilityService.ts`, and shared constants/local mappers/demo fallback to `bookingShared.ts`.
- `BookingWizard.tsx` now composes `BookingModalShell`, `BookingStepSchedule`, `BookingStepCustomer`, `BookingStepConfirm`, and shared field primitives in `BookingWizardFields.tsx`.
- `PublicReviewsPage.tsx` now delegates review cards and the detail dialog to `PublicReviewCard.tsx` and `PublicReviewDetail.tsx`.
- `globals.css` was intentionally not modified in this phase; its future extraction plan is listed below.

Verification: `npm run lint` pass, `npx tsc --noEmit` pass, `npm run build` pass. No real migration, deploy, or push was performed. Committed locally as `perf: giai đoạn 7 - tách file lớn`.

## Báo cáo kết thúc

### (a) File và trạng thái theo giai đoạn

- Giai đoạn 1: tạo `supabase/migrations/202610070005_phase1_security_consistency.sql`; sửa `reviewService.ts`, `publicContentService.ts`; commit `1c62967`.
- Giai đoạn 2: tạo `supabase/migrations/202610070006_phase2_public_pagination.sql`; thêm/cập nhật API, service và UI phân trang; commit `edf8209`.
- Giai đoạn 3: tạo `supabase/migrations/202610070007_phase3_review_thumbnails.sql`; sửa image components, review media, AuthContext, global image CSS; thêm `sharp` và cập nhật script Base64; commit `d1088a9`.
- Giai đoạn 4: tạo `supabase/migrations/202610070008_phase4_atomic_review_uploads.sql`; sửa review upload và admin album preview upload; commit `d2a0e47`.
- Giai đoạn 5: sửa booking polling/pagination, lazy modal, AuthContext, motion và guest draft; tạo loading/error route files; commit `3d40742`.
- Giai đoạn 6: xóa `src/lib/services/contentService.ts` sau grep toàn repo; sửa `bookingService` caller/actor branch; sửa `.env.example`; commit `1200bca`.
- Giai đoạn 7: tạo các service/component files nêu trong mục Giai đoạn 7, biến `bookingService.ts` thành barrel, tách `BookingWizard` và `PublicReviewsPage`; commit kế tiếp sau khi hoàn tất kiểm tra.
- `PROJECT_AUDIT_REPORT.md` là file untracked có sẵn của người dùng; được giữ nguyên, không sửa và không commit.

### (b) Migration mới và lệnh chạy

Chạy theo thứ tự timestamp bằng Supabase CLI sau khi kiểm tra môi trường:

1. `202610070005_phase1_security_consistency.sql`
2. `202610070006_phase2_public_pagination.sql`
3. `202610070007_phase3_review_thumbnails.sql`
4. `202610070008_phase4_atomic_review_uploads.sql`

Lệnh đề xuất: `supabase db push` (hoặc chạy các file trên trong Supabase SQL Editor theo thứ tự). Tôi chưa chạy migration lên database thật.

### (c) Kiểm tra thủ công

1. Đăng ký, đăng nhập, refresh trang và kiểm tra role/user profile.
2. Ở trạng thái khách, chọn dịch vụ/ngày/ca, điền form, bấm gửi; đăng nhập rồi xác nhận draft được khôi phục và booking gửi được.
3. Photographer mở booking, đổi lần lượt trạng thái hợp lệ, kiểm tra danh sách cập nhật và thử `Tải thêm booking`.
4. Admin sửa nội dung, album và review; kiểm tra phân trang/tải thêm không tải toàn bộ danh sách.
5. Mở album nhiều ảnh, kiểm tra trang đầu và nút tải thêm; mở lightbox để xác nhận ảnh gốc chỉ tải khi cần.
6. Gửi review có 1–5 ảnh; thử ngắt mạng sau upload để xác nhận giao diện báo lỗi và không để object rác; kiểm tra thumbnail trong card.
7. Mở reviews khi chưa đăng nhập, thử lọc, mở chi tiết, bấm like khi đã đăng nhập và kiểm tra số like tăng/giảm đúng.
8. Đổi avatar, đổi lại avatar và kiểm tra object cũ được dọn best-effort; xác nhận profile/booking/review vẫn hiển thị avatar.

### (d) Quyết định mặc định đã áp dụng

- Giữ bucket `review-media` public và siết policy theo review public để không phá public URL hiện tại. URL public trực tiếp đã biết vẫn có thể truy cập; muốn chặn thật phải chuyển bucket private + signed URL.
- Art direction ảnh dùng `<picture>`/`getImageProps`; hero eager/high priority, ảnh nội dung lazy.
- Thumbnail review WebP 640px, tối đa 3 upload worker; review row và media row tạo trong RPC transaction.
- Lịch photographer lấy từ 30 ngày trước đến tương lai, 50 dòng/trang; refresh tab visible sau khoảng 2 phút hoặc sau đổi trạng thái.
- Guest booking yêu cầu đăng nhập tại bước gửi và giữ lại lựa chọn trong `sessionStorage`.

### (e) Tồn đọng, nghi ngờ và đề xuất sau

- Chưa xóa `can()` trong permissions, motion config/data attributes, LocalStorage mock fallback, `supabase/legacy/*`, bảng payments, migration cũ; đây là các mục được yêu cầu giữ nguyên.
- Chưa gộp `/admin/portfolio` và `/admin/albums`, hoặc `MyBookingsModal` với `/my-bookings`, vì cần kiểm tra nghiệp vụ/UI riêng trước khi đổi.
- `src/lib/devLogger.ts` và console trong CLI scripts là logging có chủ đích, không phải log debug thừa.
- Nên kiểm chứng index bổ sung trước khi tạo bằng `EXPLAIN (ANALYZE, BUFFERS) ...` trên bản sao dữ liệu thật; không tự tạo trong run này.
- Nếu cần bảo mật media tuyệt đối, chuyển `review-media` private và dùng signed URL; cân nhắc rate limit cho RPC/upload; tách tiếp các khối `globals.css` theo phạm vi khi có test visual.

### (f) Hoàn tác

- Nhánh làm việc: `perf-refactor`.
- Có thể quay lại commit trước từng giai đoạn: `1c62967`, `edf8209`, `d1088a9`, `d2a0e47`, `3d40742`, `1200bca`, và commit giai đoạn 7.
- Không dùng `git reset --hard` trên worktree có thay đổi người dùng. Tạo branch backup rồi `git revert <commit>` nếu cần hoàn tác code.
- Migration chỉ được tạo mới, chưa áp dụng. Nếu đã áp dụng sau này, rollback phải viết migration đảo ngược riêng sau khi backup/schema review; không sửa hoặc xóa migration cũ.
