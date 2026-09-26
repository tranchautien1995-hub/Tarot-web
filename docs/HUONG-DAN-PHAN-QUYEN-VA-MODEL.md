# Cấu hình gói dịch vụ, model và lượt đọc cho WebVer1.9

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

| Gói | Kiểu trải Tarot | Giới hạn theo ngày | Phong cách | Lịch sử | Model |
| --- | --- | --- | --- | --- | --- |
| Free | 3 lá | Không đặt giới hạn riêng cho 3 lá | Không | 0 | `XAH_FREE_MODEL` |
| Plus | 3, 6, 10 lá | 6 lá: 3; 10 lá: 1 | Có | 5 | `XAH_PREMIUM_MODEL` |
| Pro | 3, 6, 10 lá | 6 lá: 5; 10 lá: 3 | Có | 10 | `XAH_PREMIUM_MODEL` |
| Pro Max | 3, 6, 10 lá và các trải chuyên sâu | Không giới hạn | Có | 25 | `XAH_PREMIUM_MODEL` |
| Admin | Toàn bộ | Không giới hạn | Có | Không giới hạn | `XAH_PREMIUM_MODEL` |

Khóa kiểu trải, phong cách và model được kiểm tra lại ở API. Người dùng không thể chỉ sửa giao diện trình duyệt để gọi model Premium.

Quyền Lenormand đã được chuẩn bị cho Pro, Pro Max và Admin. Quyền Bản đồ sao thuộc Pro Max và Admin. Hai công cụ này chỉ hoạt động khi module tương ứng được phát hành; hiện tại tab sản phẩm vẫn ở trạng thái chờ phát triển.

## 3. Cài bộ đếm lượt theo ngày

Trước khi deploy bản này, mở Supabase Dashboard → SQL Editor và chạy toàn bộ file:

```text
docs/SUPABASE-DAILY-READING-LIMITS.sql
```

Bộ đếm dùng giờ Việt Nam và tự chuyển sang ngày mới lúc 00:00. Việc tăng lượt chạy bằng hàm SQL nguyên tử nên hai yêu cầu gửi gần nhau không thể cùng vượt giới hạn.

## 4. Tài khoản mới

Tài khoản mới không có `subscription_plan` trong `app_metadata` sẽ tự động là Free. Không cần chạy SQL cho tài khoản Free.

## 5. Cấp Plus, Pro hoặc Pro Max thủ công khi cần hỗ trợ

1. Mở Supabase Dashboard.
2. Chọn đúng project của `tarotbytien.io.vn`.
3. Vào **SQL Editor**.
4. Mở file `docs/SET-USER-PLAN.sql` trong source.
5. Đổi `target_email` thành email khách.
6. Đổi `target_plan` thành `plus`, `pro` hoặc `pro_max`.
7. Bấm **Run**.
8. Yêu cầu khách đăng xuất rồi đăng nhập lại.

## 6. Tạo tài khoản Admin

1. Tạo tài khoản bằng giao diện website trước.
2. Vào Supabase **SQL Editor**.
3. Mở `docs/CREATE-ADMIN.sql`.
4. Kiểm tra email Admin trong file.
5. Bấm **Run**.
6. Đăng xuất rồi đăng nhập lại tài khoản Admin.

Admin không còn được cấp chỉ vì website chạy ở localhost. Nếu `.env.local` có Supabase, mọi tài khoản trên localhost vẫn dùng đúng gói thật của nó.

## 7. Kiểm tra trước khi đưa lên web

1. Đăng nhập một tài khoản mới: chỉ chọn được 3 lá, không dùng phong cách, không lưu lịch sử.
2. Đọc 3 lá và kiểm tra log XAH: request phải dùng `gpt-5.6-sol`.
3. Thử gọi 6 lá bằng tài khoản Free: API phải trả lỗi 403.
4. Cấp Plus bằng SQL, đăng nhập lại: mở được 3, 6, 10 lá và lưu tối đa 5 bài.
5. Với Plus, đọc 6 lá đủ 3 lần; lần thứ 4 phải báo hết lượt. Đọc 10 lá đủ 1 lần; lần thứ 2 phải bị chặn.
6. Với Pro, lần thứ 6 của trải 6 lá và lần thứ 4 của trải 10 lá phải bị chặn. Các trải chuyên sâu vẫn khóa.
7. Với Pro Max hoặc Admin, các trải chuyên sâu mở và không áp dụng bộ đếm theo ngày.

## 8. Giới hạn hiện tại

Lịch sử đang lưu theo từng user ID trong `localStorage` của trình duyệt. Giới hạn gói đã hoạt động, nhưng lịch sử chưa đồng bộ giữa điện thoại và máy tính. Muốn quản lý lịch sử tập trung trong Supabase cần tạo bảng lịch sử và Row Level Security ở bản tiếp theo.

Thanh toán tự động được cấu hình theo `docs/HUONG-DAN-SEPAY-TU-DONG.md`. File SQL cấp gói thủ công chỉ dùng cho Admin, khuyến mãi hoặc xử lý hỗ trợ đặc biệt.
