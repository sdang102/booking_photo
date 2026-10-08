# Nhóm 5 — đo bundle, tối ưu client và kiểm thử logic

## Đo lường

Đã chạy `npx next build --experimental-analyze` với Next 16.3.6/Turbopack. Báo cáo tương tác nằm trong `.next/diagnostics/analyze`; số liệu ứng dụng được đối chiếu từ `.next/static/chunks` và client-reference manifest của từng route.

Sau tối ưu, toàn bộ JavaScript chunk của ứng dụng là 1,354,115 bytes raw và 426,079 bytes gzip cộng theo từng file (cách cộng này tính shared chunk một lần cho mỗi file, không phải kích thước transfer của một route).

Các chunk lớn nhất:

| Chunk | Raw | Gzip | Ghi chú |
| --- | ---: | ---: | --- |
| `1e2jd1x5_bmtx.js` | 260,243 | 68,146 | Supabase/common client |
| `196x_tfexoucg.js` | 228,922 | 71,417 | React DOM/common |
| `1j6qbzw9kfxp4.js` | 155,444 | 42,601 | shared runtime |
| `0cz1d0mv5g_q7.js` | 112,594 | 39,520 | shared runtime |

Public route accounting: root common chunks 290,033 raw / 76,954 gzip; public shared chunks 55,938 raw / 19,294 gzip; home route extra 2,499 raw / 1,243 gzip; services route extra 2,930 raw / 1,418 gzip.

Đã chạy cùng analyzer trước khi sửa. Các con số file của giao diện analyzer không phải app payload nên không dùng làm baseline số học. Baseline có thể đối chiếu theo client-reference manifest: trước đó home đưa toàn bộ `HomePageClient` và các section vào client; services đưa cả `FinServicesPage` vào client. Sau tối ưu, các module này đã biến mất khỏi manifest route, chỉ còn boundary auth/header, motion và FAQ cần tương tác.

AuthContext vẫn là phần dùng chung vì AuthProvider/header cần ở root. Các section hiển thị tĩnh của trang chủ và trang giới thiệu đã được đưa về Server Component. Route services hiện chỉ giữ `PublicMotionRoot` và accordion FAQ (`ServicesFaq`) ở client; `FinPhotoSections` và `FinServicesPage` không còn xuất hiện trong danh sách client module của route.

## Thay đổi code

- Tách phần render tĩnh của home/about/services khỏi client boundary; giữ redirect auth và motion ở client.
- Tách FAQ services thành client component nhỏ.
- Thêm các helper thuần cho availability, service catalog, doanh thu và cursor review để có thể kiểm thử độc lập.
- Thêm Vitest cùng script `npm test`; có unit test cho phone normalization, overlap/3 ca/90 ngày, service legacy mapping, role, review pagination, revenue range và admin validation.

Không truy cập hoặc thay đổi database/Storage production trong nhóm này.
