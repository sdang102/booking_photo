# Audit v2 — Routes, UI/UX và user flows

> Mọi hàng kiểm kê là `[ĐÃ XÁC NHẬN]` dựa trên route/component hiện tại trừ chỗ ghi nhãn khác; nhận xét responsive/a11y chỉ từ JSX/CSS, chưa chạy screen reader/device lab.

## 1. Cây route và quyền

Root `app/layout.tsx:31-49` là Server Component, nạp fonts, metadata chung, theme script và bọc toàn app bằng client `AuthProvider`. `(public)/layout.tsx:4-9` thêm `PublicSiteHeader` + `FinFooter`. Admin/photographer layout là server wrapper gọi client shell + `RoleGuard`; proxy mới là guard server.

| Route | Mục đích/quyền | Tree và dữ liệu | State/UX/SEO |
|---|---|---|---|
| `/` | landing public | Server `page` → `HomePageClient` → `PublicMotionRoot`, Hero/Craft/Works/Process/Closing; sections+4 albums cached | loading/error group có; responsive sections. Root metadata generic; H1 trong Hero. CMS chỉ ảnh/text một phần, nhiều copy hard-code |
| `/about` | giới thiệu/portfolio public | Server → client `FinAboutPage` → works/process; 4 albums | group loading/error; metadata chỉ inherit generic, thiếu title riêng |
| `/services` | packages/addons/FAQ | Server fetch 3 nguồn → client `FinServicesPage` | empty services vẫn render layout; FAQ fallback phân biệt `null`/[]; metadata riêng thiếu; package CTA sang booking |
| `/booking` | wizard public nhưng submit cần auth | Server services → dynamic client `FinBookingPage` → `BookingWizard` 3 bước + AuthModal | Suspense/loading; empty services hiện “đang tải” vĩnh viễn. Không metadata riêng. Mobile aside chọn package bị `hidden lg:block`, nên trên màn nhỏ **không có picker trong bước wizard** nếu vào `/booking` không có query service |
| `/portfolio` | archive/filter | Server album page+categories → client archive → responsive image | group-specific loading/error; load more; empty state có; metadata riêng thiếu |
| `/portfolio/[slug]` | album/lightbox | Server metadata + album/image page → client gallery/lightbox | `notFound()` nhưng không custom not-found; dynamic metadata+OG cover tốt; load more/error inline |
| `/reviews` | review public | Server first page+summary → client list/detail | metadata title/description; loading/error inherit group; filters client; load more; no like button despite DB feature |
| `/login` | login/register | client page → AuthForm | Suspense blank fallback; inline messages/resend; no forgot-password; no route metadata |
| `/my-bookings` | customer tracking/review | client guard → modal full-screen → ReviewForm | route loading/error có; list query + review query; close always pushes `/`; unauthorized guard. No metadata/no server redirect |
| `/profile` | account/avatar/password | client guard; profile form/crop/password/bookings link | loading/error files; good save states; forgot password disabled; tab buttons lack `role=tab`/`aria-selected`; crop dialog lacks focus trap/Escape |
| `/admin` | admin dashboard/revenue preview | client admin shell; SELECT revenue | proxy+guard; no explicit loading for report (shows zero while pending), no error; responsive cards |
| `/admin/[section]` | CMS dynamic/revenue | client `AdminSectionPage`; dynamic `AdminCrudPanel` | valid sections runtime only; unknown gets inline not-found, HTTP still 200. CRUD loading skeleton; forms/messages; horizontal table mobile |
| `/admin/albums/[id]` | album image CRUD | client; album+images; browser compress/upload Storage | per-image progress/error; bulk concurrency3; no route-level custom error; delete removes Storage before DB, partial-failure risk |
| `/admin/reviews` | moderation | client 25/page | empty/load more; mutation lacks busy except delete; update exception not caught locally; photos fetched but not rendered |
| `/admin/media` | direct legacy media library | client 100 rows/search/upload/delete | menu says removed but route live; search per keystroke; progress; no empty/loading state; mobile grid okay |
| `/photographer` | assigned upcoming/pending | client provider/shell → cards | shared provider loading not surfaced on home; empty may flash before load completes; toast |
| `/photographer/bookings` | list/search/status | provider data; client filter | loading/empty/load more; filters omit checked_in/shooting/cancelled buttons though “all” includes them |
| `/photographer/bookings/[id]` | detail/actions/note/call/Zalo/map | provider or by-id fallback; RPC actions | loading/not-found inline; optimistic status with rollback; note busy state absent; external URL constructed safely encoded for map |
| `/photographer/schedule` | upcoming grouped agenda | provider only | empty can flash; `Object.groupBy` supported by build target/runtime assumption; no date navigation |
| `/photographer/availability` | block shifts/day | provider + direct block list | loading not shown; strong confirmations/optimistic rollback; public reason leakage is backend concern |
| `/photographer/reviews` | assigned review list | auth+query mount | no loading/error; empty initially flashes; fixed limit100/no pagination |

