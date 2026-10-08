# Audit v2 — Chất lượng code và sẵn sàng public

> Audit chỉ đọc; các lệnh chạy local ngày 2026-10-08, không kết nối DB. Không in giá trị env/secret. Mọi hàng kiểm kê là `[ĐÃ XÁC NHẬN]` từ code/output local trừ chỗ ghi nhãn khác.

## 1. Kết quả kiểm tra

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | PASS, exit 0, không warning/output ESLint |
| `npx tsc --noEmit` | PASS, exit 0 |
| `npm run build` | PASS, Next.js 16.3.6 Turbopack; compile 0.939s, TypeScript 1.711s, 23 static pages 2.7s |

Build phân loại: static `/`, `/about`, `/booking`, `/services`, `/portfolio`, `/reviews`, login/account/workspaces; dynamic `/portfolio/[slug]`, `/admin/[section]`, `/admin/albums/[id]`, `/photographer/bookings/[id]`, 4 API; public pages revalidate 5 phút (`npm run build` output).

Next 16.3.6 **không in bảng First Load JS** trong output. Để không bịa số, bảng sau là phép đo bổ sung: tổng byte **raw, chưa gzip/brotli** của các script `/_next/*.js` thật sự được HTML prerender tham chiếu; gồm shared chunks nên không đồng nghĩa JS route-exclusive.

| Route | HTML KB | raw client JS KB |
|---|---:|---:|
| `/` | 62.7 | 908.0 |
| `/about` | 45.9 | 910.6 |
| `/booking` | 38.4 | 932.3 |
| `/services` | 60.1 | 915.2 |
| `/portfolio` | 43.4 | 910.9 |
| `/reviews` | 63.5 | 918.9 |
| `/login` | 10.2 | 854.0 |
| `/my-bookings` | 11.2 | 892.2 |
| `/profile` | 11.0 | 876.8 |
| `/admin` | 11.3 | 873.9 |
| `/admin/media` | 11.8 | 863.4 |
| `/admin/reviews` | 11.8 | 878.8 |
| `/photographer` | 11.3 | 876.1 |
| `/photographer/availability` | 11.5 | 885.6 |
| `/photographer/bookings` | 11.9 | 876.0 |
| `/photographer/reviews` | 11.9 | 892.0 |
| `/photographer/schedule` | 11.9 | 874.9 |

[SUY LUẬN] Raw totals cao vì root `AuthProvider` và nhiều public visual components nằm dưới client boundary. Cần bundle analyzer/coverage thật trước khi đặt performance budget; không so trực tiếp số raw này với “First Load JS” của Next cũ.

## 2. 20 file lớn nhất trong `src`

| # | Dòng | File | Nhận xét |
|---:|---:|---|---|
| 1 | 1692 | `src/app/globals.css` | nên chia tokens/base/public/workspace/components; rủi ro cascade |
| 2 | 421 | `src/lib/services/publicContentService.ts` | tách album/CMS/review + shared mapper/cache |
| 3 | 267 | `src/lib/context/AuthContext.tsx` | tách profile/avatar/password/auth errors |
| 4 | 262 | `src/components/BookingWizard.tsx` | state machine/hook riêng; UI shell đã tách tốt |
| 5 | 254 | `src/lib/services/reviewService.ts` | tách read/write/upload/admin |
| 6 | 233 | `src/components/MyBookingsModal.tsx` | tách card/list/review eligibility |
| 7 | 228 | `src/types/index.ts` | chia domain types |
| 8 | 222 | `src/components/Navbar.tsx` | desktop/account/fullscreen/mobile trong một file |
| 9 | 212 | `src/lib/data/mockData.ts` | fixture lớn đi vào client imports; nên dev-only/test fixture |
| 10 | 199 | `src/components/PortfolioAlbumPageClient.tsx` | gallery/lightbox/pagination tách hooks |
| 11 | 193 | `src/app/profile/page.tsx` | crop/profile/password/tabs tách component |
| 12 | 149 | `src/lib/services/imageUploadService.ts` | hợp lý theo domain; test canvas/storage cần bổ sung |
| 13 | 129 | `src/app/admin/albums/[id]/page.tsx` | upload/editor/row tách |
| 14 | 124 | `src/components/photographer/AvailabilityManager.tsx` | form/list/conflict logic tách |
| 15 | 119 | `src/lib/services/bookingReadService.ts` | quy mô chấp nhận |
| 16 | 116 | `src/lib/services/serviceCatalog.ts` | fallback/legacy mapping nên có test migration compatibility |
| 17 | 109 | `src/components/FinPhotoSections.tsx` | nhiều section hard-code; CMS boundary không rõ |
| 18 | 104 | `src/components/admin/AdminSectionPage.tsx` | revenue + router content chung |
| 19 | 104 | `src/lib/bookingAvailability.ts` | domain utility, cần unit test |
| 20 | 101 | `src/components/admin/AdminCrudPanel.tsx` | quá nén/minified style; schema config+UI+upload+CRUD |

