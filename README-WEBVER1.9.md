# TTarot WebVer1.9 · 2.7.57

Bản full này phát triển trực tiếp từ WebVer1.8 và đồng bộ giao diện bảng giá với quyền thật ở máy chủ.

## Quyền gói

- Free: trải 3 lá, model Sol hoặc model tiêu chuẩn, không có phong cách đọc và không lưu lịch sử.
- Plus: trải 3 lá; 6 lá tối đa 3 lần/ngày; 10 lá tối đa 1 lần/ngày; lưu 5 lịch sử.
- Pro: toàn bộ quyền Plus; 6 lá tối đa 5 lần/ngày; 10 lá tối đa 3 lần/ngày; quyền Lenormand khi module được phát hành; lưu 10 lịch sử. Không có các trải Tarot chuyên sâu và không có quyền không giới hạn.
- Pro Max: toàn bộ quyền Pro; mở các trải chuyên sâu, quyền Bản đồ sao, ưu tiên dịch vụ mới và không giới hạn lượt đọc.
- Admin: toàn quyền và không giới hạn để quản lý, kiểm thử.

## Bảo vệ phía máy chủ

- API kiểm tra gói, kiểu trải, số lá và phong cách trước khi gọi model.
- Bộ đếm Plus/Pro được tăng bằng hàm SQL nguyên tử trong Supabase.
- Người dùng không thể vượt lượt bằng cách sửa giao diện hoặc gọi trực tiếp API.
- Lượt hỏi tiếp trong cùng bài đọc không bị tính là một trải mới.
- Ngày sử dụng được làm mới lúc 00:00 theo múi giờ Việt Nam.

## Bắt buộc trước khi deploy

Chạy một lần file `docs/SUPABASE-DAILY-READING-LIMITS.sql` trong Supabase Dashboard → SQL Editor. Nếu tạo project mới, có thể chạy toàn bộ `docs/SUPABASE-SUBSCRIPTIONS.sql`, vì file tổng đã bao gồm phần giới hạn lượt.

Không thay đổi XAH router, prompt Tarot, bộ bài, Supabase Auth hoặc quy trình thanh toán SePay hiện có.
