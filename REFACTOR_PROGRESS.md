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

## Các giai đoạn còn lại

- Giai đoạn 2: giảm over-fetch và phân trang.
- Giai đoạn 3: tối ưu ảnh.
- Giai đoạn 4: upload không để rác.
- Giai đoạn 5: giảm tải frontend.
- Giai đoạn 6: dọn code thừa.
- Giai đoạn 7: tách file lớn, không đổi hành vi.
