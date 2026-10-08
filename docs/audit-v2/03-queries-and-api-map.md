# Audit v2 — Mọi truy vấn và giao tiếp backend

> Kiểm kê tĩnh từ working tree; không gọi Supabase. Mọi hàng kiểm kê là `[ĐÃ XÁC NHẬN]` từ code trừ chỗ ghi nhãn khác. Request count là `[SUY LUẬN]` theo nhánh code, không phải trace mạng. “Payload” là hình dạng/giới hạn, không phải byte đo production.

## 1. Client/backend boundary

- Public Server Components dùng anon client riêng + `unstable_cache` 5 phút (`publicContentService.ts:18-35,131-135`). Browser gọi Supabase trực tiếp cho auth/user/admin/photographer; ba API public chỉ làm pagination; một API admin invalidates cache.
- `src/proxy.ts:5-50` bảo vệ `/admin/**` và `/photographer/**`: `auth.getUser` → `get_current_user_context`; fallback 2 RPC `has_role` nếu migration chưa có. `/profile` và `/my-bookings` chỉ client `RoleGuard`; RLS mới là data boundary.
- Global `AuthProvider` khi có session gọi `get_current_user_context`, cache/dedupe module-level 5 giây (`AuthContext.tsx:26-89,95-133`).

## 2. `src/lib/services`: từng hàm

### Booking/availability/revenue

| Hàm (file:dòng) | Loại; bảng/cột/filter | Caller/khi/tần suất/cache | Đánh giá |
|---|---|---|---|
| `getServices` (`bookingReadService.ts:22`) | SELECT services + categories; 13 cột; active; order display | **không caller** | trùng `getPublicServices`; xóa candidate |
| `getAllBookings` (`:42`) | SELECT `BOOKING_SELECT` 20 cột; optional date/status; order created; range, default 200 | Photographer provider mount, focus/visible nếu stale 120s, load more 50 | bounded; RLS assigned; payload PII, ~50 rows/page ở caller |
| `getUserBookings` (`:61`) | SELECT 20 cột; by user hoặc email; optional active; limit 50; có fallback query email | header khi modal mở + mỗi 60s/focus/visible; `/my-bookings`, profile | tối đa 2 query/lần nếu user query rỗng; fallback email bị RLS chặn trừ row own nên chủ yếu dư |
| `getActiveUserBookingCount` (`:93`) | HEAD exact count id, user + active status | **không caller** | tốt hơn tải 50 rows nếu nối lại badge |
| `getPublicSchedule` (`:103`) | RPC bounded 90 ngày, id/date/time/service/status/type | BookingWizard mount và refetch khi submit lỗi | 1 RPC; payload tăng theo 3 slot/ngày, tối đa thực tế ~270 rows |
| `getBookingById` (`:115`) | SELECT 20 cột `.eq(id).maybeSingle` | detail nếu provider page không có item | 0/1 row; RLS assignment |
| `createBookingPhoto` (`bookingWriteService.ts:14`) | RPC `check_booking_slot`; INSERT booking 9 supplied cols, returning 20 cols | submit wizard 1 lần | 2 round trips; trigger authoritative; no retry/dedupe/idempotency |
| `updateBookingStatus` (`:66`) | RPC `photographer_advance_booking` | photographer action | 1 RPC + provider refresh event (thêm 1 SELECT page) |
| `updatePhotographerNote` (`:80`) | RPC note | detail save | 1 RPC |
| `getAvailabilityBlocks` (`availabilityService.ts:10`) | RPC public availability 90 ngày, 6 cols | wizard mount/error refresh | 1 RPC |
| `getPhotographerAvailabilityBlocks` (`:18`) | SELECT own block 6 cols status in blocked/off; order | availability mount | 1 query; fallback thêm RPC nếu lỗi |
| `createAvailabilityBlocks` (`:26`) | INSERT N rows returning 6 cols | block form | 1 batch insert; client conflict precheck + DB trigger |
| `removeAvailabilityBlock` (`:60`) | DELETE id | unblock one/day | 1 request mỗi block; unblock day `Promise.all(N)` fan-out |
| `getBookingFinancialRecords` (`bookingRevenueService.ts:29`) | SELECT 6 cols; status/date; range 50 | admin revenue filter/load more | bounded |
| `getBookingRevenueSummary` (`:49`) | SELECT total/status/date **không range** rồi reduce client | admin dashboard + revenue filter | unbounded O(all bookings); RPC summary đã có nhưng không dùng; nguy cơ lớn ở hàng nghìn rows |

