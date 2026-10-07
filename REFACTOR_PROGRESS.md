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

## Các giai đoạn còn lại

- Giai đoạn 6: dọn code thừa.
- Giai đoạn 7: tách file lớn, không đổi hành vi.
