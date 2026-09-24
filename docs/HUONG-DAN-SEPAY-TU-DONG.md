# Cấu hình thanh toán tự động bằng SePay

WebVer1.4 dùng VietQR để khách chuyển khoản thẳng vào tài khoản ngân hàng của bạn. SePay nhận biến động số dư, gọi webhook của website, sau đó website tự cấp Plus, Pro hoặc Pro Max cho đúng tài khoản.

## 1. Chạy SQL trên Supabase

Mở Supabase Dashboard → SQL Editor → New query, dán toàn bộ file:

`docs/SUPABASE-SUBSCRIPTIONS.sql`

Nhấn Run. File chạy được cho cả dự án mới và dự án đã từng dùng cấu trúc PayOS.

## 2. Kết nối ngân hàng với SePay

1. Đăng nhập `https://my.sepay.vn`.
2. Vào Tài khoản ngân hàng và thêm tài khoản nhận tiền.
3. Chọn cách kết nối mà ngân hàng của bạn hỗ trợ rồi hoàn tất xác minh.
4. Ghi lại mã ngân hàng VietQR và số tài khoản chính xác.

Tài khoản này phải là tài khoản được dùng trong các biến `SEPAY_BANK_CODE` và `SEPAY_ACCOUNT_NUMBER`.

## 3. Cấu hình mã thanh toán

Trong SePay, vào Công ty → Cấu hình chung → Cấu trúc mã thanh toán. Thêm tiền tố:

`TT`

Website tạo nội dung theo dạng `TT` + mã đơn hàng. Không sửa tiền tố này nếu chưa sửa cả code website.

## 4. Tạo webhook SePay

Trong SePay, tạo webhook mới với các giá trị:

- URL: `https://tarotbytien.io.vn/api/payments/webhook`
- Sự kiện: giao dịch tiền vào.
- Content-Type: `application/json`.
- Xác thực: `HMAC-SHA256`.
- Secret Key: tạo một chuỗi bí mật dài, ngẫu nhiên và sao chép ngay.

Không chọn “Không xác thực” trên website production.

## 5. Khai báo biến môi trường

Trên máy local, thêm vào `.env.local`. Trên nơi deploy website, thêm cùng các biến vào phần Environment Variables:

```env
SEPAY_BANK_CODE=MBBank
SEPAY_ACCOUNT_NUMBER=0123456789
SEPAY_ACCOUNT_NAME=NGUYEN VAN A
SEPAY_WEBHOOK_SECRET=CHUOI_BI_MAT_GIONG_HET_TREN_SEPAY
```

`SEPAY_BANK_CODE` là mã ngân hàng dùng cho VietQR, không phải tên bạn tự viết. `SEPAY_WEBHOOK_SECRET` phải giống hoàn toàn Secret Key đã nhập khi tạo webhook.

Sau khi thêm biến trên hosting, redeploy website.

## 6. Kiểm tra trước khi nhận tiền thật

1. Dùng Test mode của SePay để gửi một giao dịch mô phỏng vào webhook.
2. Đăng nhập website bằng tài khoản thử.
3. Vào Nâng cấp, chọn một gói và quét QR.
4. Chuyển đúng số tiền và giữ nguyên nội dung `TT...`.
5. Chờ vài giây. Hộp QR phải báo thành công và website tự tải lại.
6. Vào Supabase → Authentication → Users, kiểm tra `raw_app_meta_data` có `subscription_plan` và `subscription_expires_at`.

## 7. Nếu tiền vào nhưng gói chưa được cấp

Kiểm tra theo thứ tự:

1. Webhook log của SePay có nhận HTTP 200 cùng `{"success": true}` hay không.
2. `SEPAY_WEBHOOK_SECRET` trên hosting có đúng không.
3. Số tài khoản trong webhook có khớp `SEPAY_ACCOUNT_NUMBER` không.
4. Nội dung chuyển khoản có đúng nguyên mã `TT...` không.
5. Số tiền có khớp chính xác đơn hàng không.
6. Bảng `subscription_orders` trong Supabase đang có trạng thái `pending` hay `paid`.

Webhook được chống gọi lại bằng ID giao dịch SePay. Một giao dịch không thể cấp gói nhiều lần.

## Bảo mật

- Không đặt `SUPABASE_SERVICE_ROLE_KEY` hoặc `SEPAY_WEBHOOK_SECRET` trong biến có tiền tố `NEXT_PUBLIC_`.
- Không commit `.env.local` lên GitHub.
- Không dùng endpoint webhook không xác thực ở production.
- Nếu Secret Key bị lộ, đổi key trên SePay và hosting rồi redeploy ngay.