`BOOKING_SELECT` tại `bookingShared.ts:4`; không dùng `booking_code`, fee/subtotal/snapshot chi tiết. Dev fallback localStorage chỉ khi `NODE_ENV !== production`; demo PII nằm trong source nhưng chỉ seed local nếu `NEXT_PUBLIC_USE_DEMO_BOOKINGS=true` (`bookingShared.ts:10-58`).

### Public content

| Hàm (`publicContentService.ts`) | Query | Caller/cache/payload |
|---|---|---|
| `getPublicAlbumCovers` :147 | albums 11 fields + category/location, public, order; optional limit | home/about; cache 300s; 4 rows |
| `getPublicAlbumCoverPage` :151 | như trên + exact count, range max 24 | `/portfolio` SSR + API load more; function tự nó không cache, API CDN 300s |
| `getPublicAlbumBySlug` :165 | one album by slug/public | metadata+album page; cache/tag 300s |
| `getPublicAlbumImagePage` :197 | query album id/title rồi images 7 fields + exact count/range max18 | album SSR/API; cache 300s; **2 DB requests/page** |
| `getPublicHomepageData` :228 | homepage visible order + 4 albums song song | `/`; hai cached operations |
| `getPublicCategories` :238 | slug/name active order | portfolio; cache 300s |
| `getPublicServices` :259 | service 13 fields + category active/order | services/booking; cache 300s; image data URL >512KB replaced fallback |
| `getPublicServiceAddons` :266 | 5 fields active/order | services; cache 300s |
| `getPublicFaqs` :283 | 4 fields visible/order | services; cache 300s |
| `getPublicReviewPage` :376 | reviews 9 fields + booking/album relation; cursor `(created_at,id)`, limit max12; enrich images + profile RPC | reviews SSR/API; cache 300s; 1 main + 2 parallel enrich = 3 DB calls khi có rows |
| `getPublicReviews` :385 | first review page wrapper | **không caller** |
| `getPublicReviewSummary` :389 | RPC aggregate; fallback SELECT all public `rating` | reviews SSR | thường 1 RPC; fallback unbounded 1-column |

Public page caching có `public-content` tag. Admin mutations gọi `/api/revalidate-public`; tuy nhiên album/media pages gọi revalidate ngay khi `images/items` load và khác rỗng (`albums/[id]/page.tsx:54-55`, `admin/media/page.tsx:17-18`), nên **mở trang admin cũng POST invalidate**, không chỉ mutation.

### Reviews/media/images

| Hàm | Query/backend | Caller/tần suất/đánh giá |
|---|---|---|
| `getReviews` (`reviewService.ts:67`) | reviews + booking/album; optional public/bookingIds; order/range; sau đó 3 calls: images, public author RPC, like-count RPC | admin page 25/page; MyBookings theo IDs | 4 requests/page; admin không cần likes/media hết nhưng vẫn tải; bounded admin, booking modal có thể đến 50 IDs |
| `getPhotographerReviews` :105 | auth.getUser + reviews inner booking, photographer filter, limit100 | photographer reviews mount | 2 requests; no loading/error feedback |
| `canReviewBooking` :119 | booking id + review booking id song song | ReviewForm khi mở | 2 tiny requests; RPC create kiểm tra lại |
| `createReview` :130 | upload 1–5 images/full+thumb, RPC atomic rows | submit | 2 objects/ảnh + 1 RPC; cleanup on DB error |
| `getUserReviewLikes` :168 | auth + RPC | **không caller** |
| `toggleReviewLike` :179 | auth + RPC | **không caller**; like UI không hoạt động |
| `updateReviewModeration` :227 | optional album lookup + UPDATE review | admin click | 1–2 requests + cache POST |
| `deleteReview` :246 | DELETE review | admin click | DB cascades rows, **không xóa Storage objects** |
| `listMedia` (`mediaService.ts:8`) | 9 cols, order desc, limit100, optional filename ilike | direct `/admin/media`, mount và mỗi keystroke vì `search` dependency | request-per-keystroke, không debounce; no pagination past100 |
| `uploadMedia` :16 | Storage upload rồi INSERT row returning 9 cols; concurrency3 | file event | bounded per files; cleanup object if row fail |
| `deleteMedia` :52 | 5 parallel reference SELECTs, Storage DELETE, DB DELETE | admin click | 7 requests worst-case; checks thiếu settings/mobile/avatar/review |
| `prepareImage`/`uploadImageFile`/`uploadPreparedImage` (`imageUploadService.ts:41-102`) | browser canvas WebP, Storage full + optional thumb | CMS/media/avatar/album/review | source max20MB; concurrency handled caller; no server validation of dimensions |
| `removeStorageImages` :104 | Storage remove array | cleanup/delete | one request if nonempty |

