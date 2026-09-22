# Tarot 2.7.39 — đăng nhập Facebook

Phát triển từ bản 2.7.38-google-auth (bản đó phát triển từ Tarot-2.7.37). Giữ đăng nhập email/Google, Reader, XAH, giao diện trải bài và các chức năng khác. Chỉ thêm nút Facebook và luồng OAuth trong `components/AuthGate.tsx`, CSS của nút, cùng thông báo lỗi xác thực dùng chung.

## Đưa lên website hiện có

Giải nén ZIP; trong thư mục có `package.json`, sao chép mã nguồn vào repository website hiện tại (giữ thư mục `.git` và các biến môi trường production), commit và push như lần cập nhật website trước. Không đăng `.env.local`, Facebook App Secret hoặc Google Client Secret lên GitHub. Trên Windows chạy `npm install` rồi `npm run dev` để chạy local; `npm run build` để kiểm tra bản production. `npm run` đứng một mình chỉ liệt kê lệnh.

## Thiết lập Facebook

1. Trong Meta Developers → Facebook Login → Cài đặt, thêm **callback URL được hiển thị trong Supabase → Authentication → Sign In / Providers → Facebook** vào danh sách URI chuyển hướng OAuth hợp lệ và lưu. Dạng URL: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Trong Supabase → Authentication → Sign In / Providers → Facebook, bật provider, nhập Meta App ID vào Client ID và Meta App Secret vào Client Secret; lưu.
3. Trong Supabase → Authentication → URL Configuration, Site URL là `https://tarotbytien.io.vn`; Redirect URLs cho phép `https://tarotbytien.io.vn`. Nếu muốn thử bản local, thêm `http://localhost:3000` vào Redirect URLs.
4. Dùng tài khoản Facebook quản trị app Meta thử đăng nhập trên web; vào Supabase → Authentication → Users xem tài khoản. Để khách ngoài nhóm quản trị đăng nhập, hoàn tất yêu cầu phát hành app trong Meta và chuyển ứng dụng sang trạng thái công khai theo hướng dẫn dashboard.

Không cần thêm Facebook App ID/Secret vào `.env.local` của website; chúng nằm trong Supabase. Phải triển khai bản có nút Facebook thì khách mới nhìn thấy nút đăng nhập.
