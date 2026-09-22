# Tarot 2.7.38: đăng nhập Google và thông báo lỗi đăng ký

Bản này phát triển từ ZIP Tarot-2.7.37. Chỉ sửa giao diện và luồng xác thực trong `components/AuthGate.tsx`, CSS cho nút Google và số phiên bản. Reader, XAH, quạt bài và các phần khác giữ nguyên.

## Cập nhật dự án đang chạy

Chép nội dung thư mục có `package.json` vào repository hiện tại, giữ `.git` và các biến môi trường đang dùng. Commit và push lên nhánh production; không đưa `.env.local` vào GitHub hay ZIP.

## Bật Google trên Supabase hiện có

1. Supabase → Authentication → URL Configuration: đặt Site URL thành URL web hiện tại và thêm **đúng origin** `https://ten-mien-cua-ban` vào Redirect URLs. Nếu chạy local, thêm `http://localhost:3000`.
2. Vào Google Cloud Console → Google Auth Platform, thiết lập Branding/Audience cho ứng dụng và tạo OAuth client loại **Web application**. Authorized JavaScript origins: `https://ten-mien-cua-ban`; Authorized redirect URIs: **callback URL lấy ngay trong Supabase → Authentication → Providers → Google** (thường có dạng `https://<project-ref>.supabase.co/auth/v1/callback`). Đây là URL Supabase, không phải URL Vercel.
3. Dán Google Client ID và Client Secret vào Supabase → Authentication → Providers → Google; bật provider và lưu. Client Secret chỉ lưu trong Google/Supabase, không đặt vào Next.js hay GitHub.
4. Nếu màn hình đồng ý của Google còn chế độ Testing, chỉ tài khoản được thêm làm Test users mới đăng nhập được. Chuyển ứng dụng sang Production khi muốn mọi người sử dụng.

## Nếu người khác không đăng ký được bằng email

- Xem lỗi ngay trên form và Supabase → Authentication → Logs. Kiểm tra Authentication → Providers → Email có bật đăng ký.
- Nếu lỗi `Email address not authorized` hoặc không gửi được thư xác nhận cho người ngoài team: cấu hình **custom SMTP** trong Supabase → Authentication → SMTP Settings. SMTP mặc định của Supabase chỉ dành cho thử nghiệm, giới hạn gửi và địa chỉ nhận.
- Nếu lỗi giới hạn gửi email: đợi hết giới hạn hoặc cấu hình custom SMTP và giới hạn gửi phù hợp. Không tắt xác nhận email chỉ để né lỗi SMTP.
- Nếu có tài khoản nhưng chưa vào được: mở thư xác nhận (kể cả Spam); kiểm tra Site URL và Redirect URLs.

Sau khi bật Google trong Supabase, thử đăng nhập bằng một tài khoản Google chưa từng có trên website, sau đó thử đăng ký bằng một email mới khác tài khoản quản trị. Không thể xác nhận hoặc thay đổi cấu hình dashboard Supabase từ mã nguồn ZIP này.
