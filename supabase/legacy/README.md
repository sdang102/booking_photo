# SQL legacy (chỉ lưu trữ)

Các file trong thư mục này là schema/patch cũ được giữ lại để đối chiếu lịch sử.

**KHÔNG chạy trực tiếp các file SQL trong thư mục này.** Chúng không phản ánh đầy đủ schema hiện hành, có thể tạo bảng/constraint/policy trùng hoặc ghi đè quy tắc booking hiện tại.

Schema được triển khai hiện nay phải đi qua các migration theo thứ tự trong [`../migrations/`](../migrations/). Không chạy migration production từ repository này nếu chưa review và phê duyệt quy trình deploy Supabase.

Xem [`../CURRENT_SCHEMA.md`](../CURRENT_SCHEMA.md) để biết tóm tắt schema hiện hành.
