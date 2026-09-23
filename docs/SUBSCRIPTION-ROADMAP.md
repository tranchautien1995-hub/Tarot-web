# Hướng phát triển hệ thống gói TTarot

## Bản 2.7.49

- Tạo một nguồn dữ liệu chung cho Free, Plus, Pro và Pro Max tại `lib/plans.ts`.
- Thêm bảng so sánh gói, mục menu và thông tin gói trong tài khoản.
- Mặc định tài khoản chưa được gán thuê bao là Free.
- Chưa khóa tính năng và chưa thu tiền trong bản này.

## WebVer1 — dữ liệu thuê bao và giới hạn thật

Tạo các bảng Supabase:

- `profiles`: thông tin hiển thị của người dùng.
- `subscriptions`: `user_id`, `plan_id`, `status`, `current_period_end`, mã giao dịch.
- `reading_history`: câu hỏi, kiểu trải, các lá, bài đọc, ngày tạo.
- `usage_events`: ghi số lần gọi API, model và chi phí ước tính.

API `/api/read` và `/api/chat` phải đọc gói từ Supabase bằng `user_id` đã xác thực. Không tin dữ liệu gói do trình duyệt gửi lên.

Vai trò quản trị được lưu tại `app_metadata.role = "admin"`. Metadata này chỉ được gán bằng quyền quản trị Supabase. Tài khoản admin luôn được xem như có quyền cao hơn Pro Max.

## Quyền dự kiến

| Gói | Kiểu trải | Model | Phong cách | Lịch sử |
| --- | --- | --- | --- | --- |
| Free | 3 lá | GPT-5.6 Sol hoặc model tiêu chuẩn | Không | Không lưu |
| Plus | 3, 6, 10 lá | GPT-6 Astra | Có | 5 |
| Pro | Thêm tùy chọn 1–78 và Lenormand | GPT-6 Astra | Có | 10 |
| Pro Max | Tất cả dịch vụ | GPT-6 Astra, ưu tiên cao nhất | Có | Trên 20 |

Giá tuần đã chốt: Plus 29.000đ, Pro 39.000đ, Pro Max 59.000đ.

## WebVer2 — thanh toán

- Chọn nhà cung cấp thanh toán hỗ trợ nhu cầu thực tế.
- Tạo giao dịch ở server, không tạo trực tiếp từ trình duyệt.
- Chỉ nâng gói sau khi webhook thanh toán hợp lệ được xác minh.
- Lưu mã giao dịch duy nhất để webhook gửi lại không cộng gói hai lần.

## WebVer3 trở đi

- Lenormand.
- Bản đồ sao.
- Tử vi.
- Trang quản trị người dùng, lượt dùng, doanh thu và chi phí API.