API: GET `/api/public/albums`, `/api/public/albums/[slug]/images`, `/api/public/reviews` validate/cap pagination and return CDN cache headers (`app/api/public/**`). POST `/api/revalidate-public` requires user+admin RPC (`app/api/revalidate-public/route.ts:5-17`).

## 2. Component ownership và client boundary

- [ĐÃ XÁC NHẬN] Public pages fetch server-side, nhưng gần như toàn bộ visual tree là Client Component (`HomePageClient`, `Fin*`, header/motion). Theo Next 16 guide `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, mọi import dưới `'use client'` vào client graph; đây là lý do raw client JS đo được cao.
- Header tree: `PublicLayout → PublicSiteHeader → Navbar → BrandLogo/LogoutButton`, lazy AuthModal/MyBookings. Header persists trong public route group, nên không remount khi điều hướng cùng group.
- Booking: `FinBookingPage → BookingWizard → BookingModalShell + BookingStepSchedule(BookingCalendar)/Customer/Confirm`; auth lazy modal.
- Reviews: `PublicReviewsPage → PublicReviewCard → PublicReviewDetail`; customer route `MyBookingsModal → ReviewForm`.
- Workspaces: `AdminShell → AdminSectionPage → AdminCrudPanel`; `PhotographerShell → PhotographerBookingsProvider → pages`.

## 3. Loading, empty, error

- Có segment `loading/error`: public group, portfolio, admin, photographer, profile, my-bookings. Không custom `not-found.tsx`; build có Next default `/_not-found`.
- Client fetch thường trả `[]` khi lỗi (`bookingReadService`, `reviewService`, revenue), khiến lỗi bị trình bày như empty/zero. `[ĐÃ XÁC NHẬN]` Photographer reviews, dashboard revenue và provider không lưu error state.
- Public service functions cũng trả `[]`/fallback thay vì throw; segment error hiếm khi bắt database failure. Đây là graceful degradation nhưng che outage.
- Admin generic có message lỗi DB; album/media/review có feedback, nhưng cache invalidation nuốt lỗi.

## 4. Responsive/mobile

- [ĐÃ XÁC NHẬN] Navbar có desktop/fullscreen menu và bottom nav mobile (`Navbar.tsx:106-220`); workspace có sidebar + bottom nav. Forms/grids dùng breakpoints.
- [ĐÃ XÁC NHẬN — HIGH UX] Booking summary/service selector chỉ ở `aside hidden ... lg:block` (`BookingWizard.tsx:230-255`). Mobile user không thể đổi default package bên trong wizard; họ phải đến từ service CTA/query. Nếu query slug/id không match, default package silently chosen.
- Modal uses `max-h-dvh`, body scroll locking; booking page variant avoids lock. Gallery/lightbox code locks body and handles navigation (`PortfolioAlbumPageClient.tsx`).
- Revenue table uses `min-w-[680px]` + horizontal scroll; workable but hard scan. Admin CRUD modal and album grids responsive.

## 5. Accessibility audit tĩnh

Điểm tốt:

- Nhiều button có type/aria-label, nav có labels/current, images đa phần có alt, loading có role/status, booking notice `alertdialog`, review stars có aria labels.
- Menu items đóng có `tabIndex=-1`; reduced motion kiểm tra ở Navbar/PublicMotionRoot; form inputs phần lớn nằm trong label.

Vấn đề:

- [ĐÃ XÁC NHẬN] Root inline theme `<script dangerouslySetInnerHTML>` không nonce/CSP (`app/layout.tsx:22,43`); security hơn là a11y.
- [ĐÃ XÁC NHẬN] `BookingModalShell`/AuthModal/Review detail/avatar crop có dialog semantics từng phần nhưng không thấy focus trap/restore; Escape chỉ xử lý một số picker/menu. Keyboard có thể tab ra nền.
- [ĐÃ XÁC NHẬN] Profile “tabs” có container `role=tablist` nhưng button không `role=tab`, `aria-selected`, `aria-controls` (`profile/page.tsx:145-149`).
- [ĐÃ XÁC NHẬN] Booking calendar cần kiểm tra keyboard semantics; date cells là button nhưng trạng thái unavailable/selected phải dựa thêm accessible labels (`BookingCalendar.tsx:32-90`).
- [ĐÃ XÁC NHẬN] Icon-only admin/gallery controls đa phần có aria-label, nhưng generic CRUD image preview/inputs cần manual audit. `img` exemptions có alt.
- [SUY LUẬN] Tương phản không thể xác nhận từ class/theme mà không đo computed colors; cần axe/Lighthouse và keyboard walkthrough.

## 6. SEO

- Root có title/description, lang vi, viewport, favicon file (`app/layout.tsx:17-29`, `app/favicon.ico`). Reviews và album detail có metadata riêng; album OG image tốt.
- [ĐÃ XÁC NHẬN] Không có `sitemap.ts/xml`, `robots.ts/txt`, manifest, OG image file/generator, canonical/metadataBase. `site_settings.seo_*` và `og_image_url` không nối Metadata API.
- [ĐÃ XÁC NHẬN] About/services/booking/portfolio/login/account/workspaces chỉ inherit root title; public routes thiếu unique title/description. Admin/profile nên `noindex` nhưng không khai báo.
- Heading: mỗi route chính thường có một H1; album/public detail cần manual DOM check. Next default not-found không brand-specific.

## 7. User flows chi tiết

### 7.1 Đăng ký (6 bước)

1. Mở `/login?tab=register` hoặc AuthModal; chọn Đăng ký (`login/page.tsx:23-54`, `AuthModal.tsx`).
2. Nhập name, VN mobile, email, password; UI yêu cầu password ≥8, phone normalize (`AuthContext.tsx:151-162`).
3. `auth.signUp` gửi metadata và redirect `/login?confirmed=1` (`:163-177`). Auth trigger DB validate phone, tạo profile+role user (`full_stack.sql:23-30`, migration 009).
4. Nếu Supabase trả session (confirm off), login ngay; nếu không, UI chuyển tab login và báo mở email.
5. Click email → `/login?confirmed=1`; UI chỉ dựa query để báo “đã xác nhận”, sau đó user login.
6. Có nút gửi lại confirmation; rate-limit/error được map tiếng Việt.

Điểm kẹt: `[CHƯA BIẾT]` SMTP/site URL/redirect allowlist production; lỗi email provider được giải thích nhưng user không có contact support. Không captcha/rate limit app. Trigger bắt buộc phone metadata có thể làm admin create user không phone thất bại. Email template không nằm repo.

### 7.2 Login/logout/quên hoặc đổi password

- Login 3 bước: nhập → `signInWithPassword` → context RPC/role → redirect `next`, admin, photographer hoặc `/`. `next` chỉ kiểm tra bắt đầu `/` và không `//`; an toàn với external redirect (`login/page.tsx:12-16`).
- Logout gọi Supabase signOut, dù lỗi vẫn clear local user; `LogoutButton` refresh route.
- **Quên mật khẩu: chưa có**; button disabled “sắp có” (`profile/page.tsx:172`), login form cũng không reset link. Đây là launch blocker cho self-service.
- Đổi password có: profile → current password verify bằng sign-in → `updateUser`; success/error rõ. 4 input actions, không force logout other sessions.