## 3. Code smells, lỗi bị nuốt, type

- [ĐÃ XÁC NHẬN] Không có `any`, `@ts-ignore`, `@ts-expect-error` trong `src` theo search. Có nhiều cast `unknown/Record`, hợp lý cho untyped Supabase nhưng thiếu generated Database types.
- [ĐÃ XÁC NHẬN] Catch trả empty/fallback và che outage tại `availabilityService.ts:10-23`, `bookingReadService.ts:42-118`, `reviewService.ts:20-103,168-189`, `publicContentService.ts:240-412`. UI thường không phân biệt “không có dữ liệu” với “backend lỗi”.
- [ĐÃ XÁC NHẬN] `refreshPublicContent` nuốt lỗi (`src/lib/client/revalidatePublicContent.ts:1-5`); admin không biết cache stale.
- [ĐÃ XÁC NHẬN] Auth sync catch set user null (`AuthContext.tsx:111-120`), có thể biến DB/RPC outage thành trạng thái logout.
- [ĐÃ XÁC NHẬN] `AdminCrudPanel.tsx` nhiều one-line dài; maintainability/debug stack kém dù lint pass.
- [ĐÃ XÁC NHẬN] `getBookingRevenueSummary` tải toàn bộ row và reduce client; RPC aggregate không caller (xem report 03).
- [ĐÃ XÁC NHẬN] Album delete Storage trước DB; nếu DB delete fail, row trỏ file đã mất (`admin/albums/[id]/page.tsx:94-97`). Review delete ngược lại chỉ DB, để object mồ côi (`reviewService.ts:246-254`).
- [ĐÃ XÁC NHẬN] Migration chain/seed không bootstrap sạch (report 01); build không kiểm tra SQL.

## 4. Logic lặp/hard-code/mock

- Mapper service/query select bị lặp giữa `bookingReadService.ts:22-39` và `publicContentService.ts:240-259`; cùng dùng `serviceCatalog`, nhưng một hàm không caller.
- Review media legacy fallback và mapper lặp giữa `reviewService.ts:20-94` và `publicContentService.ts:304-344`.
- Date/status/empty-state copy và raw Supabase error patterns lặp; chưa có typed repository/error taxonomy.
- Hard-code production-visible: footer social links + **số điện thoại thật** ở `FinPhotoSections.tsx:101-105`, trong khi `site_settings` có fields tương ứng nhưng public UI không đọc; external Unsplash assets ở `FinPhotoSections.tsx:12-15,90-94`, `FinServicesPage.tsx:47`.
- Hard-code test credentials/identities trong `scripts/create-test-users.mjs:31-53`; không lặp giá trị trong báo cáo. Script không nên hiện diện/chạy trong production pipeline.
- `mockData.ts`: `MOCK_SERVICES` là default prop client cho services/booking; server production luôn truyền array (kể cả empty), nên không tự fallback khi DB rỗng. `MOCK_REVIEWS` chỉ fallback development. `PORTFOLIO_ALBUMS` default cho component nhưng pages truyền DB. `MOCK_PHOTOGRAPHERS/locations` không thấy runtime caller.
- `bookingShared.ts:10-43` chứa demo PII giả; chỉ seed localStorage khi `NEXT_PUBLIC_USE_DEMO_BOOKINGS=true`, production false/undefined.