Export/function không caller xác nhận bằng import search: `getServices`, `getActiveUserBookingCount`, `getPublicReviews`, `getUserReviewLikes`, `toggleReviewLike`; SQL RPC unused xem dưới.

## 3. Supabase trực tiếp ngoài services

| Vị trí | Calls |
|---|---|
| `AuthContext.tsx:48-257` | context RPC; fallback profile SELECT + 2 role RPC; signIn/signUp/resend/signOut/updateUser; profile UPDATE/avatar path SELECT+UPDATE; password verify signIn+update |
| `proxy.ts:5-47` | mỗi protected navigation: `auth.getUser` + context RPC; fallback +2 role RPC |
| `AdminCrudPanel.tsx:35-60` | configured table dynamic SELECT fields/range25; optional categories; INSERT/UPDATE/archive/delete; service delete còn UPDATE bookings detach |
| `admin/albums/[id]/page.tsx:41-112` | album+images 2 queries; legacy retry; image INSERT/UPDATE/DELETE + Storage |
| `api/revalidate-public/route.ts:5-17` | server `auth.getUser` + `has_role`, then tag/path invalidation |
| `scripts/create-test-users.mjs` | admin auth list/create/update; profile upsert; roles select; membership delete+insert; không được chạy trong audit |
| `scripts/migrate-base64-images.mjs` | database scans/update + Storage only khi chủ động chạy; không được chạy trong audit |

`AdminCrudPanel` sections/table: homepage→`homepage_sections`; services; addons→`service_addons`; categories; portfolio/albums→`portfolio_albums`; locations; faq→`faqs`; settings singleton (`AdminCrudPanel.tsx:18-30`). Select explicit dynamic fields; page 25. W event only, không polling/cache. Categories adds second request.

## 4. RPC cuối cùng

| RPC | Input → output | Quyền/kiểm tra | Caller |
|---|---|---|---|
| `get_current_user_context` | none → id,email,name,phone,avatar,roles[] | authenticated grant; row `id=auth.uid`; DEFINER | proxy/AuthContext |
| `has_role`/`is_admin`/`is_photographer` | role/none→bool | auth.uid membership; DEFINER | proxy fallbacks, RLS, revalidate |
| `get_admin_booking_revenue_summary` | none→4 aggregates | explicit `is_admin`, authenticated | **không caller** |
| `get_public_booking_schedule` | none→anonymous schedule 90d | anon grant; no PII | wizard |
| `get_public_availability` | none→block incl. reason 90d | anon grant | wizard |
| `check_booking_slot` | date,start,photographer?→bool | anon; no auth; bounded 90d | booking preflight |
| `photographer_advance_booking` | booking,status,note→booking | role + assignment + transition | detail |
| `update_photographer_note` | booking,note→bool | role + assignment | detail |
| `review_completed_booking` | booking,rating,comment→review | owner+completed | **không caller**, thay bởi atomic RPC |
| `create_review_with_images` | booking,rating,comment,json images→review | owner+completed; validates 1–5 | ReviewForm |
| `get_public_review_profiles` | review ids→name/avatar/service/user | only public reviews | public review page |
| `get_public_review_authors` | user ids→id/avatar | không kiểm tra review visibility | reviewService fallback/current admin enrichment |
| `get_public_review_summary` | none→avg,total,distribution | public rows only | reviews |
| `get_review_like_counts` | review ids→counts | public grant but không filter parent public; caller passes public/admin ids | enrichment |
| `get_my_review_likes` | review ids→ids | auth.uid | không UI caller |
| `toggle_review_like` | review→liked,count | auth + target public | không UI caller |

## 5. Request estimate theo route

Không tính static asset/image, RSC navigation, browser prefetch, Supabase SDK token refresh. Với user đã login, cộng **1 context RPC** khi AuthProvider nhận session; protected route server thêm proxy calls riêng. Cache hit có thể giảm public DB calls về 0.

