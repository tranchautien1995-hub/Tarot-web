# WebVer2.2 Full

WebVer2.2 là bản chính thức kế tiếp từ WebVer2.1. Toàn bộ giao diện, tính năng, API và prompt của WebVer2.1 được giữ nguyên; phiên bản này tập trung sửa lỗi trình duyệt mobile.

## Thay đổi chính

- Bổ sung viewport chuẩn cho iPhone, Safari và vùng safe-area.
- Sắp xếp lại thanh menu và điều hướng sản phẩm trên màn hình hẹp.
- Ngăn chữ, nút, tiêu đề và chỉ báo bước chồng lên nhau.
- Các nhóm nút phong cách đọc, cách lấy bài, kiểu trải và thao tác đọc bài co giãn theo chiều rộng màn hình.
- Tên vị trí trải bài dài tự xuống dòng và giữ đúng căn lề giữa số thứ tự với nội dung.
- Ba lá bài hiển thị vừa màn hình; trải nhiều lá dùng thanh vuốt ngang.
- Tắt hover của bộ bài trên thiết bị cảm ứng.
- Xóa focus/hover giả của Safari sau khi chạm chọn bài, ngăn lá bên cạnh tự nhấc lên.

## Chạy local

1. Sao chép `.env.example` thành `.env.local` và điền các biến cần thiết.
2. Chạy `npm install`.
3. Chạy `npm run dev`.
4. Mở `http://localhost:3000`.

## Deploy

- Không đưa `.env.local` lên GitHub.
- Thêm các biến môi trường tương ứng trong Vercel.
- Supabase giữ nguyên cấu hình của WebVer2.1.