## 5. Code/component/object/package thừa sau Phase 1–2

- App exports không caller: `getServices`, `getActiveUserBookingCount`, `getPublicReviews`, `getUserReviewLikes`, `toggleReviewLike` (import search chỉ declaration). `bookingService.ts` barrel vẫn dùng nhiều nơi nên không thừa.
- SQL không caller: `get_admin_booking_revenue_summary` (đáng lẽ nên dùng), `review_completed_booking` (đã thay atomic RPC). Like RPC/data chưa có UI caller nhưng có thể roadmap.
- `payments` và deposit fields là legacy/future; không app query table. `booking_photo`, conditional `*_legacy` không app refs.
- `media` route/service còn truy cập trực tiếp nhưng mục menu bị gỡ (`AdminSectionPage.tsx:69`): orphan feature, không dead import.
- Component scan không phát hiện component `.tsx` chỉ tự-reference; tất cả có import hoặc route entry. `ReviewCard` default cần kiểm tra riêng: `Stars` được dùng, default `ReviewCard` không thấy import — candidate tách/xóa default component.
- Assets `DSC02526.JPG`, `DSC07156.jpg` đều có refs; logo/default-avatar/hero refs. Không kết luận asset thừa.
- Dependencies đều có bằng chứng: Supabase clients, lucide, Next/React; `sharp` dùng script migration và Next image tooling. Không package rõ ràng thừa từ static search.
- Index prefix trùng được ghi report 01; cần usage stats thật trước drop.

## 6. Biến môi trường

| Tên | Bắt buộc | Browser? | Nơi dùng |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | bắt buộc production | có | client/server/proxy/public client/next image/script |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | bắt buộc production | có (đúng thiết kế Supabase; RLS phải bảo vệ) | client/server/proxy/public client |
| `SUPABASE_SERVICE_ROLE_KEY` | chỉ script admin/migration | không được expose | hai scripts; không runtime Next |
| `NEXT_PUBLIC_USE_DEMO_BOOKINGS` | optional, phải false prod | có | local dev booking fallback |
| `NODE_ENV` | hệ thống | bundle-defined | dev fallback/logging |

Client/server constructors dùng placeholder nếu thiếu (`src/lib/supabase/client.ts`, `server.ts`, `publicContentService.ts`); build vẫn PASS dù env sai. Cần deployment validation/smoke, không dựa build.

## 7. Launch checklist