| Route | Lần đầu (DB/API logic) | Lặp/event |
|---|---:|---|
| `/` | 2 server (sections+albums) | 0; auth context +1 nếu login |
| `/about` | 1 albums | 0 |
| `/services` | 3 song song | 0 |
| `/booking` | 1 services + 2 client RPC = 3 | submit 2; lỗi submit +2 refresh |
| `/portfolio` | 2 server | “load more” 1 API→1 DB query/page |
| `/portfolio/[slug]` | ~3 (album cached + album-id + images); metadata shares same cache | load more 1 API→2 DB queries/page |
| `/reviews` | 4 khi có rows (main+2 enrich+summary) | load more 1 API→3 DB; detail mở không request; like UI không wired |
| `/login` | 0 guest | login: auth + context (thường2); register auth; resend auth |
| `/my-bookings` | 1 (có thể2 fallback) + reviews enrichment tới4 | không interval; review form open +2, submit uploads+RPC |
| `/profile` | 1 bookings + context | save profile2; avatar Storage+2 DB+cleanup; password2 auth |
| `/admin` | proxy2 + context1 + revenue SELECT1 | mount only |
| `/admin/[CMS]` | proxy2 + context1 + list1 (+category1) | mỗi CRUD1 + revalidate POST(2 auth/RPC) + reload1 |
| `/admin/revenue` | proxy2 + context1 + 2 queries | mỗi filter2; load more1; summary unbounded |
| `/admin/reviews` | proxy2 + context1 + getReviews4 | load page4; action1 + revalidate2 |
| `/admin/albums/[id]` | proxy2 + context1 + 2 DB; sau load **revalidate2** | upload object(s)+row; state reload2; mỗi change có thể revalidate |
| `/admin/media` | proxy2 + context1 + list1; nếu nonempty revalidate2 | mỗi search keystroke1; upload per file+row; delete7 |
| `/photographer`/schedule/bookings | proxy2 + context1 + provider list1 | focus/visible chỉ nếu >120s:1; status action RPC+refresh1 |
| `/photographer/bookings/[id]` | trên + optional detail1 | note1/status2 incl refresh |
| `/photographer/availability` | trên + block list1 | create1; unblock N requests |
| `/photographer/reviews` | trên + auth1+reviews1 | mount only |

Public header booking modal chỉ bắt đầu query khi user mở; sau đó mỗi 60 giây + focus + visible (`PublicSiteHeader.tsx:23-46`). Đây là polling có scope modal, không chạy toàn thời gian khi modal đóng.

## 6. Hiệu năng khi hàng nghìn rows

- [ĐÃ XÁC NHẬN — HIGH] Revenue summary tải mọi booking total/status/date rồi reduce browser; thay bằng RPC aggregate đã tồn tại sẽ loại O(N) payload (`bookingRevenueService.ts:49-69`, migration Phase1:51-79).
- [ĐÃ XÁC NHẬN — MEDIUM] Review enrichment là 4-request fan-out và admin cũng tải media/authors/likes dù moderation chỉ cần một phần.
- [ĐÃ XÁC NHẬN — MEDIUM] Media search request-per-keystroke và cố định 100; cần debounce/pagination trong phase sau.
- [ĐÃ XÁC NHẬN] Portfolio/reviews/booking/provider/admin lists đã bounded sau Phase 2; public data cached/deduped server 300s.
- [SUY LUẬN] RPC public nhận UUID arrays nên cần cap input server-side nếu expose endpoint khác; current page max12/50.
- [ĐÃ XÁC NHẬN] `refreshPublicContent` nuốt mọi lỗi (`revalidatePublicContent.ts:1-5`), admin thấy save thành công dù public cache invalidate thất bại.

## Câu hỏi cần chủ dự án trả lời

1. Like review có cần launch không? Hiện DB/RPC còn nhưng UI không gọi.
2. Có chấp nhận chuyển revenue summary sang RPC đã có và bỏ hàm select-all ở phase sửa tiếp theo?
3. `/admin/media` là chức năng giữ lại hay legacy cần đóng route/xóa data?
4. Có cần hiển thị lý do photographer block công khai? RPC hiện trả `reason` cho anon.
5. Tần suất refresh 60 giây khi modal booking mở có đủ/nhất thiết không?
