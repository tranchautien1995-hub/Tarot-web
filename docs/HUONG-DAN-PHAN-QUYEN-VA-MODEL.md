# Cấu hình gói dịch vụ và model cho WebVer1.2

## 1. Khai báo model trong `.env.local`

Tạo hoặc mở file `.env.local` ở thư mục gốc của dự án, cùng cấp với `package.json`, rồi thêm:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

XAH_API_KEY=YOUR_XAH_API_KEY
XAH_BASE_URL=https://api.xah.io/v1
XAH_FREE_MODEL=gpt-5.6-sol
XAH_PREMIUM_MODEL=gpt-6-astra
```

Không đưa `.env.local` lên GitHub. Sau khi sửa file, phải tắt và chạy lại `npm run dev` hoặc deploy lại website.

Nếu XAH báo không tìm thấy model, mở danh sách model trong tài khoản XAH và thay giá trị bằng đúng model ID mà XAH cung cấp. Code không tự đổi model ID.

## 2. Quyền đang được áp dụng

| Gói | Kiểu trải | Phong cách | Lịch sử trên trình duyệt | Model |
| --- | --- | --- | --- | --- |
| Free | 3 lá | Không | 0 | `XAH_FREE_MODEL` |
| Plus | 3, 6, 10 lá | Có | 5 | `XAH_PREMIUM_MODEL` |
| Pro | Tất cả, gồm tùy chọn | Có | 10 | `XAH_PREMIUM_MODEL` |
| Pro Max | Tất cả | Có | 25 | `XAH_PREMIUM_MODEL` |
| Admin | Tất cả | Có | 50 trên trình duyệt | `XAH_PREMIUM_MODEL` |

Khóa kiểu trải, phong cách và model được kiểm tra lại ở API. Người dùng không thể chỉ sửa giao diện trình duyệt để gọi model Premium.

## 3. Tài khoản mới

Tài khoản mới không có `subscription_plan` trong `app_metadata` sẽ tự động là Free. Không cần chạy SQL cho tài khoản Free.

## 4. Cấp Plus, Pro hoặc Pro Max thủ công khi cần hỗ trợ

1. Mở Supabase Dashboard.
2. Chọn đúng project của `tarotbytien.io.vn`.
3. Vào **SQL Editor**.
4. Mở file `docs/SET-USER-PLAN.sql` trong source.
5. Đổi `target_email` thành email khách.
6. Đổi `target_plan` thành `plus`, `pro` hoặc `pro_max`.
7. Bấm **Run**.
8. Yêu cầu khách đăng xuất rồi đăng nhập lại.

## 5. Tạo tài khoản Admin

1. Tạo tài khoản bằng giao diện website trước.
2. Vào Supabase **SQL Editor**.
3. Mở `docs/CREATE-ADMIN.sql`.
4. Kiểm tra email Admin trong file.
5. Bấm **Run**.
6. Đăng xuất rồi đăng nhập lại tài khoản Admin.

Admin không còn được cấp chỉ vì website chạy ở localhost. Nếu `.env.local` có Supabase, mọi tài khoản trên localhost vẫn dùng đúng gói thật của nó.

## 6. Kiểm tra trước khi đưa lên web

1. Đăng nhập một tài khoản mới: chỉ chọn được 3 lá, không dùng phong cách, không lưu lịch sử.
2. Đọc 3 lá và kiểm tra log XAH: request phải dùng `gpt-5.6-sol`.
3. Thử gọi 6 lá bằng tài khoản Free: API phải trả lỗi 403.
4. Cấp Plus bằng SQL, đăng nhập lại: mở được 3, 6, 10 lá và lưu tối đa 5 bài.
5. Đăng nhập Admin: tất cả tùy chọn phải mở.

## 7. Giới hạn hiện tại

Lịch sử đang lưu theo từng user ID trong `localStorage` của trình duyệt. Giới hạn gói đã hoạt động, nhưng lịch sử chưa đồng bộ giữa điện thoại và máy tính. Muốn quản lý lịch sử tập trung trong Supabase cần tạo bảng lịch sử và Row Level Security ở bản tiếp theo.

Thanh toán tự động được cấu hình theo `docs/HUONG-DAN-SEPAY-TU-DONG.md`. File SQL cấp gói thủ công chỉ dùng cho Admin, khuyến mãi hoặc xử lý hỗ trợ đặc biệt.
