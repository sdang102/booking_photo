# Danh sách ảnh viết cứng cần thay trước khi ra mắt

Danh sách này chỉ ghi nhận vị trí; Nhóm 4 không thay ảnh theo quyết định D12.

## Ảnh Unsplash

- `src/app/globals.css:258` — ảnh nền menu điều hướng.
- `src/app/globals.css:800` — ảnh nền khối kết trang chủ.
- `src/app/globals.css:1323` — ảnh nền CTA trang dịch vụ.
- `src/components/FinPhotoSections.tsx:12` — ảnh Chân dung nghệ thuật.
- `src/components/FinPhotoSections.tsx:13` — ảnh Couple & Pre-wedding.
- `src/components/FinPhotoSections.tsx:14` — ảnh Lookbook & Editorial.
- `src/components/FinPhotoSections.tsx:15` — ảnh Gia đình & Kỷ niệm.
- `src/components/FinPhotoSections.tsx:93` — hai ảnh minh họa câu chuyện portfolio.
- `src/components/FinServicesPage.tsx:46` — ảnh minh họa tuyên ngôn trang dịch vụ.

## Ảnh local/fallback viết cứng

- `src/components/BrandLogo.tsx:10` — `/chon-photo-saigon-logo-trimmed.jpg`.
- `src/components/FinAboutPage.tsx:14` — `/DSC07156.jpg`.
- `src/components/FinPhotoSections.tsx:27` — `/fin-hero-bg.jpg`.
- `src/lib/services/publicContentService.ts:23` — fallback `/fin-hero-bg.jpg` khi nội dung công khai thiếu ảnh.
- `src/lib/services/serviceCatalog.ts:107` — ảnh fallback `/fin-hero-bg.jpg` cho gói dịch vụ legacy.
- `src/lib/services/siteSettingsService.ts:34` — ảnh Open Graph fallback `/fin-hero-bg.jpg`.
- `src/lib/avatar.ts:1` — avatar mặc định `/default-avatar.svg`.

Các file ảnh local hiện có trong `public/`: `chon-photo-saigon-logo-trimmed.jpg`, `default-avatar.svg`, `DSC02526.JPG`, `DSC07156.jpg`, `fin-hero-bg.jpg`.