### 7.3 Đặt lịch (3 wizard steps + auth)

1. Service CTA đưa `/booking?service=<id>`; page fetch active services.
2. Wizard đồng thời tải public schedule + block; chọn ngày trong 90 ngày và một trong 3 ca (`BookingWizard.tsx:77-94`, schedule component).
3. Nhập địa chỉ (≥5), name, VN phone, email, note; account data prefill.
4. Review package/date/time/address/contact/price; no deposit.
5. Nếu guest, draft lưu sessionStorage, mở auth và báo bắt buộc login (`BookingWizard.tsx:188-197`). Sau auth, draft restore và step3.
6. Submit: slot RPC → booking INSERT; DB gán photographer, snapshot price, validate phone/future/shift/conflict/max2; UI báo mã tự dựng và pending.

Điểm kẹt: AuthModal `onSuccess` chỉ đóng; dựa AuthProvider event để user state cập nhật, draft restore effect phụ thuộc user. Mobile không đổi package. Nếu không photographer booking mắc pending. Không idempotency: double submit bị disabled trong instance nhưng retry/network ambiguity có thể tạo duplicate khác slot constraint tùy timing. Lỗi DB được làm thân thiện nhưng chi tiết support không có.

### 7.4 Khách theo dõi booking và review

1. Mở account panel → “Lịch đã đặt” hoặc `/my-bookings`; query own user (fallback email).
2. Modal ẩn cancelled; completed chỉ hiện nếu chưa có public review (`MyBookingsModal.tsx:74-84`). Vì query reviews đặt `publicOnly:true`, review của user bị admin ẩn sẽ bị xem như “chưa review” dù unique booking ngăn submit — UX kẹt.
3. Xem status/date/address/price; completed → mở ReviewForm.
4. Form preflight 2 query; bắt buộc rating, comment 10–800, **1–5 ảnh**; upload full+thumb; atomic RPC tạo review/images; success sau 900ms.
5. Review public ngay mặc định; admin có thể hide/feature/delete.

