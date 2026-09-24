# TTarot WebVer1.4

WebVer1.4 giữ nguyên phân quyền, bảng giá, model và prompt của WebVer1.3, đồng thời thay PayOS bằng thanh toán VietQR tự động qua SePay.

## Phần mới

- Hiển thị VietQR ngay trong trang nâng cấp, không chuyển khách sang website thanh toán khác.
- Theo dõi đơn hàng tại chỗ và tự tải lại sau khi gói được kích hoạt.
- Webhook SePay xác thực bằng HMAC-SHA256 trên raw body và giới hạn timestamp 5 phút.
- Kiểm tra đúng tài khoản nhận, đúng mã thanh toán, đúng số tiền và đúng giao dịch tiền vào.
- Chống xử lý trùng bằng ID giao dịch SePay duy nhất trong database.
- Hỗ trợ dark/light và mobile cho hộp thanh toán.

## Cài đặt

1. Chạy `docs/SUPABASE-SUBSCRIPTIONS.sql` trong Supabase SQL Editor.
2. Sao chép `.env.example` thành `.env.local` và điền các biến cần thiết.
3. Làm theo `docs/HUONG-DAN-SEPAY-TU-DONG.md`.
4. Chạy `npm install`, sau đó `npm run dev` để thử local.
5. Thêm cùng biến môi trường lên hosting rồi redeploy.