| Mục | Trạng thái | Bằng chứng/việc thiếu |
|---|---|---|
| 404 | **CÒN THIẾU** branded custom | không `not-found.tsx`; chỉ Next default build route |
| Error/loading | **ĐÃ CÓ một phần** | segment files cho public/admin/photo/profile/bookings; client errors thường thành empty |
| Metadata/SEO | **CÒN THIẾU** | root + reviews + album detail; các public page khác inherit generic |
| sitemap/robots | **CÒN THIẾU** | không file route |
| favicon | **ĐÃ CÓ** | `src/app/favicon.ico` |
| Open Graph image | **CÒN THIẾU một phần** | album dynamic có; root/site setting chưa nối, không default OG |
| Privacy/Terms | **CÒN THIẾU** | không route/link; app thu PII, ảnh, review |
| SMTP/email template | **CHƯA BIẾT** | config ngoài repo; flow confirmation có code, phải E2E production |
| Forgot/reset password | **CÒN THIẾU — blocker** | button disabled “sắp có”; chỉ change password khi login |
| Anti-spam signup/booking | **CÒN THIẾU** | không CAPTCHA/app rate limiter; chỉ Supabase Auth limits + DB slot rules |
| Upload limits | **ĐÃ CÓ một phần** | client source 20MB; bucket 5/10/20MB; no DB/server content validation beyond Storage MIME |
| Security headers/CSP | **CÒN THIẾU** | `next.config.ts` chỉ images; không CSP/HSTS/frame/referrer/permissions headers; inline script complicates CSP |
| Analytics/error tracking | **CÒN THIẾU** | không package/config; errors mostly swallowed |
| DB backup/restore drill | **CHƯA BIẾT** | external ops; migration chain không clean bootstrap |
| Supabase/Vercel limits | **CHƯA BIẾT** | plan/region/usage không repo. Rủi ro egress Storage, image transform, DB size, auth email, function bandwidth |
| Contact config admin | **CÒN THIẾU** | admin fields tồn tại nhưng footer phone/social hard-code |
| Domain/region | **CHƯA BIẾT** | `.vercel` local không đủ chứng minh prod; không ghi domain/region |
| DB/RLS migration drift | **CHƯA BIẾT — blocker** | cần chạy audit SELECT; migration 20261008 untracked |
| Seed/recovery | **CÒN THIẾU — blocker** | seed SQL invalid và migration 002 phụ thuộc legacy table |
| Storage privacy | **CÒN THIẾU quyết định** | review-media/avatars public bucket; object URLs public |
| Test accounts/secrets | **CÒN THIẾU xử lý** | plaintext test credentials trong script; cần rotate/remove accounts trước launch |

## 8. Security/operational findings ưu tiên

1. **CRITICAL:** migration bootstrap/seed broken (`migrate_legacy_data.sql:6`, `seed.sql:29-35`); recovery không đáng tin.
2. **HIGH:** password reset/privacy/terms/anti-spam chưa có.
3. **HIGH:** chưa xác nhận production migration/RLS; untracked migration package có thể chưa deploy.
4. **HIGH:** hard-coded public contact/social bypass CMS; có nguy cơ launch sai thông tin.
5. **HIGH:** review-media public + cleanup thiếu; hidden/deleted review ảnh vẫn tải nếu biết URL/mồ côi.
6. **MEDIUM:** no CSP/security headers/error monitoring.
7. **MEDIUM:** global client boundary/raw JS lớn; cần lab measurement chứ chưa blocker correctness.
8. **MEDIUM:** SQL/app errors bị nuốt thành empty/zero/logout.

## 9. Tests hiện có và nên có

- [ĐÃ XÁC NHẬN] Không có unit/integration/E2E test file hay test script; file match “test” duy nhất là `create-test-users.mjs`, không phải test runner. Chỉ có lint/tsc/build.
- Unit: phone normalization; availability overlap/90-day/shift; service legacy mapping; date ranges; role normalization; image safety; review cursor.
- DB integration (local Supabase): migration from blank và legacy snapshots; seed; every RLS matrix role/action; triggers concurrency/overlap/max2; delete FK/cascade; SECURITY DEFINER authorization.
- Component/accessibility: booking wizard guest→auth draft, mobile package switch, dialogs focus/Escape, profile tabs, error/empty distinction.
- E2E: signup confirmation/resend/reset; login roles/proxy; booking concurrent slot; photographer lifecycle/block; completed review upload; admin CMS/revalidate/revenue; account deletion/wipe manifest.
- Performance: route bundle budget, public cache hit/miss, 10k booking revenue, 10k reviews pagination, Storage cleanup.

## Câu hỏi cần chủ dự án trả lời

1. Domain, Vercel/Supabase region và plan/usage hiện tại là gì?
2. SMTP custom, email templates, backup/PITR và error monitoring đã cấu hình ngoài repo chưa?
3. Số điện thoại/social hard-code có phải thông tin launch chính thức hay phải lấy từ CMS?
4. Like review, payments và Media Library là roadmap hay được phép loại bỏ?
5. Có chấp nhận coi password reset, privacy/terms, migration/seed recovery và production drift check là launch blockers?