Điểm kẹt: bắt buộc ảnh không được giải thích từ sớm; review hidden gây nút đánh giá lại; admin delete DB để lại file; list fetch errors thành empty.

### 7.5 Photographer xử lý booking/chặn ca

1. Login role photographer → proxy/context → provider tải 50 booking từ -30 ngày.
2. Dashboard/list/schedule dùng chung data; chọn detail.
3. Pending → confirmed/cancelled; confirmed → checked_in/cancelled; checked_in → shooting; shooting → completed. RPC lock+validate assignment (`202609270006:74-90`).
4. Note nội bộ qua RPC; gọi điện/Zalo/map external.
5. Availability: chọn date/ca/reason; UI tránh confirmed conflict, DB trigger kiểm tra; insert blocks; có thể unblock từng ca/ngày.

Điểm kẹt: provider lấy từ -30 ngày nên lịch sử cũ hơn chỉ qua load more, order created chứ không shoot date. Home/schedule empty flash. Cancel không thu lý do. Admin không thể rescue booking unassigned do role separation/policy.

### 7.6 Admin album/CMS/review/revenue

- CMS: route section → list 25 → add/edit/archive/delete → direct RLS → POST revalidate. Services delete giữ booking snapshots; form service thiếu outfit/category/image fields so package content không sửa đầy đủ.
- Album: list album qua generic panel → `/admin/albums/:id` → prepare concurrency3 → upload full/thumb → insert metadata; replace upload new/update row/delete old; delete does Storage first.
- Reviews: list 25, public/featured toggle, delete. Không hiển thị uploaded photos dù đã tải.
- Revenue: summary select-all + 50 detail; filter day/month/year/status client request; “expected” chỉ confirmed, trong khi atVenue/active semantics khác.
- Media: route trực tiếp upload/search/delete nhưng menu đã gỡ.

Điểm kẹt: generic forms expose DB errors, không schema-specific validation đầy đủ; cache invalidation silent; settings saved nhưng nhiều field không ảnh hưởng public UI/SEO; seed/package fields drift.

### 7.7 Portfolio/album/lightbox/reviews public

1. Portfolio loads 24 covers + categories; filter existing client rows, load more through API.
2. Click album; metadata+18 images; responsive cover; “load more”.
3. Click image opens lightbox, body lock; next/prev/close controls; alt fallback album title.
4. Reviews load 12 + summary; expand/open detail; load more cursor.

Điểm kẹt: category filter trên client chỉ lọc pages đã load, nên album matching ở page sau không hiện đến khi load; external image host ngoài allowlist có thể break `next/image` nếu không `unoptimized`; no custom 404.

## 8. Cải thiện ưu tiên sau audit (không thực hiện)

1. Password reset + SMTP/redirect E2E; anti-spam/captcha/rate limiting.
2. Sửa mobile package picker và empty/error truthful states.
3. Không cho booking launch nếu không operational photographer; admin rescue unassigned.
4. Fix hidden-review logic, optional-photo decision, cleanup review Storage.
5. Metadata per public route, sitemap/robots/canonical/OG; connect settings hoặc bỏ field giả.
6. Focus trap/restore, tabs semantics, keyboard/axe audit.
7. Revenue RPC; debounced/paginated media; remove load-triggered revalidation.

## Câu hỏi cần chủ dự án trả lời

1. Review có bắt buộc ảnh không, và review bị ẩn có được sửa/gửi lại không?
2. Guest phải đăng ký mới được booking là chủ ý hay cần guest booking an toàn?
3. Mobile user có cần đổi package ngay trong wizard?
4. Admin có cần quyền gán/reassign booking photographer?
5. Brand/contact/SEO lấy từ CMS hay hard-code là nguồn chuẩn?
6. `/admin/media` giữ hay đóng trước launch?
